importScripts("network.js")

onmessage = (e) => {
  const [inputs, network] = e.data
  postMessage(NeuralNetwork.feedForward(inputs, network));
};