export function CreateControls(type) {
  switch (type) {
    case "AI":
      return new AIControls()
    case "KEYS":
      return new KeyboardControls()
    default:
      return new ForwardControls()
  }
}

export class AIControls {
  constructor() {
    this.forward = false
    this.left = false
    this.right = false
    this.reverse = false
    this.manual = false

    document.addEventListener("keydown", this.#onkeydown)
    document.addEventListener("keyup", this.#onkeydown)
  }

  update = (outputs) => {
    if (this.manual) {
      return
    }
    this.forward = outputs[0]
    this.left = outputs[1]
    this.right = outputs[2]
    this.reverse = outputs[3]
  }

  #onkeydown = (event) => {
    switch (event.key) {
      case "m":
        this.manual = true
        this.forward = true
        break
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
  #onkeyup = (event) => {
    switch (event.key) {
      case "a":
        this.manual = false
        break
      case "ArrowRight":
        this.right = false
        break
      case "ArrowLeft":
        this.left = false
        break
      case "ArrowUp":
        this.forward = false
        this.manual = false
        break
      case "ArrowDown":
        this.reverse = false
        break
    }
  }
}


export class ForwardControls {
  constructor() {
    this.forward = true
    this.left = false
    this.right = false
    this.reverse = false
  }
  update = (_) => { }
}

export class KeyboardControls {
  constructor() {
    this.forward = false
    this.left = false
    this.right = false
    this.reverse = false

    this.#addKeyboardListeners();
  }

  update = (_) => { }

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