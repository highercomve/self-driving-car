importScripts("network.js")

onmessage = (e) => {
  const [inputs, brain] = e.data
  postMessage(NeuralNetwork.feedForward(inputs, brain));
};