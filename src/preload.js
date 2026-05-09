const { ipcRenderer, shell } = require('electron')

window.minimize = () => ipcRenderer.send('minimize')
window.maximize = () => ipcRenderer.send('maximize')
window.closeApp = () => ipcRenderer.send('close')
window.openExternal = (url) => shell.openExternal(url)
window.launchTrainer = (gameName) => ipcRenderer.invoke('launch-trainer', gameName)

// Get persistent machine HWID
window.getMachineHWID = () => ipcRenderer.invoke('get-hwid')

// Secure KeyAuth proxy
window.kaInit = () => ipcRenderer.invoke('keyauth-init')
window.kaRequest = (type, fields, sid) => ipcRenderer.invoke('keyauth-request', type, fields, sid)

// Auto updater
window.checkForUpdates = () => ipcRenderer.invoke('check-for-updates')
window.installUpdate = () => ipcRenderer.send('install-update')

let updateVersion = null
let updatePostponed = false

ipcRenderer.on('update-available', (event, version) => {
    updateVersion = version

    // If on pre-login screen
    const checkScreen = document.getElementById('update-check-screen')
    if (checkScreen && checkScreen.style.display !== 'none') {
        const checkMsg = document.getElementById('update-check-msg')
        const progressDiv = document.getElementById('update-check-progress')
        if (checkMsg) checkMsg.textContent = 'UPDATE FOUND v' + version + ' - DOWNLOADING...'
        if (progressDiv) progressDiv.style.display = 'block'
        return
    }

    // If already logged in - show update dialog
    showUpdateDialog(version)
})

function showUpdateDialog(version) {
    const existing = document.getElementById('update-dialog')
    if (existing) existing.remove()

    const dialog = document.createElement('div')
    dialog.id = 'update-dialog'
    dialog.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        z-index: 9995;
        display: flex;
        align-items: center;
        justify-content: center;
    `

    dialog.innerHTML = \`
        <div style="background:#0f0e08;border:1px solid #D4AF37;border-radius:12px;padding:32px;width:420px;text-align:center;box-shadow:0 0 40px rgba(212,175,55,0.2)">
            <div style="font-size:32px;margin-bottom:16px">🌀</div>
            <h2 style="color:#D4AF37;letter-spacing:3px;font-size:18px;margin-bottom:8px">UPDATE AVAILABLE</h2>
            <p style="color:#6b6040;font-size:13px;margin-bottom:8px">Version \${version} is available!</p>
            <p style="color:#4a4030;font-size:11px;margin-bottom:24px">Update now to get the latest features and bug fixes.<br>If you choose Later you may miss important updates.</p>
            
            <div id="update-dialog-progress" style="display:none;margin-bottom:20px">
                <div style="background:#1a1600;border-radius:4px;height:6px;overflow:hidden;border:1px solid #2a2400;margin-bottom:8px">
                    <div id="update-dialog-bar" style="height:100%;background:linear-gradient(90deg,#D4AF37,#8B6914);width:0%;transition:width 0.3s"></div>
                </div>
                <div id="update-dialog-pct" style="color:#D4AF37;font-size:11px">Downloading... 0%</div>
            </div>

            <div id="update-dialog-buttons" style="display:flex;gap:12px;justify-content:center">
                <button onclick="startUpdate()" style="background:linear-gradient(135deg,#D4AF37,#8B6914);border:none;border-radius:6px;color:#000;font-size:13px;font-weight:700;padding:10px 24px;cursor:pointer;letter-spacing:1px;">
                    UPDATE NOW
                </button>
                <button onclick="postponeUpdate()" style="background:transparent;border:1px solid #3a3200;border-radius:6px;color:#6b6040;font-size:13px;padding:10px 24px;cursor:pointer;">
                    LATER
                </button>
            </div>
            <p id="update-warning" style="display:none;color:#ff6644;font-size:10px;margin-top:12px">
                ⚠️ You may miss bug fixes and new features by postponing!
            </p>
        </div>
    \`

    document.body.appendChild(dialog)
}

function startUpdate() {
    // Hide buttons show progress
    document.getElementById('update-dialog-buttons').style.display = 'none'
    document.getElementById('update-dialog-progress').style.display = 'block'
    // Download is already happening in background
    updatePostponed = false
}

function postponeUpdate() {
    updatePostponed = true
    const dialog = document.getElementById('update-dialog')
    if (dialog) dialog.remove()
    
    // Show banner reminder
    const el = document.getElementById('update-banner')
    const ver = document.getElementById('update-version')
    if (el) el.style.display = 'flex'
    if (ver) ver.textContent = updateVersion
    
    // Show warning after 1 hour
    setTimeout(() => {
        if (updatePostponed) showUpdateDialog(updateVersion)
    }, 3600000)
}

ipcRenderer.on('update-progress', (event, pct) => {
    // Pre-login screen
    const bar = document.getElementById('update-progress-bar')
    const pctEl = document.getElementById('update-progress-pct')
    const checkMsg = document.getElementById('update-check-msg')
    if (bar) bar.style.width = pct + '%'
    if (pctEl) pctEl.textContent = pct + '%'
    if (checkMsg) checkMsg.textContent = 'DOWNLOADING UPDATE... ' + pct + '%'

    // In-app dialog
    const dialogBar = document.getElementById('update-dialog-bar')
    const dialogPct = document.getElementById('update-dialog-pct')
    if (dialogBar) dialogBar.style.width = pct + '%'
    if (dialogPct) dialogPct.textContent = 'Downloading... ' + pct + '%'

    // Activity bar
    const el = document.getElementById('update-progress-text')
    if (el) el.textContent = 'Downloading update... ' + pct + '%'
})

ipcRenderer.on('update-downloaded', (event, version) => {
    // Pre-login screen - auto install
    const checkScreen = document.getElementById('update-check-screen')
    if (checkScreen && checkScreen.style.display !== 'none') {
        const checkMsg = document.getElementById('update-check-msg')
        if (checkMsg) checkMsg.textContent = 'UPDATE READY - RESTARTING...'
        setTimeout(() => window.installUpdate(), 2000)
        return
    }

    // In-app dialog - show restart button
    const dialogPct = document.getElementById('update-dialog-pct')
    const dialogBar = document.getElementById('update-dialog-bar')
    if (dialogBar) dialogBar.style.width = '100%'
    if (dialogPct) dialogPct.textContent = 'Download complete! Restarting...'

    if (!updatePostponed) {
        setTimeout(() => window.installUpdate(), 2000)
    } else {
        // Show banner with install button
        const text = document.getElementById('update-progress-text')
        const btn = document.getElementById('update-install-btn')
        if (text) text.textContent = 'Update ready to install!'
        if (btn) btn.style.display = 'block'
        const el = document.getElementById('update-banner')
        if (el) el.style.display = 'flex'
    }
})

function setLoginStatus(msg, color, dotColor) {
    const status = document.getElementById('login-update-status')
    const dot = document.getElementById('login-status-dot')
    if (status) { status.textContent = msg; status.style.color = color }
    if (dot) { dot.style.background = dotColor; dot.style.animation = dotColor === '#D4AF37' ? 'pulse-dot 1s ease-in-out infinite' : 'none' }
}

ipcRenderer.on('update-available', (event, version) => {
    setLoginStatus('UPDATE FOUND v' + version + ' - DOWNLOADING...', '#D4AF37', '#D4AF37')
})

ipcRenderer.on('update-progress', (event, pct) => {
    setLoginStatus('DOWNLOADING... ' + pct + '%', '#D4AF37', '#D4AF37')
})

ipcRenderer.on('update-downloaded', (event, version) => {
    setLoginStatus('UPDATE READY - RESTARTING...', '#4CAF50', '#4CAF50')
    setTimeout(() => window.installUpdate(), 2000)
})

ipcRenderer.on('update-not-available', () => {
    setLoginStatus('UP TO DATE', '#4CAF50', '#4CAF50')
})

ipcRenderer.on('update-error', () => {
    setLoginStatus('SERVER OFFLINE', '#ff4444', '#ff4444')
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

ipcRenderer.on('update-error', (event, message) => {
    const checkScreen = document.getElementById('update-check-screen')
    const checkMsg = document.getElementById('update-check-msg')
    if (checkMsg) checkMsg.textContent = 'UPDATE ERROR: ' + (message || 'Unable to check updates')
    if (checkScreen) {
        setTimeout(() => {
            checkScreen.style.opacity = '0'
            checkScreen.style.transition = 'opacity 0.5s'
            setTimeout(() => checkScreen.style.display = 'none', 500)
        }, 2000)
    }
})

// Trainer status
ipcRenderer.on('trainer-status', (event, msg) => {
    const el = document.getElementById('trainer-status-msg')
    const actMsg = document.getElementById('act-trainer-msg')
    if (el) el.textContent = msg
    if (actMsg) actMsg.textContent = msg
})
