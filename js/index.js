import { App } from './app.js'

const searchParams = new URLSearchParams(location.search);
window.APP_SIMULATIONS = searchParams.get("simulations") || 100
window.APP_TRAFFIC = searchParams.get("traffic") || 50
window.APP_SENSORS = Number(searchParams.get("sensors")) || 5
window.APP_HIDDEN_LEVELS = searchParams.get("hidden_levels") || ''
window.APP_SHOW_NETWORK = !!searchParams.get("show_network")
window.APP_DIVERGENCE = Number(searchParams.get("divergence")) || 0.2

window.save = () => {
  window.app.saveOnLocalStorage(true)
}

window.discard = () => {
  localStorage.clear();
}

window.restart = () => {
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
}

window.importModel = () => {
  const input = document.getElementById("import-model")
  input.click()
}

window.exportModel = () => {
  const bestBrain = JSON.parse(localStorage.getItem("bestBrain"))
  const blob = new Blob([JSON.stringify(bestBrain, null, 2)], {
    type: "application/json",
  });
  var file = window.URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = file
  a.download = "model.json"
  a.target = '_black'
  a.referrerPolicy = 'noopener,noreferrer'
  a.click()
}

window.changeFiles = (event) => {
  const input = document.getElementById("import-model")
  for (const fileIndex in input.files) {
    const file = input.files[fileIndex]
    if (!file || typeof file === "function") {
      break 
    }

    const reader = new window.FileReader()
    reader.onload = function () {
      return processFile(file, this.result)
    }
    reader.readAsText(file)
  }
}

function processFile(file, reader) {
  localStorage.setItem("bestBrain", reader);
  location.reload()
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("import-model")
  input.addEventListener("change", changeFiles)

  window.app = new App(
    document.getElementById("app"),
    document.getElementById("network"),
    true,
    window.APP_SHOW_NETWORK 
  )
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
})
