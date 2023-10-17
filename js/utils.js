
const numerOfCPU = navigator.hardwareConcurrency
const _2PI = Math.PI * 2;

function angle(p) {
  return Math.atan2(p.y, p.x);
}

function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  const eps = 0.001;
  if (Math.abs(bottom) > eps) {
     const t = tTop / bottom;
     const u = uTop / bottom;
     if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
           x: lerp(A.x, B.x, t),
           y: lerp(A.y, B.y, t),
           offset: t,
        };
     }
  }

  return null;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerp2D(A, B, t) {
  return new Point(lerp(A.x, B.x, t), lerp(A.y, B.y, t),false);
}

function invLerp(a, b, v) {
  return (v - a) / (b - a);
}

function degToRad(degree) {
  return (degree * Math.PI) / 180;
}

function getRandomColor() {
  const hue = 290 + Math.random() * 260;
  return "hsl(" + hue + ", 100%, 60%)";
}

function getFake3dPoint(point, viewPoint, height) {
  const dir = normalize(subtract(point, viewPoint));
  const dist = distance(point, viewPoint);
  const scaler = Math.atan(dist / 300) / (Math.PI / 2);
  return add(point, scale(dir, height * scaler),false);
}


function polyIntersection(poly1, poly2) {
  for (let i = 0; i < poly1.length; i++) {
    for (let j = 0; j < poly2.length; j++) {
      const finalP1 = (i + 1) % poly1.length
      const finalP2 = (j + 1) % poly2.length
      const touch = getIntersection(poly1[i], poly1[finalP1], poly2[j], poly2[finalP2])
      if (touch) {
        return true
      }
    }
  }

  return false
}

function polysIntersect(poly1, poly2) {
  for (let i = 0; i < poly1.length - 1; i++) {
    for (let j = 0; j < poly2.length - 1; j++) {
      const touch = getIntersection(
        poly1[i],
        poly1[i + 1],
        poly2[j],
        poly2[j + 1]
      );
      if (touch) {
        return true;
      }
    }
  }
  return false;
}

function randomProb() {
  return (Math.random() * 2) - 1
}

function randomGaussian(mean, std) {
  var u1 = Math.random();
  var u2 = Math.random();

  var z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(_2PI * u2);
  // var z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(_2PI * u2);

  return z0 * std + mean;
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomFloorFromInterval(min, max) { // min and max included 
  return Math.random() * (max - min + 1) + min
}

function getRandomColor() {
  const hue = 290 + Math.random() * 260;
  return "hsl(" + hue + ", 100%, 60%)";
}

function getRGBA(value) {
  const alpha = Math.abs(value);
  const R = value < 0 ? 0 : 255;
  const G = R;
  const B = value > 0 ? 0 : 255;
  return "rgba(" + R + "," + G + "," + B + "," + alpha + ")";
}

function copyObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}

window.workeractivated = false

function Work(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("js/networkworkers.js")

    worker.onmessage = (e) => {
      resolve(e)
    }

    worker.onerror = (e) => {
      reject(e)
    }
    
    worker.postMessage(data)
  })
}

class NeuralNetworkPrediction {
  static calculate(cb, inputs, brain) {
    if (window.workeractivated) {
      Work([inputs, brain]).then((e) => {
        cb(e.data.outputs, e.data.network)
      })
    } else {
      const { outputs, network } = NeuralNetwork.feedForward(inputs, brain)
      cb(outputs, network)
    }
  }
}