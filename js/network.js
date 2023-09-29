const numerOfCPU = navigator.hardwareConcurrency

class NeuralNetwork {
  levels = []

  constructor(neuronCounts = []) {
    neuronCounts.push(4)
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(
        new Level(
          neuronCounts[i],
          neuronCounts[i + 1],
          (i - neuronCounts.length - 2) <= 0
        )
      )
    }
  }

  static feedForward(inputs, network) {
    let outputs = Level.feedForward(
      inputs,
      network.levels[0]
    )

    for (let i = 1; i < network.levels.length; i++) {
      outputs = Level.feedForward(
        outputs,
        network.levels[i]
      )
    }

    return outputs
  }

  static mutate(network, amount = 1) {
    network.levels.forEach(level => {
      for (let i = 0; i < level.biases.length; i++) {
        level.biases[i] = lerp(
          level.biases[i],
          Math.random() * 2 - 1,
          amount
        )
      }
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          level.weights[i][j] = lerp(
            level.weights[i][j],
            Math.random() * 2 - 1,
            amount
          )
        }
      }
    });
  }
}

class Level {
  weights = []

  constructor(inputCount, outputCount, lastLevel = false) {
    this.inputs = new Array(inputCount)
    this.outputs = new Array(outputCount)
    this.biases = new Array(outputCount)
    this.lastLevel = lastLevel
  
    for (let i = 0; i < inputCount; i++) {
      this.weights[i] = new Array(outputCount)
    }

    Level.randomize(this)
  }

  static randomize(level) {
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = Math.random() * 2 - 1
      }
    }

    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = Math.random() * 2 - 1
    }
  }

  static lastFeed(inputs) {
    return [
      Level.isActive(inputs[0], inputs[3]),
      Level.isActive(inputs[1], inputs[2]),
      Level.isActive(inputs[2], inputs[1]),
      Level.isActive(inputs[3], inputs[0]),
    ]
  }

  static isActive(a, b) {
    const is = a - b
    return (is > 0.6) ? 1 : 0
  }

  static feedForward(inputs, level, lastLevel = false) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = inputs[i]
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i]
      }

      level.outputs[i] = linearCalculation(sum, level.biases[i])
    }

    if (lastLevel) {
      level.outputs = Level.lastFeed(level.outputs)
    }
  
    return level.outputs
  }
}

function lessThanbias(sum, bias) {
  return sum > bias ? 1 : 0
}
function linearCalculation(sum, bias) {
  return sum + bias > 0 ? 1 : 0
}

function sumCalculation(sum, bias) {
  return sum + bias
}

function sigmoid(sum, bias) {
  const x = sum + bias
  return isNaN(x) ? 0 : (1 / (1 + (x * x)))
}