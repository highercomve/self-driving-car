
let workerList = [];

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
  return A + (B - A) * t;
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

window.workeractivated = false
class NeuralNetworkPrediction {
  static calculate(fn = console.log, inputs, network) {
    if (workerList.length > 0 && window.workeractivated ) {
      const worker = workerList.find((w) => !w.inUse) || workerList[0]
      worker.inUse = true
      worker.w.postMessage([inputs, network])
      worker.w.onmessage = (e) => {
        fn(e.data, network)
        worker.inUse = false
      }
    } else {
      const outputs = NeuralNetwork.feedForward(inputs, network)
      fn(outputs, network)
    }
  }
}