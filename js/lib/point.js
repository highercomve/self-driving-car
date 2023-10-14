export class Point {
   constructor(x, y) {
      this.x = x;
      this.y = y;
   }

   equals(point) {
      return this.x == point.x && this.y == point.y;
   }

   draw(ctx, { size = 18, color = "black", outline = false, fill = false } = {}) {
      const rad = size / 2;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
      ctx.fill();
      if (outline) {
         ctx.beginPath();
         ctx.lineWidth = 2;
         ctx.strokeStyle = "yellow";
         ctx.arc(this.x, this.y, rad * 0.6, 0, Math.PI * 2);
         ctx.stroke();
      }
      if (fill) {
         ctx.beginPath();
         ctx.arc(this.x, this.y, rad * 0.4, 0, Math.PI * 2);
         ctx.fillStyle = "yellow";
         ctx.fill();
      }
   }
}

export function distance(p1, p2) {
   return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function average(p1, p2) {
   return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

export function add(p1, p2) {
   return new Point(p1.x + p2.x, p1.y + p2.y);
}

export function subtract(p1, p2) {
   return new Point(p1.x - p2.x, p1.y - p2.y);
}

export function scale(p, scaler) {
   return new Point(p.x * scaler, p.y * scaler);
}

export function translate(loc, angle, offset) {
   return new Point(
      loc.x + Math.cos(angle) * offset,
      loc.y + Math.sin(angle) * offset
   );
}

export function getNearestPoint(loc, points, threshold = Number.MAX_SAFE_INTEGER) {
   let minDist = Number.MAX_SAFE_INTEGER;
   let nearest = null;
   for (const point of points) {
      const dist = distance(point, loc);
      if (dist < minDist && dist < threshold) {
         minDist = dist;
         nearest = point;
      }
   }
   return nearest;
}