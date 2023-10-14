import { App } from './apps/easy_road.js'

const searchParams = new URLSearchParams(location.search);
window.APP_SIMULATIONS = Number(searchParams.get("simulations")) || 50
window.APP_TRAFFIC = Number(searchParams.get("traffic")) || 50
window.APP_SENSORS = Number(searchParams.get("sensors")) || 7
window.APP_HIDDEN_LEVELS = searchParams.get("hidden_levels") || ''
window.APP_SHOW_NETWORK = !searchParams.get("show_network")
window.APP_DIVERGENCE = Number(searchParams.get("divergence")) || 0.2

window.save = () => {
  window.app.saveOnLocalStorage(true)
}

window.restart = () => {
  localStorage.removeItem("bestBrain")
  localStorage.removeItem("brainScore")
  location.reload()
}

window.iterate = () => {
  window.app.iterate()
}

window.exportModel = () => {
  const brain = JSON.parse(localStorage.getItem("bestBrain"))
  const score = JSON.parse(localStorage.getItem("brainScore"))
  const blob = new Blob([JSON.stringify({ brain, score }, null, 2)], {
    type: "application/json",
  });
  const file = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  const now = new Date()
  a.href = file
  a.download = `model-score-${score.toFixed(2)}-${now.toISOString()}.json`
  a.target = '_black'
  a.referrerPolicy = 'noopener,noreferrer'
  a.click()
}

window.importModel = () => {
  const input = document.getElementById("import-model")
  input.click()
}

window.changeFiles = (_) => {
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

function processFile(_, reader) {
  const data = JSON.parse(reader)
  localStorage.clear()
  if (data && data.brain && data.fitnessScore) {
    localStorage.setItem("bestBrain", JSON.stringify(data.brain));
    localStorage.setItem("brainScore", data.fitnessScore);
  } else if (data && data.brain && data.score) {
    localStorage.setItem("bestBrain", JSON.stringify(data.brain));
    localStorage.setItem("brainScore", data.score);
  } else {
    localStorage.setItem("bestBrain", JSON.stringify(data));
  }

  location.reload()
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("import-model")
  input.addEventListener("change", changeFiles)

  window.app = new App(
    document.getElementById("world"),
    document.getElementById("network"),
    true,
    window.APP_SHOW_NETWORK 
  )
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC)
})
