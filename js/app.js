
class App {
  players = []
  ctx = null
  networkCtx = null
  controls = null
  bestPlayer = null

  constructor(carCanvas, networkCanvas, simulations = 1, autolearn = true) {
    this.carCanvas = carCanvas
    this.networkCanvas = networkCanvas
    this.simulations = simulations
    this.autolearn = autolearn
  }

  static generateCars(N, ctx, road, controls, opts = { maxSpeed: 2.2 }) {
    const cars = [];
    for (let i = 0; i < N; i++) {
      console.info(i)
      cars.push(new Car(
        ctx,
        road.getLaneCenter(1),
        100,
        30,
        50,
        controls,
        opts,
        "blue"
      ));
    }
    return cars;
  }

  saveOnLocalStorage = () => {
    const minYPosition = Math.min(...this.players.map(c => c.y))
    const bestPlayer = this.players.find(c => c.y == minYPosition)
    const bestDistance = localStorage.getItem("bestDistance")
    if (!bestDistance || bestPlayer.y > Number(bestDistance)) {
      localStorage.setItem("bestBrain", JSON.stringify(bestPlayer.brain));
      localStorage.setItem("bestDistance", bestPlayer.y);
    }
  }

  init = (simulations = undefined, trafficNumber = 50) => {
    this.carCanvas.width = 200
    this.networkCanvas.width = 400

    this.ctx = this.carCanvas.getContext("2d")
    this.networkCtx = this.networkCanvas.getContext("2d")
    this.controls = new AIControls()

    this.road = new Road(this.ctx, this.carCanvas.width / 2, this.carCanvas.width * 0.9)

    this.players = App.generateCars(
      !simulations ? this.simulations : simulations,
      this.ctx,
      this.road,
      this.controls
    )

    this.traffic = this.#generateTraffic(this.road, trafficNumber)
    const divergence = Math.random() * 2 - 1
    if (localStorage.getItem("bestBrain")) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
        if (i != 0) {
          NeuralNetwork.mutate(this.players[i].brain, divergence);
        }
      }
    }

    if (!localStorage.getItem("bestBrain") && window.preloadBrain) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].brain = JSON.parse(window.preloadBrain);
        if (i != 0) {
          NeuralNetwork.mutate(this.players[i].brain, divergence);
        }
      }
    }
    
    this.info = new Info(this.players.length)
    this.animate()
  }

  #generateTraffic(road, howMany = 1) {
    const traffic = []
    const controls = new ForwardControls()
    const opts = {
      maxSpeed: 1.5,
      hasSensor: false,
      hasBrain: false
    }
    let previousLane = -1
    for (let i = 0; i < howMany; i++) {
      let lane = randomIntFromInterval(0, road.laneCount)
      if (lane === previousLane) {
        lane = (lane + 1) % road.laneCount
      }
      previousLane = lane
      const x = this.road.getLaneCenter(lane)
      const y = randomIntFromInterval(-200, -1 * 10 * i * this.carCanvas.height)
      traffic.push(new Car(this.ctx, x, y, 30, 50, controls, opts, getRandomColor()))
    }
    return traffic
  }

  #setHeight = () => {
    this.carCanvas.height = window.innerHeight
    this.networkCanvas.height = window.innerHeight
  }

  animate = (time) => {
    this.#setHeight()
    
    this.traffic.forEach((car) => car.update(this.road))
    this.players.forEach((p) => p.update(this.road, this.traffic))

    const minYPosition = Math.min(...this.players.map(c => c.y))
    const liveCars = this.players.filter(c => !c.damaged && c.speed !== 0)

    this.info.update(liveCars.length)

    const bestPlayer = this.players.find(c => c.y == minYPosition)
    
    this.ctx.save()
    this.ctx.translate(0, -bestPlayer.y + this.carCanvas.height * 0.7)

    this.road.draw()
    this.traffic.forEach((car) => car.draw())
    this.ctx.globalAlpha = 0.1
    this.players.forEach((p) => {
      p.drawSensor = false
      p.draw()
    })
    this.ctx.globalAlpha = 1
    bestPlayer.drawSensor = true
    bestPlayer.draw()
    this.ctx.restore()

    this.networkCtx.lineDashOffset = -1 * time / 50
    this.info.draw()

    if (!this.autolearn) {
      Visualizer.drawNetwork(this.networkCtx, bestPlayer.brain)
    }
    if (liveCars.length == 0 || this.autolearn) {
      this.saveOnLocalStorage()
      this.init(window.NUMBER_OF_SIMULATIONS)
      return 
    }

    requestAnimationFrame(this.animate)
  }
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(null, args); }, timeout);
  };
}