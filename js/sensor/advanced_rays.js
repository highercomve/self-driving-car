import { dot, normalize, subtract, perpendicular } from "../lib/point.js";

export class Sensor {
  debug = false

  constructor(ctx, car, config = {}) {
    const {
      rayCount = 5,
      rayLength = 150,
      raySpread = Math.PI / 2,
      rayOffset = 0,
    } = config
    this.car = car
    this.rayCount = rayCount;
    this.rayLength = rayLength;
    this.raySpread = raySpread;
    this.rayOffset = rayOffset;

    this.ctx = ctx
    this.rays = []
    this.readings = []
  }

  update = (boarders, minDotAngle = -1) => {
    this.#castRays()
    this.#getReadings(boarders, minDotAngle)
  }

  #getReadings(boarders, minDotAngle) {
    this.readings = [];
    for (let i = 0; i < this.rays.length; i++) {
      this.readings.push(this.#getReading(this.rays[i], boarders, minDotAngle));
    }
  }

  #getReading(ray, boarders, minDotAngle) {
    let touches = [];

    for (let i = 1; i < boarders.length; i++) {
      const touch = getIntersection(
        ray[0],
        ray[1],
        boarders[i][0],
        boarders[i][1]
      );
      if (touch) {
        const angle = dot(
          normalize(subtract(ray[0], ray[1])),
          normalize(
            perpendicular(
              subtract(boarders[i][0], boarders[i][1])
            )
          )
        );
        if (angle >= minDotAngle) {
          touches.push(touch);
        }
      }
    }

    if (touches.length == 0) {
      return null;
    } else {
      const minOffset = Math.min(...touches.map(e => e.offset));
      return touches.find(e => e.offset == minOffset);
    }
  }

  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        this.rayOffset +
        lerp(
          this.raySpread / 2,
          -this.raySpread / 2,
          this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
        ) +
        this.car.angle;

      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: this.car.x - Math.sin(rayAngle) * this.rayLength,
        y: this.car.y - Math.cos(rayAngle) * this.rayLength,
      };
      this.rays.push([start, end]);
    }
  }

  draw = () => {
    const ctx = this.ctx
    for (let i = 0; i < this.rayCount; i++) {
      if (this.readings[i]) {
        this.ctx.globalAlpha = 0.1

        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.car.color;

        ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
        ctx.lineTo(this.readings[i].x, this.readings[i].y);
        ctx.stroke();
        this.ctx.globalAlpha = 0.6
        ctx.setLineDash([])
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.car.color;
        ctx.arc(this.readings[i].x, this.readings[i].y, 4, 0, 2 * Math.PI);
        ctx.stroke();

        this.ctx.globalAlpha = 1
      }
    }
  }
}