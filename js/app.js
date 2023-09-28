import { Visualizer } from "./visualizer.js"
import { Road } from './road.js'
import { Car } from './car.js'
import { CreateControls } from './controls.js'
import { NeuralNetwork } from './network.js'
import { Info } from './info.js'

export class App {
  players = []
  ctx = null
  networkCtx = null
  controls = null
  bestPlayer = null
  fitnessScore = 0
  iteration = 0

  constructor(carCanvas, networkCanvas, autolearn = true, showNetwork = false) {
    this.carCanvas = carCanvas
    this.networkCanvas = networkCanvas
    this.autolearn = autolearn
    this.showNetwork = showNetwork
    this.fitnessScore = Number(localStorage.getItem("fitnessScore")) || 0
  }

  static generateCars(N, ctx, road, controls, opts = { maxSpeed: 2.2 }) {
    const cars = [];
    for (let i = 0; i < N; i++) {
      cars.push(new Car(
        ctx,
        road.getLaneCenter(1),
        0,
        30,
        50,
        controls,
        opts,
        "blue"
      ));
    }
    return cars;
  }

  saveOnLocalStorage = (force = false) => {
    const minYPosition = Math.min(...this.players.map(c => c.y))
    const bestPlayer = this.players.find(c => c.y == minYPosition)

    if (force || bestPlayer.getScore() >= this.fitnessScore) {
      this.fitnessScore = bestPlayer.getScore()
      localStorage.setItem("bestBrain", JSON.stringify(bestPlayer.brain));
      localStorage.setItem("fitnessScore", this.fitnessScore);
    }
  }

  init = (simulations = 1, trafficNumber = 50) => {
    this.iteration = this.iteration + 1
    this.carCanvas.width = 200
    this.networkCanvas.width = 400

    this.ctx = this.carCanvas.getContext("2d")
    this.networkCtx = this.networkCanvas.getContext("2d")
    this.controls = CreateControls("AI")

    this.road = new Road(this.ctx, this.carCanvas.width / 2, this.carCanvas.width * 0.9)

    this.players = App.generateCars(
      simulations,
      this.ctx,
      this.road,
      this.controls
    )

    this.traffic = this.#generateTraffic(this.road, trafficNumber)
    if (localStorage.getItem("bestBrain")) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
        if (i != 0) {
          NeuralNetwork.mutate(this.players[i].brain, window.APP_DIVERGENCE);
        }
      }
    }

    this.info = new Info(this.players.length)
    this.animate()
  }

  #generateTraffic(road, howMany = 1) {
    const traffic = []
    const controls = CreateControls()
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
      const y = randomIntFromInterval(
        -window.innerHeight + 500,
        -1 * howMany * (window.innerHeight / 2)
      )
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
    const bestPlayer = this.players.find(c => c.y == minYPosition)

    this.info.update({
      liveCars: liveCars.length,
      fitnessScore: this.fitnessScore,
      iteration: this.iteration,
      currentScore: bestPlayer.getScore()
    })
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

    if (this.showNetwork) {
      Visualizer.drawNetwork(this.networkCtx, bestPlayer.brain)
    }
    if (this.players.length > 1 && this.autolearn && liveCars.length == 0) {
      this.saveOnLocalStorage()
      this.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
      return
    }

    requestAnimationFrame(this.animate)
  }
}

export function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(null, args); }, timeout);
  };
}