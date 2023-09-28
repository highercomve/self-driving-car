import { App } from './app.js'

const searchParams = new URLSearchParams(location.search);
window.APP_SIMULATIONS = Number(searchParams.get("simulations")) || 20
window.APP_TRAFFIC = Number(searchParams.get("traffic")) || 500
window.APP_SENSORS = Number(searchParams.get("sensors")) || 5
window.APP_HIDDEN_LEVELS = searchParams.get("hidden_levels") || ''
window.APP_SHOW_NETWORK = !searchParams.get("show_network")
window.APP_DIVERGENCE = Number(searchParams.get("divergence")) || 0.2

window.save = () => {
  window.app.saveOnLocalStorage(true)
}

window.restart = () => {
  localStorage.clear()
  location.reload()
}

window.iterate = () => {
  window.app.saveOnLocalStorage()
  location.reload()
}

window.exportModel = () => {
  const brain = JSON.parse(localStorage.getItem("bestBrain"))
  const fitnessScore = JSON.parse(localStorage.getItem("fitnessScore"))
  const blob = new Blob([JSON.stringify({ brain, fitnessScore }, null, 2)], {
    type: "application/json",
  });
  var file = window.URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = file
  a.download = `model-score-${fitnessScore}.json`
  a.target = '_black'
  a.referrerPolicy = 'noopener,noreferrer'
  a.click()
}

window.importModel = () => {
  const input = document.getElementById("import-model")
  input.click()
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
  const data = JSON.parse(reader)
  console.log(data)
  console.log(data.brain)
  console.log(data.fitnessScore)
  localStorage.clear()
  if (data && data.brain && data.fitnessScore) {
    localStorage.setItem("bestBrain", JSON.stringify(data.brain));
    localStorage.setItem("fitnessScore", data.fitnessScore);
  } else {
    localStorage.setItem("bestBrain", JSON.stringify(data));
  }

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
