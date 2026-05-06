const { app, BrowserWindow, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')

// ── AUTO UPDATER ──
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...')
})

autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version)
    if (mainWindow) {
        mainWindow.webContents.send('update-available', info.version)
    }
})

autoUpdater.on('update-not-available', () => {
    console.log('[Updater] App is up to date')
})

autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent)
    console.log('[Updater] Download progress:', pct + '%')
    if (mainWindow) {
        mainWindow.webContents.send('update-progress', pct)
    }
})

autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version)
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', info.version)
    }
})

autoUpdater.on('error', (err) => {
    console.log('[Updater] Error:', err.message)
})
const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const { exec } = require('child_process')
const os = require('os')

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        minWidth: 1100,
        minHeight: 700,
        frame: false,
        transparent: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'src/preload.js')
        }
    })
    mainWindow.loadFile('src/index.html')

    // Check for updates 3 seconds after launch
    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify().catch(err => {
                console.log('[Updater] Check failed:', err.message)
            })
        }, 3000)
    })

    // ── SECURITY ──
    // Disable devtools
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12') event.preventDefault()
        if (input.key === 'I' && input.control && input.shift) event.preventDefault()
        if (input.key === 'J' && input.control && input.shift) event.preventDefault()
        if (input.key === 'U' && input.control) event.preventDefault()
        if (input.key === 'F5') event.preventDefault()
        if (input.key === 'r' && input.control) event.preventDefault()
    })

    // Disable right click
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault())

    // Disable devtools completely in production
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools()
    })

    // Prevent new windows
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── UPDATE IPC ──
ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdates()
        return { success: true, version: result?.updateInfo?.version }
    } catch(e) {
        return { success: false, message: e.message }
    }
})

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall()
})

// Window controls
ipcMain.on('minimize', () => mainWindow.minimize())
ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
})
ipcMain.on('close', () => mainWindow.close())

// Launch Trainer
ipcMain.handle('launch-trainer', async (event, gameName) => {
    return new Promise((resolve) => {
        const appData = process.env.APPDATA || os.homedir()
        const vortexDir = path.join(appData, 'Vortex')
        const trainerPath = path.join(vortexDir, 'runtime.exe')

        // Create Vortex dir if needed
        if (!fs.existsSync(vortexDir)) {
            fs.mkdirSync(vortexDir, { recursive: true })
        }

        const serverUrl = 'https://vortex-server-production.up.railway.app/api/trainer/' + gameName + '_trainer'

        console.log('Downloading trainer from:', serverUrl)
        mainWindow.webContents.send('trainer-status', 'Downloading trainer...')

        const file = fs.createWriteStream(trainerPath)

        const request = https.get(serverUrl, (response) => {
            if (response.statusCode !== 200) {
                file.close()
                resolve({ success: false, message: 'Server error: ' + response.statusCode })
                return
            }

            const totalSize = parseInt(response.headers['content-length'] || '0')
            let downloaded = 0

            response.on('data', (chunk) => {
                downloaded += chunk.length
                if (totalSize > 0) {
                    const pct = Math.round((downloaded / totalSize) * 100)
                    mainWindow.webContents.send('trainer-status', `Downloading... ${pct}%`)
                }
            })

            response.pipe(file)

            file.on('finish', () => {
                file.close()
                mainWindow.webContents.send('trainer-status', 'Launching trainer...')

                // Launch the trainer
                exec(`"${trainerPath}"`, (err) => {
                    if (err) {
                        console.error('Launch error:', err)
                    }
                })

                setTimeout(() => {
                    resolve({ success: true, message: 'Trainer launched!' })
                }, 1000)
            })

            file.on('error', (err) => {
                fs.unlink(trainerPath, () => {})
                resolve({ success: false, message: 'Write error: ' + err.message })
            })
        })

        request.on('error', (err) => {
            file.close()
            resolve({ success: false, message: 'Download error: ' + err.message })
        })

        request.setTimeout(30000, () => {
            request.destroy()
            resolve({ success: false, message: 'Download timed out!' })
        })
    })
})
