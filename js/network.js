class NeuralNetwork {
  id = 0
  levels = []

  constructor(levels = [], id = 0, output = 4) {
    this.id = id
    levels.push(output)
    for (let i = 0; i < levels.length - 1; i++) {
      this.levels.push(
        new Level(
          levels[i],
          levels[i + 1],
          (i - levels.length - 2) <= 0
        )
      )
    }
  }

  static fromJson(jsonBrain) {
    const n = new NeuralNetwork([], jsonBrain.id)
    n.levels = jsonBrain.levels.map((level) => Level.fromJson(level))
    return n
  }

  static feedForward(inputs, network) {
    let outputs = Level.feedForward(
      inputs,
      network.levels[0],
      network.levels.length == 1 ? linearCalculation : undefined
    )

    for (let i = 1; i < network.levels.length; i++) {
      outputs = Level.feedForward(
        outputs,
        network.levels[i]
      )
    }

    return { outputs, network }
  }

  mutate = (rate = 1) => {
    for (let x = 0; x < this.levels.length; x++) {
      for (let i = 0; i < this.levels[x].biases.length; i++) {
        this.levels[x].biases[i] = Level.mutate(
          this.levels[x].biases[i],
          rate
        )
      }
      for (let i = 0; i < this.levels[x].weights.length; i++) {
        for (let j = 0; j < this.levels[x].weights[i].length; j++) {
          this.levels[x].weights[i][j] = Level.mutate(
            this.levels[x].weights[i][j],
            rate
          )
        }
      }
    }
  }

  static mutate(network, rate = 1) {
    for (let x = 0; x < network.levels.length; x++) {
      for (let i = 0; i < network.levels[x].biases.length; i++) {
        network.levels[x].biases[i] = Level.mutate(
          network.levels[x].biases[i],
          rate
        )
      }
      for (let i = 0; i < network.levels[x].weights.length; i++) {
        for (let j = 0; j < network.levels[x].weights[i].length; j++) {
          network.levels[x].weights[i][j] = Level.mutate(
            network.levels[x].weights[i][j],
            rate
          )
        }
      }
    }
  }
}

class Level {
  weights = []

  constructor(inputCount = 0, outputCount = 0) {
    this.inputs = new Array(inputCount)
    this.outputs = new Array(outputCount)
    this.biases = new Array(outputCount)
  
    for (let i = 0; i < inputCount; i++) {
      this.weights[i] = new Array(outputCount)
    }

    Level.randomize(this)
  }

  static fromJson(levelJson) {
    const level = new Level()
    level.inputs = copyObject(levelJson.inputs)
    level.outputs = copyObject(levelJson.outputs)
    level.biases = copyObject(levelJson.biases)
    level.weights = copyObject(levelJson.weights)

    return level
  }

  static mutate(val, rate) {
    return newRandIf(val, rate)
  }

  static randomize(level) {
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = randomProb()
      }
    }

    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = randomProb()
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

  static feedForward(inputs, level, activationFn = linearCalculation) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = inputs[i]
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i]
      }

      level.outputs[i] = activationFn(sum, level.biases[i])
    }
  
    return level.outputs
  }
}

function lessThanbias(sum, bias) {
  return sum > bias ? 1 : 0
}
function linearCalculation(sum, bias) {
  return sum + bias >= 0 ? 1 : 0
}

function sumCalculation(sum, bias) {
  return sum + bias
}

function ReLU(sum, bias) {
  return Math.max(0, sum + bias)
}

function tanh(sum, bias) {
  const x = sum + bias
  const e = Math.exp(2*x);
  
  return (e - 1) / (e + 1) ;
}

function sigmoid(sum, bias) {
  const x = sum + bias
  return isNaN(x) ? 0 : (1 / (1 + (x * x)))
}

function varitionMutation(val, rate) {
  const variationSign = (randomProb()) > 0 ? 1 : -1
  let newVal = val + (val * variationSign * rate)
  if (newVal > 1) {
    newVal =  val + (val * -1 * rate)
  }

  if (newVal < -1) {
    newVal =  val + (val * +1 * rate)
  }
  
  return (newVal > 1 || newVal < -1) ? randomProb() : newVal
}

function newRandIf(val, rate) {
  if (Math.random() > rate) {
    return val + randomGaussian(0, rate)
  }

  return val
}

function randVaritionMutation(val, rate) {
  if (Math.random() > rate) {
    return varitionMutation(val, rate)
  }

  return val
}