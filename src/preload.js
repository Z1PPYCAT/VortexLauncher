const { ipcRenderer, shell } = require('electron')

window.minimize = () => ipcRenderer.send('minimize')
window.maximize = () => ipcRenderer.send('maximize')
window.closeApp = () => ipcRenderer.send('close')
window.openExternal = (url) => shell.openExternal(url)
window.launchTrainer = (gameName) => ipcRenderer.invoke('launch-trainer', gameName)

// Secure KeyAuth proxy
window.kaInit = () => ipcRenderer.invoke('keyauth-init')
window.kaRequest = (type, fields, sid) => ipcRenderer.invoke('keyauth-request', type, fields, sid)

// Auto updater
window.checkForUpdates = () => ipcRenderer.invoke('check-for-updates')
window.installUpdate = () => ipcRenderer.send('install-update')

ipcRenderer.on('update-available', (event, version) => {
    const el = document.getElementById('update-banner')
    const ver = document.getElementById('update-version')
    if (el) el.style.display = 'flex'
    if (ver) ver.textContent = version
})

ipcRenderer.on('update-progress', (event, pct) => {
    const el = document.getElementById('update-progress-text')
    if (el) el.textContent = 'Downloading update... ' + pct + '%'
})

ipcRenderer.on('update-downloaded', (event, version) => {
    const text = document.getElementById('update-progress-text')
    const btn = document.getElementById('update-install-btn')
    if (text) text.textContent = 'Update ready to install!'
    if (btn) btn.style.display = 'block'
})

// Trainer status
ipcRenderer.on('trainer-status', (event, msg) => {
    const el = document.getElementById('trainer-status-msg')
    const actMsg = document.getElementById('act-trainer-msg')
    if (el) el.textContent = msg
    if (actMsg) actMsg.textContent = msg
})
