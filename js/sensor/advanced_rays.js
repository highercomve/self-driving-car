export class Sensor {
  debug = false

  constructor(ctx, car, rayCount = 0) {
    this.car = car
    this.rayCount = rayCount === 0 ? window.APP_SENSORS : rayCount
    this.rayLength = 200
    this.raySpread = Math.PI / 1.8

    this.ctx = ctx
    this.rays = []
    this.readings = []
  }

  update = (roadBorders, traffic) => {
    this.#castRays()
    this.#getReadings(roadBorders, traffic)
  }

  #getReadings(roadBorders, traffic) {
    this.readings = [];
    for (let i = 0; i < this.rays.length; i++) {
      this.readings.push(this.#getReading(this.rays[i], roadBorders, traffic));
    }
  }

  #getReading(ray, roadBorders, traffic = []) {
    let touches = [];
    const boarders = roadBorders.map((s) => [s.p1, s.p2]);

    for (let i = 1; i < boarders.length; i++) {
      const touch = getIntersection(
        ray[0],
        ray[1],
        boarders[i][0],
        boarders[i][1]
      );
      if (touch) {
        touches.push(touch);
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      const poly = traffic[i].polygon
      for (let j = 0; j < poly.length; j++) {
        const touch = getIntersection(ray[0], ray[1], poly[j], poly[(j + 1) % poly.length])
        if (touch) {
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
    this.rays = []
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle = lerp(
        this.raySpread / 2,
        -this.raySpread / 2,
        this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
      ) + this.car.angle

      const start = {
        x: this.car.x,
        y: this.car.y
      }
      const end = {
        x: this.car.x - Math.sin(rayAngle) * this.rayLength,
        y: this.car.y - Math.cos(rayAngle) * this.rayLength
      }
      this.rays.push([start, end])
    }
  }

  draw = () => {
    const ctx = this.ctx
    for (let i = 0; i < this.rayCount; i++) {
      if (this.readings[i]) {
        this.ctx.globalAlpha = 0.4
        
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.car.color;

        ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
        ctx.lineTo(this.readings[i].x, this.readings[i].y);
        ctx.stroke();

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