function save() {
  window.app.saveOnLocalStorage()
}

function discard() {
  localStorage.clear();
}

function restart() {
  window.app.init()
}

window.NUMBER_OF_SIMULATIONS = 100

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App(
    document.getElementById("app"),
    document.getElementById("network"),
    window.NUMBER_OF_SIMULATIONS
  )
  window.app.init(window.NUMBER_OF_SIMULATIONS)
})
