import { Graph } from "../lib/graph.js";
import { World } from "../views/world_editor.js";
import { Viewport } from "../views/viewport.js";
import { GraphEditor } from "../views/graph_editor.js";
import { CreateControls } from '../controls.js';
import { Car } from '../car/advanced.js';
import { Visualizer } from "../visualizer.js"
import { Info } from '../info.js'

const minTime = 10000
const maxTime = 600000

const bestReducer = (best, c, i, withoutDamage = false) => {
   const better = (c.score > best.score) && (!c.damaged || withoutDamage)
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

   constructor(carCanvas, networkCanvas, showNetwork = true) {
      this.carCanvas = carCanvas
      this.networkCanvas = networkCanvas
      this.showNetwork = showNetwork
      this.maxDistance = 0
      this.bestScore = Number(localStorage.getItem("brainScore")) || 0
      this.iteration = Number(localStorage.getItem("iteration")) || 0
   }

   static generateCars(N, ctx, road, controls, opts = { maxSpeed: 1.2, drawSensor: false }, brainJson) {
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
         }

         cars.push(new Car(
            ctx,
            road.segments[0].p1.x + 100,
            road.segments[0].p1.y - 20,
            25,
            42,
            controls,
            opts,
            "blue",
            brain,
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
      localStorage.removeItem("bestBrain")
      localStorage.removeItem("brainScore")
      this.bestPlayer = null
      this.iteration = 0
      this.bestScore = 0
   }

   iterate = () => {
      this.saveOnLocalStorage()
      location.reload()
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
      const bestPlayer = this.bestScoredPlayer()
      const currentScore = bestPlayer.getScore(this.traffic)
      const bestScore = Number(localStorage.getItem("brainScore")) || 0
      // const bestFitness = Number(localStorage.getItem("brainFitness")) || 0

      localStorage.setItem("iteration", this.iteration);
      if (force || currentScore >= bestScore) {
         this.bestScore = bestPlayer.score
         this.bestFitness = bestPlayer.fitness
         localStorage.setItem("bestBrain", JSON.stringify(bestPlayer.brain));
         localStorage.setItem("brainScore", this.bestScore);
         localStorage.setItem("brainFitness", this.bestFitness);
      }
   }

   init = (simulations = 1, trafficNumber = 20) => {
      this.startAt = new Date()
      this.iteration = this.iteration + 1
      this.carCanvas.width = this.carCanvas.parentElement.offsetWidth
      this.networkCanvas.width = 400

      this.ctx = this.carCanvas.getContext("2d")
      this.networkCtx = this.networkCanvas.getContext("2d")
      if (localStorage.getItem('track')) {
         this.graph = Graph.load(JSON.parse(localStorage.getItem('track')))
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
      this.traffic = []
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

   animate = () => {
      this.#setHeight()

      this.viewport.reset();
      this.world.generate();
      this.world.draw(this.ctx);
      this.ctx.globalAlpha = 0.3;
      this.graphEditor.display(this.ctx);

      if (this.world.roadBorders.length > 0 && this.players.length > 0) {
         this.players.forEach((c) => c.update(this.world.roadBorders, this.traffic));
         const bestPlayerIndex = this.players.reduce(bestReducer, { score: 0, index: 0 }, false)
         const liveCarsNumber = this.players.reduce(countLiveCars, 0)
         const bestPlayer = this.players[bestPlayerIndex.index] || this.players[0]

         this.info.update({
            liveCars: liveCarsNumber,
            bestScore: this.bestScore,
            iteration: this.iteration,
            currentScore: bestPlayer.score
         })

         this.ctx.globalAlpha = 0.1
         this.players.forEach((p) => {
           p.drawSensor = false
           p.draw()
         })
   
         this.ctx.globalAlpha = 1
         bestPlayer.drawSensor = true
         bestPlayer.draw()
         this.info.draw()

         Visualizer.drawNetwork(this.networkCtx, this.players[0].brain)
         const now = new Date()
         const timeSinceInit = now.getTime() - this.startAt.getTime()
         if (timeSinceInit > minTime) {
            if (liveCarsNumber == 0) {
              return this.iterate()
            }
          }
      
          if (timeSinceInit > maxTime) {
            return this.iterate()
          }
      }
      

      requestAnimationFrame(this.animate)
   }
}
