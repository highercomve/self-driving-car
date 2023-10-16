import { Sensor } from '../sensor/advanced_rays.js'

const defaultCarOptions = {
  acc: 0.2,
  maxSpeed: 2.5,
  friction: 0.05,
  drawSensor: false,
  hasSensor: true,
  hasBrain: true
}

const angleSpeed = 1 / 50
const TWO_PI = 2 * Math.PI
export class Car {
  x = 0
  y = 0
  width = 30
  height = 50
  color = "black"
  polygon = []
  damaged = false
  sensor = undefined
  brain = undefined
  fitness = 0
  score = 0
  id = 0
  swiched = false

  constructor(ctx, x, y, width = 30, height = 50, controls, opts = {}, color = "white", brain, id = 0) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.color = color
    this.ctx = ctx
    this.id = id

    const options = { ...defaultCarOptions, ...opts }
    this.speed = 0
    this.angle = -Math.PI/2
    this.acceleration = options.acc
    this.maxSpeed = options.maxSpeed
    this.friction = options.friction
    this.drawSensor = options.drawSensor
    this.img = new Image()
    this.img.src = "public/car.png"
    this.hasSensor = options.hasSensor
    this.hasBrain = options.hasBrain

    this.controls = controls
    if (options.hasSensor) {
      this.sensor = new Sensor(this.ctx, this)
    }
    if (options.hasBrain && !brain) {
      const hiddenLevel = window.APP_HIDDEN_LEVELS.split(',').map(x => Number(x)).filter(x => x > 0)
      const levels = [this.sensor.rayCount, this.sensor.rayCount * 2, ...hiddenLevel]
      this.brain = new NeuralNetwork(levels, this.id)
    }

    if (brain) {
      this.brain = brain
    }

    this.#createMask()
    this.img.onload = () => {
      this.#drawMask(color)
    }
  }

  mutate = (rate) => {
    this.brain.mutate(rate)
  }

  getScore = (traffic = []) => {
    return this.score
    // return Math.abs(this.y / 1) * Math.abs((this.speed / this.maxSpeed)) * (traffic.reduce((acc, t) => t.y > this.y ? acc + 1 : acc, 0) + 0.03)
  }

  getOffsets = () => {
    return [
      ...this.sensor.readings.map(s => s == null ? 0 : 1 - s.offset)
    ]
  }

  update = (roadBorders, traffic = []) => {
    if (this.damaged) {
      return
    }
    this.score += 0.1 * (this.speed > 0 ? 1 : 0)

    this.polygon = this.#createPolygon()
    if (this.hasSensor) {
      this.damaged = this.#assessDamage(roadBorders, traffic)
    }

    if (this.sensor) {
      this.sensor.update(roadBorders, traffic)
    }

    if (this.brain && this.sensor) {
      NeuralNetworkPrediction.calculate(this.updateFromPrediction, this.getOffsets(), copyObject(this.brain))
    }

    this.#move()
  }

  updateFromPrediction = (o, brain) => {
    this.controls.update(o)
    this.brain = brain
  }

  draw = (withSensor = true) => {
    const ctx = this.ctx
    if (this.sensor && this.drawSensor && withSensor) {
      this.sensor.draw(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);

    if (!this.damaged) {
      ctx.drawImage(
        this.mask,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      )
      ctx.globalCompositeOperation = "multiply";
    }

    ctx.drawImage(
      this.img,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }

  #createPolygon() {
    const rad = Math.hypot(this.width, this.height) / 2
    const alpha = Math.atan2(this.width, this.height)
    const points = [
      {
        x: this.x - Math.sin(this.angle - alpha) * rad,
        y: this.y - Math.cos(this.angle - alpha) * rad
      },
      {
        x: this.x - Math.sin(this.angle + alpha) * rad,
        y: this.y - Math.cos(this.angle + alpha) * rad
      },
      {
        x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
        y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
      },
      {
        x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
        y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
      }
    ]

    return points;
  }

  #createMask() {
    this.mask = document.createElement("canvas");
    this.mask.width = this.width;
    this.mask.height = this.height;
  }

  #calculateSpeed = () => {
    if (this.controls.forward) {
      this.speed += this.acceleration
    }

    if (this.controls.reverse) {
      this.speed -= this.acceleration
    }

    // cap forward speed
    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed
    }

    // cap rever speed
    if (this.speed < - this.maxSpeed / 2) {
      this.speed = - this.maxSpeed / 2
    }

    // slow down when forward is release
    if (this.speed > 0) {
      this.speed -= this.friction
    }

    // slow down when reverse is release
    if (this.speed < 0) {
      this.speed += this.friction
    }

    // stop the car when is to slow
    if (Math.abs(this.speed) <= this.friction) {
      this.speed = 0
    }
  }

  #calculateAngle = () => {
    const moving = this.speed != 0 ? 1 : 0
    const flip = this.speed > 0 ? 1 : -1
    const direction = this.controls.left ? 1 : this.controls.right ? -1 : 0
    this.angle += direction * angleSpeed * flip * moving
  }

  #move = () => {
    this.#calculateSpeed()
    this.#calculateAngle()

    this.x -= Math.sin(this.angle) * this.speed
    this.y -= Math.cos(this.angle) * this.speed
  }


  #assessDamage(roadBorders, traffic) {
    const boarders = roadBorders.map((s) => [s.p1, s.p2]);
    for (let i = 0; i < boarders.length; i++) {
      const intersect = polysIntersect(this.polygon, boarders[i])
      if (intersect) {
         return true;
      }
   }
   for (let i = 0; i < traffic.length; i++) {
      const poly = traffic[i].polygon;
      if (polysIntersect(
         [...this.polygon, this.polygon[0]],
         [...poly, poly[0]])
      ) {
         return true;
      }
   }
   return false;
  }

  #drawMask(color) {
    const maskCtx = this.mask.getContext("2d");

    maskCtx.fillStyle = color;
    maskCtx.rect(0, 0, this.width, this.height);
    maskCtx.fill();

    maskCtx.globalCompositeOperation = "destination-atop";
    maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
  }
}
