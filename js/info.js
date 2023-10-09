export class Info {
  constructor(liveCars = 0) {
    this.liveCars = liveCars
    this.element = document.getElementById("info")
    this.carCountElm = document.getElementById("car-count")
    this.bestScoreElm = document.getElementById("best-score")
    this.iterationElm = document.getElementById("iteration-count")
    this.currentScoreElem = document.getElementById("current-score")
  }

  update = (app) => {
    // console.log(app)
    this.liveCars = app.liveCars
    this.iteration = app.iteration
    this.fitnessScore = app.fitnessScore
    this.currentScore = app.currentScore
  }

  draw = () => {
    this.carCountElm.innerText = this.liveCars
    this.bestScoreElm.innerText = this.fitnessScore.toFixed(2)
    this.iterationElm.innerText = this.iteration
    this.currentScoreElem.innerText = this.currentScore.toFixed(2)
  }
}