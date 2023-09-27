class Info {
  constructor(liveCars = 0) {
    this.liveCars = liveCars
    this.element = document.getElementById("info")
    this.carCountElm = document.getElementById("car-count")
  }

  update = (liveCars) => {
    this.liveCars = liveCars
  }

  draw = () => {
    this.carCountElm.innerText = this.liveCars
  }
}