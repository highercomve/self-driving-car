const searchParams = new URLSearchParams(location.search);

function save() {
  window.app.saveOnLocalStorage()
}

function discard() {
  localStorage.clear();
}

function restart() {
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
}

window.APP_SIMULATIONS = searchParams.get("simulations") || 100
window.APP_TRAFFIC = searchParams.get("traffic") || 50

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App(
    document.getElementById("app"),
    document.getElementById("network"),
    true
  )
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
})
