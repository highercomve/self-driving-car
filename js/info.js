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
    this.liveCars = app.liveCars
    this.iteration = app.iteration
    this.bestScore = app.bestScore
    this.currentScore = app.currentScore
  }

  draw = () => {
    this.carCountElm.innerText = this.liveCars
    this.bestScoreElm.innerText = (!this.bestScore ? 0 : this.bestScore).toFixed(2)
    this.iterationElm.innerText = this.iteration
    this.currentScoreElem.innerText = (!this.currentScore ? 0 : this.currentScore).toFixed(2)
  }
}