
let workerList = [];
const numerOfCPU = navigator.hardwareConcurrency
const _2PI = Math.PI * 2;

if (window.Worker) {
  for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
    let newWorker = {
      w: new Worker("js/networkworkers.js"),
      inUse: false,
    };
    workerList.push(newWorker);
  }
}

function lerp(A, B, t) {
  return A + (t * (B - A));
}

function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom != 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t
      }
    }
  }

  return null;
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
class NeuralNetworkPrediction {
  static calculate(fn = console.log, inputs, brain) {
    if (workerList.length > 0 && window.workeractivated) {
      const worker = workerList.find((w) => !w.inUse) || workerList[0]
      worker.inUse = true
      worker.w.postMessage([inputs, brain])
      worker.w.onmessage = (e) => {
        const { outputs, network } = e.data
        if (network.id === brain.id) {
          fn(outputs, network)
        }
        worker.inUse = false
      }
    } else {
      const { outputs, network } = NeuralNetwork.feedForward(inputs, brain)
      fn(outputs, network)
    }
  }
}