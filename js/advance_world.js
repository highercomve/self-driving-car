import { App } from './apps/world_editor.js'

const searchParams = new URLSearchParams(location.search);
window.APP_SIMULATIONS = Number(searchParams.get("simulations")) || 10
window.APP_TRAFFIC = Number(searchParams.get("traffic")) || 0
window.APP_SENSORS = Number(searchParams.get("sensors")) || 7
window.APP_HIDDEN_LEVELS = searchParams.get("hidden_levels") || ''
window.APP_SHOW_NETWORK = searchParams.get("hide_network") !== 'false'
window.APP_DIVERGENCE = Number(searchParams.get("divergence")) || 0.2


window.save = () => {
  window.app.saveOnLocalStorage(true)
}

window.saveGraph = () => {
  window.app.saveTrack()
}

window.restart = () => {
  localStorage.clear()
  location.reload()
}

window.iterate = () => {
  window.app.iterate()
}

window.pause = () => {
  window.app.togglePause()
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

window.exportTrack = () => {
  const track = JSON.parse(localStorage.getItem("track"))
  const blob = new Blob([JSON.stringify({ track }, null, 2)], {
    type: "application/json",
  });
  const file = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  const now = new Date()
  a.href = file
  a.download = `track-${now.toISOString()}.json`
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
  console.log(data)
  if (data.track) {
    localStorage.setItem("track", JSON.stringify(data.track));
  } else if (data && data.brain && data.fitnessScore) {
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

function changeAnimationSpeed(evnt) {
  window.app.setAnimationSpeed(evnt.currentTarget.value)
}

function showAnimationSpeed(evnt) {
  const label = evnt.target.nextElementSibling
  label.innerText = `${evnt.currentTarget.value}x`
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("import-model")
  const slider = document.getElementById("animationSpeed")
  const sliderLabel = document.getElementById("animationSpeedLabel")
  input.addEventListener("change", changeFiles)

  slider.addEventListener("change", changeAnimationSpeed)
  slider.addEventListener("input", showAnimationSpeed)

  const animationSpeed = localStorage.getItem("animationSpeed") ? localStorage.getItem("animationSpeed") : 1
  slider.value = animationSpeed
  sliderLabel.innerText = `${animationSpeed}x`

  window.app = new App(
    document.getElementById("world"),
    document.getElementById("network"),
    window.APP_SHOW_NETWORK 
  )
  window.app.init(window.APP_SIMULATIONS, window.APP_TRAFFIC, animationSpeed)
})
