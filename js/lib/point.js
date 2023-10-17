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

export function getNearestSegment(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
   let minDist = Number.MAX_SAFE_INTEGER;
   let nearest = null;
   for (const seg of segments) {
      const dist = seg.distanceToPoint(loc);
      if (dist < minDist && dist < threshold) {
         minDist = dist;
         nearest = seg;
      }
   }
   return nearest;
}
export function getNearestSegments(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
   let nearest = [];
   for (const seg of segments) {
      const dist = seg.distanceToPoint(loc);
      if (dist < threshold) {
         nearest.push(seg);
      }
   }
   nearest.sort((a,b)=>a.distanceToPoint(loc)-b.distanceToPoint(loc));
   return nearest;
}

export function distance(p1, p2) {
   return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function average(p1, p2) {
   return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2,false);
}

export function dot(p1, p2) {
   return p1.x * p2.x + p1.y * p2.y;
}

//new
export function cross(p1, p2) {
   return p1.x * p2.y - p1.y * p2.x;
}

export function add(p1, p2,round=true) {
   return new Point(p1.x + p2.x, p1.y + p2.y,round);
}

export function subtract(p1, p2) {
   return new Point(p1.x - p2.x, p1.y - p2.y);
}

export function scale(p, scaler) {
   return new Point(p.x * scaler, p.y * scaler,false);
}

export function normalize(p) {
   return scale(p, 1 / magnitude(p));
}

export function magnitude(p) {
   return Math.hypot(p.x, p.y);
}

export function perpendicular(p) {
   return new Point(-p.y, p.x,false);
}

export function translate(loc, angle, offset) {
   return new Point(
      loc.x + Math.cos(angle) * offset,
      loc.y + Math.sin(angle) * offset,
      false
   );
}

export function angle(p) {
   return Math.atan2(p.y, p.x);
}

export function toPolar({ x, y }) {
   return { dir: direction({ x, y }), mag: magnitude({ x, y }) };
}

export function toXY({ mag, dir }) {
   return new Point(Math.cos(dir) * mag, Math.sin(dir) * mag);
}

export function direction({ x, y }) {
   return Math.atan2(y, x);
}
