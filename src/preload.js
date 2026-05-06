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
    // Show update downloading on pre-login screen
    const checkMsg = document.getElementById('update-check-msg')
    const progressDiv = document.getElementById('update-check-progress')
    if (checkMsg) checkMsg.textContent = 'UPDATE FOUND v' + version + ' - DOWNLOADING...'
    if (progressDiv) progressDiv.style.display = 'block'

    // Also show banner if already logged in
    const el = document.getElementById('update-banner')
    const ver = document.getElementById('update-version')
    if (el) el.style.display = 'flex'
    if (ver) ver.textContent = version
})

ipcRenderer.on('update-progress', (event, pct) => {
    const bar = document.getElementById('update-progress-bar')
    const pctEl = document.getElementById('update-progress-pct')
    const checkMsg = document.getElementById('update-check-msg')
    if (bar) bar.style.width = pct + '%'
    if (pctEl) pctEl.textContent = pct + '%'
    if (checkMsg) checkMsg.textContent = 'DOWNLOADING UPDATE... ' + pct + '%'

    const el = document.getElementById('update-progress-text')
    if (el) el.textContent = 'Downloading update... ' + pct + '%'
})

ipcRenderer.on('update-downloaded', (event, version) => {
    const checkMsg = document.getElementById('update-check-msg')
    const checkScreen = document.getElementById('update-check-screen')
    if (checkMsg) checkMsg.textContent = 'UPDATE READY - RESTARTING...'
    // Auto install after 2 seconds
    setTimeout(() => {
        window.installUpdate()
    }, 2000)

    const text = document.getElementById('update-progress-text')
    const btn = document.getElementById('update-install-btn')
    if (text) text.textContent = 'Update ready to install!'
    if (btn) btn.style.display = 'block'
})

ipcRenderer.on('update-not-available', () => {
    // Hide update screen and show login
    const checkScreen = document.getElementById('update-check-screen')
    if (checkScreen) {
        const msg = document.getElementById('update-check-msg')
        if (msg) msg.textContent = 'UP TO DATE'
        setTimeout(() => {
            checkScreen.style.opacity = '0'
            checkScreen.style.transition = 'opacity 0.5s'
            setTimeout(() => checkScreen.style.display = 'none', 500)
        }, 500)
    }
})

ipcRenderer.on('update-error', () => {
    // Hide update screen on error too
    const checkScreen = document.getElementById('update-check-screen')
    if (checkScreen) {
        setTimeout(() => {
            checkScreen.style.opacity = '0'
            checkScreen.style.transition = 'opacity 0.5s'
            setTimeout(() => checkScreen.style.display = 'none', 500)
        }, 1000)
    }
})

// Trainer status
ipcRenderer.on('trainer-status', (event, msg) => {
    const el = document.getElementById('trainer-status-msg')
    const actMsg = document.getElementById('act-trainer-msg')
    if (el) el.textContent = msg
    if (actMsg) actMsg.textContent = msg
})
