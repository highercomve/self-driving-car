import { Graph } from "../lib/graph.js";
import { World } from "../views/world_editor.js";
import { Viewport } from "../views/viewport.js";
import { GraphEditor } from "../views/graph_editor.js";
import { CreateControls } from '../controls.js';
import { Car } from '../car/advanced.js';
import { Visualizer } from "../visualizer.js"
import { Info } from '../info.js'
import { brain as brainDefault } from '../data/model.js'
import { track as trackDefault } from '../data/track.js'

const minTime = 10000
const maxTime = 60000
const carOptions = {
   width: 22,
   height: 38,
   maxSpeed: 3
 }

const bestReducer = (best, c, i) => {
   const better = (c.score > best.score) && !c.damaged && !c.swiched 
   best.score = better ? c.score : best.score
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
   bestScore = 0
   bestFitness = 0
   iteration = 0
   startAt = 0
   pause = false
   animationSpeed = 1

   constructor(carCanvas, networkCanvas, showNetwork) {
      this.carCanvas = carCanvas
      this.networkCanvas = networkCanvas
      this.showNetwork = showNetwork
      this.maxDistance = 0
      this.bestScore = Number(localStorage.getItem("brainScore")) || 0
      this.iteration = Number(localStorage.getItem("iteration")) || 0

      document.addEventListener("keyup", this.#onkeyup)
   }

   static generateCars(N, ctx, road, controls, opts = { maxSpeed: carOptions.maxSpeed, drawSensor: true }, brainJson) {
      const cars = [];
      if (road.segments.length === 0) {
         return cars
      }
      for (let i = 0; i < N; i++) {
         let brain
         if (brainJson) {
            brain = copyObject(brainJson)
            if (i > 0) {
               NeuralNetwork.mutate(brain, window.APP_DIVERGENCE)
            }
            brain.id = i
         } else if (!localStorage.getItem("fromScrath")) {
            brain = copyObject(brainDefault)
            if (i > 0) {
               NeuralNetwork.mutate(brain, window.APP_DIVERGENCE)
            }
            brain.id = i
         }

         cars.push(new Car(
            ctx,
            road.segments[0].p1.x - 50,
            road.segments[0].p1.y,
            carOptions.width,
            carOptions.height,
            controls,
            opts,
            "blue",
            brain,
            i
         ));
      }
      return cars;
   }

   static generateTraffic(ctx, road, howMany) {
      if (howMany === 0) {
         return []
      }
      howMany = Math.min(howMany, 3)
      const hasBrain = true
      const controls = CreateControls("AI")
      const traffic = []
      for (let i = 0; i < howMany; i++) {
         const odd = i % 2
         const x = road.segments[0].p1.x + 60 + (60 * odd)
         const y = road.segments[0].p1.y - 20 + (40 * odd)
         const opts = {
            maxSpeed: carOptions.maxSpeed,
            hasSensor: hasBrain,
            hasBrain: hasBrain,
            drawSensor: true,
         }

         traffic.push(new Car(
            ctx,
            x,
            y,
            carOptions.width,
            carOptions.height,
            controls,
            opts,
            getRandomColor(),
            localStorage.getItem("bestBrain") ? JSON.parse(localStorage.getItem("bestBrain")) : copyObject(brainDefault),
            i
         ))
      }

      return traffic
   }

   #onkeyup = (event) => {
      let bestPlayer
      switch (event.key) {
         case "]":
            this.setAnimationSpeed(this.animationSpeed + 1)
            return
         case "[":
            this.setAnimationSpeed(this.animationSpeed - 1)
            return
         case "p":
            if (this.pause) {
               this.setAnimationSpeed(1)
            } else {
               this.setAnimationSpeed(0)
            }
            return
         case "s":
            bestPlayer = this.getBestPlayer()
            bestPlayer.swiched = true
            return
         case "k":
            bestPlayer = this.getBestPlayer()
            bestPlayer.damaged = true
            return
         default:
            return
      }
   }

   setAnimationSpeed = (number) => {
      this.animationSpeed = Math.max(Math.min(number, 50), 0)
      if (this.animationSpeed === 0) {
         this.pause = true
      } else {
         this.pause = false
      }
      const slider = document.getElementById("animationSpeed")
      const sliderLabel = document.getElementById("animationSpeedLabel")
      slider.value = this.animationSpeed
      sliderLabel.innerText = `${this.animationSpeed}x`
   }

   togglePause = () => {
      this.pause = !this.pause
   }

   reset = () => {
      localStorage.removeItem("bestBrain")
      localStorage.removeItem("brainScore")
      this.bestPlayer = null
      this.iteration = 0
      this.bestScore = 0
   }

   iterate = () => {
      if (window.APP_AUTOLEARN) {
         this.saveOnLocalStorage()
      }
      location.reload()
      // this.init(this.simulations, this.trafficNumber, this.animationSpeed)
   }

   saveTrack = () => {
      localStorage.setItem('track', JSON.stringify(this.graph))
   }

   bestScoredPlayer = () => {
      let maxScore = -Infinity
      let bestPlayer = this.players[0]
      for (let i = 0; i < this.players.length; i++) {
         const score = this.players[i].score
         if (score > maxScore) {
            bestPlayer = this.players[i]
            maxScore = score
         }
      }

      return bestPlayer
   }

   setPlayerFitness = () => {
      const sum = this.players.reduce((acc, player) => acc + player.score, 0)

      this.players.forEach((player) => {
         player.fitness = player.score / (sum > 0 ? sum : 1)
      })
   }

   saveOnLocalStorage = (force = true) => {
      const bestPlayerIndex = this.players.reduce(bestReducer, { score: 0, index: 0 }, false)
      const bestPlayer = this.players[bestPlayerIndex] || this.bestScoredPlayer()
      const currentScore = bestPlayer.getScore(this.traffic)
      const bestScore = Number(localStorage.getItem("brainScore")) || 0

      localStorage.setItem("iteration", this.iteration);
      localStorage.removeItem("fromScrath");
      localStorage.setItem("animationSpeed", this.animationSpeed)

      if (force || currentScore >= bestScore) {
         this.bestScore = bestPlayer.score
         this.bestFitness = bestPlayer.fitness
         localStorage.setItem("bestBrain", JSON.stringify(bestPlayer.brain));
         localStorage.setItem("brainScore", this.bestScore);
         localStorage.setItem("brainFitness", this.bestFitness);
      }
   }

   init = (simulations = 1, trafficNumber = 0, animationSpeed = 1) => {
      this.animationSpeed = animationSpeed
      this.simulations = simulations
      this.trafficNumber = trafficNumber
      this.startAt = new Date()
      this.iteration = this.iteration + 1
      this.carCanvas.width = this.carCanvas.parentElement.offsetWidth
      this.networkCanvas.width = 400

      this.ctx = this.carCanvas.getContext("2d")
      this.networkCtx = this.networkCanvas.getContext("2d")
      if (localStorage.getItem('track')) {
         this.graph = Graph.load(JSON.parse(localStorage.getItem('track')))
      } else if (!localStorage.getItem("fromScrath")) {
         this.graph = Graph.load(trackDefault)
      } else {
         this.graph = new Graph();
      }

      this.players = App.generateCars(
         simulations,
         this.ctx,
         this.graph,
         CreateControls("AI"),
         undefined,
         localStorage.getItem("bestBrain") ? JSON.parse(localStorage.getItem("bestBrain")) : undefined
      )
      this.traffic = App.generateTraffic(
         this.ctx,
         this.graph,
         trafficNumber
      )
      this.world = new World(this.graph);
      this.viewport = new Viewport(this.carCanvas);
      this.graphEditor = new GraphEditor(this.viewport, this.graph);
      this.info = new Info(this.players.length)
      this.animate()
   }

   #setHeight = () => {
      this.carCanvas.height = window.innerHeight
      this.networkCanvas.height = window.innerHeight
   }

   getBestPlayer = () => {
      const bestPlayerIndex = this.players.reduce(bestReducer, { score: 0, index: 0 }, false)

      return this.players[bestPlayerIndex.index] || this.players[0]
   }

   update = () => {
      if (this.world.roadBorders.length === 0 && this.players.length === 0) { return }
      if (this.pause) { return }

      this.traffic.forEach((c) => {
         const cars = [...this.traffic.slice(0, c.id), ...this.traffic.slice(c.id + 1), this.getBestPlayer()]
         c.update(this.world.roadBorders, cars)
      })
      this.players.forEach((c) => c.update(this.world.roadBorders, this.traffic));
      const bestPlayer = this.getBestPlayer()

      this.info.update({
         liveCars: this.players.reduce(countLiveCars, 0),
         bestScore: this.bestScore,
         iteration: this.iteration,
         currentScore: bestPlayer.score
      })
      this.viewport.move(bestPlayer.x, bestPlayer.y)
   }

   draw = () => {
      if (this.world.roadBorders.length === 0 && this.players.length === 0) { return }

      this.world.draw(this.ctx);
      this.ctx.globalAlpha = 0.3;
      this.graphEditor.display(this.ctx);

      this.ctx.globalAlpha = 1
      this.traffic.forEach((p) => p.draw())

      this.ctx.globalAlpha = 0.1
      this.players.forEach((p) => p.draw(false))

      this.ctx.globalAlpha = 1
      this.getBestPlayer().draw()

      this.info.draw()

      if (this.showNetwork) {
         Visualizer.drawNetwork(this.networkCtx, this.players[0].brain)
      }
   }

   animate = () => {
      this.#setHeight()

      this.viewport.reset();
      this.world.generate();

      for (let i = 0; i < this.animationSpeed; i++) {
         this.update()
      }
      this.draw()

      const now = new Date()
      const timeSinceInit = now.getTime() - this.startAt.getTime()
      if (timeSinceInit > minTime && this.animationSpeed > 1) {
         if (this.players.reduce(countLiveCars, 0) === 0) {
            return this.iterate()
         }
      }

      if (timeSinceInit > maxTime) {
         return this.iterate()
      }

      requestAnimationFrame(this.animate)
   }
}
