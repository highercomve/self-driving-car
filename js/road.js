
const infinity = window.innerHeight * 50;

export class Road {
  constructor(ctx, x, width, laneCount = 3) {
    this.x = x
    this.width = width
    this.laneCount = laneCount
    this.ctx = ctx

    this.left = x - width / 2
    this.right = x + width / 2

    this.top = -infinity
    this.bottom = infinity

    const topLeft = { x: this.left, y: this.top };
    const topRight = { x: this.right, y: this.top };
    const bottomLeft = { x: this.left, y: this.bottom };
    const bottomRight = { x: this.right, y: this.bottom };
    this.borders = [
      [topLeft],
      [topRight]
    ];
    for (let y = -3500; y <= 300; y++) {
      const x = Math.sin(y * 0.009) * 90;
      this.borders[0].push({ x: x + this.left, y: y });
      this.borders[1].push({ x: x + this.right, y: y });
    }
    this.borders[0].push(bottomLeft);
    this.borders[1].push(bottomRight);
  }

  getLaneCenter = (laneIndex) => {
    const laneWidth = this.width / this.laneCount;
    return this.left + laneWidth / 2 +
      Math.min(laneIndex, this.laneCount - 1) * laneWidth;
  }

  setCtx = (ctx) => {
    this.ctx = ctx
  }

  draw = () => {
    const ctx = this.ctx
    ctx.lineWidth = 5
    ctx.strokeStyle = "white"

    // for (let i = 1; i < this.laneCount; i++) {
    //   const x = lerp(this.left, this.right, i / this.laneCount)
    //   ctx.setLineDash([20, 20])
    //   ctx.beginPath();
    //   ctx.moveTo(x, this.top);
    //   ctx.lineTo(x, this.bottom);
    //   ctx.stroke();
    // }

    // ctx.setLineDash([]);
    // this.borders.forEach(border => {
    //   ctx.beginPath();
    //   ctx.moveTo(border[0].x, border[0].y);
    //   ctx.lineTo(border[1].x, border[1].y);
    //   ctx.stroke();
    // });

    ctx.setLineDash([20,20]);
    this.borders.forEach(border=>{
       ctx.beginPath();
       ctx.moveTo(border[0].x,border[0].y);
       for(let i=1;i<border.length;i++){
          ctx.lineTo(border[i].x,border[i].y);
       }
       ctx.stroke();
    });
    ctx.setLineDash([]);
  }
}