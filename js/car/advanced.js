import { Sensor } from '../sensor/advanced_rays.js'
import { subtract, normalize, dot, cross, distance } from '../lib/point.js'

const defaultCarOptions = {
  acc: 0.02,
  maxSpeed: 2.5,
  friction: 0.005,
  drawSensor: false,
  hasSensor: true,
  hasBrain: true
}

const sensorMap = s => s == null ? 0 : 1 - s.offset
const angleSpeed = 1 / 20

export class Car {
  x = 0
  y = 0
  startX = 0
  startY = 0
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
  offsets = []
  dToTarget = 0

  constructor(ctx, x, y, width = 30, height = 50, controls, opts = {}, color = "white", brain, id = 0) {
    this.x = x
    this.y = y
    this.startX = x
    this.startY = y
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
      const sensorOptions = {
        "rayCount": 7,
        "rayLength": 250,
        "raySpread": 2.1,
        "rayOffset": 0
      }
      this.sensor = new Sensor(this.ctx, this, sensorOptions)
      this.carSensor = new Sensor(this.ctx, this, {
          rayCount: 20,
          rayLength: sensorOptions.rayLength,
          raySpread: Math.PI * 0.6,
          rayOffset: -Math.PI / 4,
      });
    }
    if (options.hasBrain && !brain) {
      const hiddenLevel = window.APP_HIDDEN_LEVELS.split(',').map(x => Number(x)).filter(x => x > 0)
      const initialLevelInputs = this.sensor.rayCount + 3
      const levels = [initialLevelInputs, initialLevelInputs + 2, initialLevelInputs + 2, ...hiddenLevel]
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
    const carDir = normalize(
        subtract(this.polygon[3], this.polygon[0])
    );
    const dirToTarget = normalize(subtract(this, { x: this.startX, y: this.startY }));
    const targetDot = dot(carDir, dirToTarget);
    const crossProduct = cross(carDir, dirToTarget);
    const angleFeature = (Math.acos(targetDot) * Math.sign(crossProduct)) / Math.PI;

    this.offsets = [
      ...this.sensor.readings.map(sensorMap),
      Math.max(...this.carSensor.readings.map(sensorMap)),
      this.speed / this.maxSpeed,
      angleFeature
    ]

    return this.offsets
  }

  update = (roadBorders, traffic = []) => {
    if (this.damaged) {
      return
    }

    this.polygon = this.createPolygon()
    if (this.hasSensor) {
      this.damaged = this.#assessDamage(roadBorders, traffic)
    }

    if (this.sensor) {
      this.sensor.update(roadBorders.map((s) => [s.p1, s.p2]))
      const carBoarders = traffic.reduce((acc, c) => {
        if (c.polygon.length === 0) { return acc }

        acc.push([c.polygon[0], c.polygon[1]])
        acc.push([c.polygon[1], c.polygon[2]])
        acc.push([c.polygon[2], c.polygon[3]])
        acc.push([c.polygon[3], c.polygon[0]])

        return acc
      }, [])
      this.carSensor.update(carBoarders)
    }

    if (this.brain && this.sensor) {
      NeuralNetworkPrediction.calculate(this.updateFromPrediction, this.getOffsets(), this.brain)
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
      this.carSensor.draw(ctx);
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

  createPolygon() {
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

    const prevPos = { x: this.x, y: this.y }
    this.x -= Math.sin(this.angle) * this.speed
    this.y -= Math.cos(this.angle) * this.speed

    const d = Math.abs(distance(this, prevPos))
    const dToTarget = Math.abs(distance(this, { x: this.startX, y: this.startY }))
    const dPoints = dToTarget > this.dToTarget ? dToTarget : 1000 - dToTarget
    this.score = this.score + (((d  + dPoints/dToTarget) * (this.speed / this.maxSpeed)) / 1000)
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
