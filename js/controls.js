class AIControls {
  constructor() {
    this.forward = false
    this.left = false
    this.right = false
    this.reverse = false
  }

  update = (outputs) => {
    this.forward = outputs[0]
    this.left = outputs[1]
    this.right = outputs[2]
    this.reverse = outputs[3]
  }
}

class ForwardControls {
  constructor() {
    this.forward = true
    this.left = false
    this.right = false
    this.reverse = false
  }
  update = (_) => {}
}

class KeyboardControls {
  constructor() {
    this.forward = false
    this.left = false
    this.right = false
    this.reverse = false

    this.#addKeyboardListeners();
  }
  update = (_) => {}

  #addKeyboardListeners() {
    document.onkeydown = (event) => {
      switch (event.key) {
        case "ArrowRight":
          this.right = true
          break
        case "ArrowLeft":
          this.left = true
          break
        case "ArrowUp":
          this.forward = true
          break
        case "ArrowDown":
          this.reverse = true
          break
      }
    }
    document.onkeyup = (event) => {
      switch (event.key) {
        case "ArrowRight":
          this.right = false
          break
        case "ArrowLeft":
          this.left = false
          break
        case "ArrowUp":
          this.forward = false
          break
        case "ArrowDown":
          this.reverse = false
          break
      }
    }
  }
}