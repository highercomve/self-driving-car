import { Sensor } from './sensor.js'

const defaultCarOptions = {
  acc: 0.2,
  maxSpeed: 2.5,
  friction: 0.05,
  drawSensor: false,
  hasSensor: true,
  hasBrain: true
}

const angleSpeed = 1 / 100
const TWO_PI = 2 * Math.PI
export class Car {
  x = 0
  y = 0
  width = 30
  height = 50
  color = "black"
  poligon = []
  damaged = false
  sensor = undefined
  brain = undefined

  constructor(ctx, x, y, width = 30, height = 50, controls, opts = {}, color = "white") {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.color = color
    this.ctx = ctx

    const options = { ...defaultCarOptions, ...opts }
    this.speed = 0
    this.angle = 0
    this.acceleration = options.acc
    this.maxSpeed = options.maxSpeed
    this.friction = options.friction
    this.drawSensor = options.drawSensor
    this.img = new Image()
    this.img.src = "public/car.png"

    this.controls = controls
    if (options.hasSensor) {
      this.sensor = new Sensor(this.ctx, this)
    }
    if (options.hasBrain) {
      const hiddenLevel = window.APP_HIDDEN_LEVELS.split(',').map(x => Number(x)).filter(x => x > 0)
      const levels = [this.sensor.rayCount + 2, ...hiddenLevel]
      this.brain = new NeuralNetwork(levels)
    }

    this.#createMask()
    this.img.onload = () => {
      this.#drawMask(color)
    }
  }

  getScore = (traffic = []) => {
    return Math.abs(this.y / traffic.length) * (traffic.reduce((acc, t) => t.y > this.y ? acc + 1 : acc, 0) + 1)
  }

  getOffsets = () => {
    const theta = this.angle - TWO_PI * Math.floor((this.angle + Math.PI) / TWO_PI)
    return [...this.sensor.readings.map(
      s => s == null ? 0 : 1 - s.offset
    ), theta, this.speed / this.maxSpeed]
  }

  update = (road, traffic = []) => {
    if (this.damaged) {
      return
    }
    
    this.poligon = this.#createPolygon()
    this.damaged = this.#assessDamage(road.borders, traffic)

    if (this.sensor) {
      this.sensor.update(road, traffic)
    }

    if (this.brain && this.sensor) {
      NeuralNetworkPrediction.calculate((o, network) => {
        this.controls.update(o)
        this.brain = network
        this.#move()
      }, this.getOffsets(), this.brain)
    } else {
      this.#move()
    }
  }

  draw = () => {
    const ctx = this.ctx
    if (this.sensor && this.drawSensor) {
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
    for (let i = 0; i < roadBorders.length; i++) {
      if (polyIntersection(this.poligon, roadBorders[i])) {
        return true
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      if (polyIntersection(this.poligon, traffic[i].poligon)) {
        return true
      }
    }

    return false
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
