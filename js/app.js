import { Visualizer } from "./visualizer.js"
import { Road } from './road.js'
import { Car } from './car.js'
import { CreateControls } from './controls.js'
import { Info } from './info.js'

const minTime = 10000
const maxTime = 600000
const bestReducer = (best, c, i, withoutDamage = false) => {
  const better = (c.y < best.y) && (!c.damaged || withoutDamage)
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
  startAt = 0

  constructor(carCanvas, networkCanvas, autolearn = true, showNetwork = false) {
    this.carCanvas = carCanvas
    this.networkCanvas = networkCanvas
    this.autolearn = autolearn
    this.showNetwork = showNetwork
    this.maxDistance = 0
    this.fitnessScore = Number(localStorage.getItem("fitnessScore")) || 0
    this.iteration = Number(localStorage.getItem("iteration")) || 0
  }

  static generateCars(N, ctx, road, controls, opts = { maxSpeed: 3 }) {
    const cars = [];
    for (let i = 0; i < N; i++) {
      cars.push(new Car(
        ctx,
        road.getMiddleOfRoad(),
        0,
        30,
        50,
        controls,
        opts,
        "blue",
        i
      ));
    }
    return cars;
  }

  static generateTraffic(ctx, road, howMany = 1) {
    if (howMany === 0) {
      return []
    }
    let controls = CreateControls()
    // if (localStorage.getItem("bestBrain")) {
    //   controls = CreateControls("AI")
    // }
    const traffic = []
    let previousLane = -1
    for (let i = 0; i < howMany; i++) {
      let lane = randomIntFromInterval(0, road.laneCount)
      if (lane === previousLane) {
        lane = (lane + 1) % road.laneCount
      }
      previousLane = lane
      const x = road.getLaneCenter(lane)
      const y = randomIntFromInterval(
        0 - 200,
        road.borders[0][0].y + 2 * window.innerHeight
      )
      const opts = {
        maxSpeed: randomFloorFromInterval(1, 1.2),
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

  iterate = () => {
    this.saveOnLocalStorage()
    location.reload()
  }

  bestScoredPlayer = () => {
    let maxScore = -Infinity
    let bestPlayer = null
    for (let i = 0; i < this.players.length; i++) {
      const score = this.players[i].getScore()
      if (score > maxScore) {
        bestPlayer = this.players[i]
        maxScore = score
      }
    }

    return bestPlayer
  }

  saveOnLocalStorage = (force = false) => {
    const bestPlayer = this.bestScoredPlayer()
    const currentScore = bestPlayer.getScore(this.traffic)
    const bestScore = Number(localStorage.getItem("fitnessScore")) || 0
    
    localStorage.setItem("iteration", this.iteration);
    if (force || currentScore >= bestScore) {
      this.fitnessScore = currentScore
      localStorage.setItem("bestBrain", JSON.stringify(bestPlayer.brain));
      localStorage.setItem("fitnessScore", this.fitnessScore);
    }
  }

  init = (simulations = 1, trafficNumber = 20) => {
    this.startAt = new Date()
    this.iteration = this.iteration + 1
    this.carCanvas.width = this.carCanvas.parentElement.offsetWidth - 50
    this.networkCanvas.width = 400

    this.ctx = this.carCanvas.getContext("2d")
    this.networkCtx = this.networkCanvas.getContext("2d")
    this.road = new Road(this.ctx, 180, 140, 3)

    this.players = App.generateCars(
      simulations,
      this.ctx,
      this.road,
      CreateControls("AI")
    )

    this.traffic = App.generateTraffic(this.ctx, this.road, trafficNumber)
    
    if (localStorage.getItem("bestBrain")) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].brain = JSON.parse(localStorage.getItem("bestBrain"))
        this.players[i].brain.id = i
        if (i > 0) {
          NeuralNetwork.mutate(this.players[i].brain, window.APP_DIVERGENCE)
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
    this.traffic.forEach((c) => c.update(this.road))

    const bestPlayerIndex = this.players.reduce(bestReducer, { y: 0, index: 0 }, false)
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
    
    this.ctx.globalAlpha = 0.1
    this.players.forEach((p) => {
      p.drawSensor = false
      p.draw()
    })
    
    this.ctx.globalAlpha = 1
    bestPlayer.drawSensor = true

    this.traffic.forEach((car) => car.draw())
    bestPlayer.draw()
    
    this.ctx.restore()

    this.networkCtx.lineDashOffset = -1 * time / 50
    this.info.draw()

    if (this.showNetwork) {
      Visualizer.drawNetwork(this.networkCtx, bestPlayer.brain)
    }

    const maxDistance = this.road.borders[0][0].y
    const now = new Date()
    const timeSinceInit = now.getTime() - this.startAt.getTime()
    if (timeSinceInit > minTime) {
      if (bestPlayer.y <= maxDistance || (this.players.length > 1 && this.autolearn && liveCarsNumber == 0)) {
        return this.iterate()
      }
    }

    if (timeSinceInit > maxTime) {
      return this.iterate()
    }

    requestAnimationFrame(this.animate)
  }
}

export function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => { func.apply(null, args); }, timeout)
  }
}