const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')
const { exec } = require('child_process')

let mainWindow

// ── AUTO UPDATER ──
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.setFeedURL({ provider: 'generic', url: 'http://2.24.88.146:3000/updates' })

autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-available', info.version)
})
autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-not-available')
})
autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) mainWindow.webContents.send('update-progress', Math.round(progress.percent))
})
autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded', info.version)
})
autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('update-error', err.message)
})

// ── HWID ──
function getOrCreateHWID() {
    const hwidFile = path.join(os.homedir(), 'AppData', 'Roaming', 'Vortex', 'hwid.dat')
    const dir = path.dirname(hwidFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (fs.existsSync(hwidFile)) return fs.readFileSync(hwidFile, 'utf8').trim()
    const machineId = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model || 'cpu', os.totalmem().toString()].join('|')
    const hwid = 'VORTEX-' + crypto.createHash('sha256').update(machineId).digest('hex').toUpperCase().substring(0, 24)
    fs.writeFileSync(hwidFile, hwid, 'utf8')
    return hwid
}
const MACHINE_HWID = getOrCreateHWID()

// ── KEYAUTH ──
const KA_NAME = 'Vortex'
const KA_OWNERID = 'sRW8K7AFHZ'
const KA_VER = '1.0'

function keyauthGet(params) {
    const https = require('https')
    return new Promise((resolve) => {
        const qs = new URLSearchParams(params)
        https.get(`https://keyauth.win/api/1.2/?${qs}`, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { resolve({ success: false, message: 'Parse error' }) } })
        }).on('error', () => resolve({ success: false, message: 'Connection error' }))
    })
}

ipcMain.handle('get-hwid', () => MACHINE_HWID)
ipcMain.handle('keyauth-init', async () => { console.log('[Main] keyauth-init called'); return keyauthGet({ type: 'init', name: KA_NAME, ownerid: KA_OWNERID, ver: KA_VER }) })
ipcMain.handle('keyauth-request', async (event, type, fields, sid) => keyauthGet({ type, sessionid: sid, name: KA_NAME, ownerid: KA_OWNERID, ...fields }))
ipcMain.handle('check-for-updates', async () => {
    try { const r = await autoUpdater.checkForUpdates(); return { success: true, version: r?.updateInfo?.version } }
    catch(e) { return { success: false, message: e.message } }
})
ipcMain.on('install-update', () => autoUpdater.quitAndInstall())

// ── WINDOW ──
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400, height: 800, minWidth: 1100, minHeight: 700,
        frame: false, transparent: false,
        webPreferences: { nodeIntegration: true, contextIsolation: false, preload: path.join(__dirname, 'src/preload.js') }
    })

    mainWindow.loadFile('src/index.html')

    mainWindow.webContents.once('did-finish-load', () => {
        if (!app.isPackaged) {
            if (mainWindow) mainWindow.webContents.send('update-not-available')
            return
        }
        const hardTimeout = setTimeout(() => {
            if (mainWindow) mainWindow.webContents.send('update-not-available')
        }, 6000)
        autoUpdater.checkForUpdates().catch(err => {
            clearTimeout(hardTimeout)
            if (mainWindow) mainWindow.webContents.send('update-not-available')
        })
    })

    setInterval(() => {
        if (app.isPackaged) autoUpdater.checkForUpdates().catch(() => {})
    }, 5 * 1000)

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') event.preventDefault()
        if (input.key === 'I' && input.control && input.shift) event.preventDefault()
        if (input.key === 'U' && input.control) event.preventDefault()
        if (input.key === 'F5') event.preventDefault()
        if (input.key === 'r' && input.control) event.preventDefault()
    })
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault())
    mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.closeDevTools())
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

// ── WINDOW CONTROLS ──
ipcMain.on('minimize', () => mainWindow && mainWindow.minimize())
ipcMain.on('maximize', () => { if (!mainWindow) return; if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize() })
ipcMain.on('close', () => mainWindow && mainWindow.close())

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
