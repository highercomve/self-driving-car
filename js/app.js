import { Visualizer } from "./visualizer.js"
import { Road } from './road.js'
import { Car } from './car.js'
import { CreateControls } from './controls.js'
import { NeuralNetwork } from './network.js'
import { Info } from './info.js'

const bestReducer = (best, c, i) => {
  const better = (c.y < best.y) && !c.damaged
  best.y =  better ? c.y : best.y
  best.index = better ? i : best.index
  return best
}

const countLiveCars = (acc, c) => {
  return (!c.damaged && (c.speed > 0)) ? acc + 1 : acc
}

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
    this.maxDistance = 0
    this.fitnessScore = Number(localStorage.getItem("fitnessScore")) || 0
    this.iteration = Number(localStorage.getItem("iteration")) || 0
  }

  static generateCars(N, ctx, road, controls, opts = { maxSpeed: 1.5 }) {
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

  static generateTraffic(ctx, road, howMany = 1) {
    const traffic = []
    const controls = CreateControls()
    let previousLane = -1
    for (let i = 0; i < howMany; i++) {
      let lane = randomIntFromInterval(0, road.laneCount)
      if (lane === previousLane) {
        lane = (lane + 1) % road.laneCount
      }
      previousLane = lane
      const x = road.getLaneCenter(lane)
      const y = randomIntFromInterval(
        -window.innerHeight + window.innerHeight / 3,
        road.borders[0][0].y + window.innerHeight
      )
      const opts = {
        maxSpeed: randomIntFromInterval(1, 1.5),
        hasSensor: false,
        hasBrain: false
      }
      traffic.push(new Car(ctx, x, y, 30, 50, controls, opts, getRandomColor()))
    }

    return traffic
  }

  reset = () => {
    localStorage.clear()
    this.bestPlayer = null
    this.iteration = 0
    this.fitnessScore = 0
  }

  saveOnLocalStorage = (force = false) => {
    const minYPosition = Math.min(...this.players.map(c => c.y))
    const bestPlayer = this.players.find(c => c.y == minYPosition)
    const currentScore = bestPlayer.getScore(this.traffic)
    localStorage.setItem("iteration", this.iteration);
    
    if (force || currentScore >= this.fitnessScore) {
      this.fitnessScore = currentScore
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
    this.road = new Road(this.ctx, this.carCanvas.width / 2, this.carCanvas.width * 0.9)

    this.players = App.generateCars(
      simulations,
      this.ctx,
      this.road,
      CreateControls("AI")
    )

    this.traffic = App.generateTraffic(this.ctx, this.road, trafficNumber)
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

  #setHeight = () => {
    this.carCanvas.height = window.innerHeight
    this.networkCanvas.height = window.innerHeight
  }

  animate = (time) => {
    this.#setHeight()

    this.players.forEach((c) => c.update(this.road, this.traffic))
    this.traffic.forEach((c) => c.update(this.road, []))

    const bestPlayerIndex = this.players.reduce(bestReducer, { y: 0, index: 0 })
    const liveCarsNumber = this.players.reduce(countLiveCars, 0)
    const bestPlayer = this.players[bestPlayerIndex.index] || this.players[0]

    this.info.update({
      liveCars: liveCarsNumber,
      fitnessScore: this.fitnessScore,
      iteration: this.iteration,
      currentScore: bestPlayer.getScore(this.traffic)
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

    const maxDistance = this.road.borders[0][0].y
    if (bestPlayer.y <= maxDistance || (this.players.length > 1 && this.autolearn && liveCarsNumber == 0)) {
      this.saveOnLocalStorage()
      location.reload()
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