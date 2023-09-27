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
window.APP_SENSORS = Number(searchParams.get("sensors")) || 10
window.APP_HIDDEN_LEVELS = searchParams.get("hidden_levels") || ''
window.APP_SHOW_NETWORK = !!searchParams.get("show_network")

document.addEventListener("DOMContentLoaded", () => {
  window.app = new App(
    document.getElementById("app"),
    document.getElementById("network"),
    true,
    window.APP_SHOW_NETWORK 
  )
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
})
