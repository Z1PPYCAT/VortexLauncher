const { ipcRenderer, shell } = require('electron')

window.minimize = () => ipcRenderer.send('minimize')
window.maximize = () => ipcRenderer.send('maximize')
window.closeApp = () => ipcRenderer.send('close')
window.openExternal = (url) => shell.openExternal(url)
window.launchTrainer = (gameName) => ipcRenderer.invoke('launch-trainer', gameName)
window.getMachineHWID = () => ipcRenderer.invoke('get-hwid')
window.kaInit = () => ipcRenderer.invoke('keyauth-init')
window.kaRequest = (type, fields, sid) => ipcRenderer.invoke('keyauth-request', type, fields, sid)
window.checkForUpdates = () => ipcRenderer.invoke('check-for-updates')
window.installUpdate = () => ipcRenderer.send('install-update')

function setLoginStatus(msg, color, dotColor) {
    const status = document.getElementById('login-update-status')
    const dot = document.getElementById('login-status-dot')
    if (status) { status.textContent = msg; status.style.color = color }
    if (dot) { dot.style.background = dotColor; dot.style.animation = 'none' }
}

function showBanner(html, borderColor, bgColor) {
    const existing = document.getElementById('update-top-banner')
    if (existing) existing.remove()
    const banner = document.createElement('div')
    banner.id = 'update-top-banner'
    banner.style.cssText = `position:fixed;top:48px;left:0;right:0;background:${bgColor};border-bottom:2px solid ${borderColor};padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:99999;`
    banner.innerHTML = html
    document.body.appendChild(banner)
}

ipcRenderer.on('update-available', (event, version) => {
    setLoginStatus('UPDATE FOUND v' + version + ' - DOWNLOADING...', '#D4AF37', '#D4AF37')
    showBanner(
        `<span style="color:#D4AF37;font-size:12px;letter-spacing:2px;font-weight:700;">⬇️ DOWNLOADING UPDATE v${version}...</span><span id="dl-pct" style="color:#8B6914;font-size:11px;margin-left:12px;">0%</span>`,
        '#D4AF37', '#1a1400'
    )
})

ipcRenderer.on('update-progress', (event, pct) => {
    setLoginStatus('DOWNLOADING... ' + pct + '%', '#D4AF37', '#D4AF37')
    const el = document.getElementById('dl-pct')
    if (el) el.textContent = pct + '%'
})

ipcRenderer.on('update-downloaded', (event, version) => {
    setLoginStatus('UPDATE READY - CLICK INSTALL', '#4CAF50', '#4CAF50')
    showBanner(
        `<span style="color:#4CAF50;font-size:12px;letter-spacing:2px;font-weight:700;">✅ UPDATE v${version} READY!</span><button onclick="window.installUpdate()" style="background:#4CAF50;border:none;color:#000;padding:6px 16px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;">INSTALL NOW</button>`,
        '#4CAF50', '#0f2a0f'
    )
})

ipcRenderer.on('update-not-available', () => {
    setLoginStatus('UP TO DATE', '#4CAF50', '#4CAF50')
})

ipcRenderer.on('update-error', () => {
    setLoginStatus('SERVER OFFLINE', '#ff4444', '#ff4444')
})

ipcRenderer.on('trainer-status', (event, msg) => {
    const el = document.getElementById('trainer-status-msg')
    const actMsg = document.getElementById('act-trainer-msg')
    if (el) el.textContent = msg
    if (actMsg) actMsg.textContent = msg
})
