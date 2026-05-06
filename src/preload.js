const { ipcRenderer, shell } = require('electron')

window.minimize = () => ipcRenderer.send('minimize')
window.maximize = () => ipcRenderer.send('maximize')
window.closeApp = () => ipcRenderer.send('close')
window.openExternal = (url) => shell.openExternal(url)
window.launchTrainer = (gameName) => ipcRenderer.invoke('launch-trainer', gameName)
window.ipcRenderer = ipcRenderer

ipcRenderer.on('trainer-status', (event, msg) => {
    const el = document.getElementById('trainer-status-msg')
    const actMsg = document.getElementById('act-trainer-msg')
    if (el) el.textContent = msg
    if (actMsg) actMsg.textContent = msg
})
