// ── KeyAuth Config ──
const KEYAUTH = {
    name: 'Vortex',
    ownerid: 'sRW8K7AFHZ',
    secret: 'f56941b360b8959f0c525b0da1676ca9e0d64b770450dcb407bf1957783385ca',
    version: '1.0'
}

let sessionId = null

// ── SHA256 ──
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Init KeyAuth ──
async function initKeyAuth() {
    try {
        const res = await fetch(`https://keyauth.win/api/1.2/?type=init&name=${KEYAUTH.name}&ownerid=${KEYAUTH.ownerid}&ver=${KEYAUTH.version}`)
        const data = await res.json()
        if (!data.success) return false
        sessionId = data.sessionid
        return true
    } catch(e) {
        return false
    }
}

// ── KeyAuth Request ──
async function keyauthRequest(type, fields = {}) {
    if (!sessionId) {
        const ok = await initKeyAuth()
        if (!ok) return { success: false, message: 'Failed to connect to auth server!' }
    }
    const params = new URLSearchParams({
        type,
        sessionid: sessionId,
        name: KEYAUTH.name,
        ownerid: KEYAUTH.ownerid,
        ...fields
    })
    const res = await fetch(`https://keyauth.win/api/1.2/?${params}`)
    return res.json()
}

// ── HWID ──
function getHWID() {
    const raw = [navigator.userAgent, navigator.language, navigator.platform, screen.width, screen.height, new Date().getTimezoneOffset()].join('|')
    let h1 = 0, h2 = 0
    for (let i = 0; i < raw.length; i++) {
        const c = raw.charCodeAt(i)
        h1 = Math.imul(31, h1) + c | 0
        h2 = Math.imul(31, h2) + (c * 1337) | 0
    }
    const p1 = Math.abs(h1).toString(16).toUpperCase().padStart(8, '0')
    const p2 = Math.abs(h2).toString(16).toUpperCase().padStart(8, '0')
    const p3 = Math.abs(h1 ^ h2).toString(16).toUpperCase().padStart(8, '0')
    return `VORTEX-${p1}-${p2}-${p3}`
}

// ── Status ──
function showStatus(msg, isError = false) {
    const el = document.getElementById('login-status')
    el.textContent = msg
    el.style.color = isError ? '#ff4444' : '#4CAF50'
    el.style.display = 'block'
}

function clearStatus() {
    document.getElementById('login-status').style.display = 'none'
}

// ── Tab Switch ──
function switchLoginTab(tab) {
    document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.login-form-section').forEach(s => s.classList.remove('active'))
    document.querySelector(`.login-tab[data-tab="${tab}"]`).classList.add('active')
    document.getElementById(`form-${tab}`).classList.add('active')
    clearStatus()
}

// ── Loading Screen ──
function showLoading(msg = 'AUTHENTICATING...') {
    document.getElementById('loading-screen').style.display = 'flex'
    document.getElementById('loading-msg').textContent = msg
}

function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none'
}

// ── LOGIN ──
async function doLogin() {
    const user = document.getElementById('login-user').value.trim()
    const pass = document.getElementById('login-pass').value.trim()
    if (!user || !pass) { showStatus('Please enter username and password!', true); return }

    clearStatus()
    showLoading('AUTHENTICATING...')
    sessionId = null
    await initKeyAuth()

    const data = await keyauthRequest('login', { username: user, pass: pass, hwid: getHWID() })
    hideLoading()

    if (data.success) {
        showStatus('Login successful!')
        showLoading('LOADING VORTEX...')
        setTimeout(() => { hideLoading(); launchApp(user, data.info, '') }, 1500)
    } else {
        showStatus(data.message || 'Login failed!', true)
    }
}

// ── REGISTER ──
async function doRegister() {
    const user = document.getElementById('reg-user').value.trim()
    const pass = document.getElementById('reg-pass').value.trim()
    const pass2 = document.getElementById('reg-pass2').value.trim()
    const key  = document.getElementById('reg-key').value.trim()

    if (!user || !pass || !key) { showStatus('All fields are required!', true); return }
    if (pass !== pass2) { showStatus('Passwords do not match!', true); return }
    if (user.length < 3) { showStatus('Username must be at least 3 characters!', true); return }

    clearStatus()
    showLoading('CREATING ACCOUNT...')
    sessionId = null
    await initKeyAuth()

    const data = await keyauthRequest('register', { username: user, pass: pass, key: key, hwid: getHWID() })
    hideLoading()

    if (data.success) {
        showLoading('WELCOME TO VORTEX...')
        setTimeout(() => { hideLoading(); launchApp(user, data.info, key) }, 1500)
    } else {
        showStatus(data.message || 'Registration failed!', true)
    }
}

// ── FORGOT PASSWORD ──
async function doForgotPassword() {
    const user = document.getElementById('forgot-user').value.trim()
    if (!user) { showStatus('Please enter your username!', true); return }
    showLoading('PROCESSING...')
    setTimeout(() => {
        hideLoading()
        showStatus('Please contact support on Discord to reset your password!')
    }, 1000)
}

// ── LAUNCH APP ──
let currentUser = null
let currentInfo = null
let currentKey = null

function launchApp(username, info, key) {
    currentUser = username
    currentInfo = info
    currentKey = key

    document.getElementById('login-page').style.display = 'none'
    document.getElementById('main-app').style.display = 'flex'
    document.querySelector('.user-name').textContent = username

    if (info && info.subscriptions && info.subscriptions[0]) {
        const sub = info.subscriptions[0]
        document.querySelector('.user-plan').textContent = sub.subscription || 'Default'
        document.querySelector('.prem-status').textContent = 'Active'
        const exp = new Date(sub.expiry * 1000)
        document.querySelector('.prem-expiry').textContent = 'Expires: ' + exp.toLocaleDateString()
        if (document.getElementById('dd-plan')) document.getElementById('dd-plan').textContent = sub.subscription || 'Default'
        if (document.getElementById('dd-expiry')) document.getElementById('dd-expiry').textContent = exp.toLocaleDateString()
    }

    if (document.getElementById('dd-username')) document.getElementById('dd-username').textContent = username
    if (document.getElementById('dd-hwid')) document.getElementById('dd-hwid').textContent = getHWID()
    if (document.getElementById('dd-platform')) document.getElementById('dd-platform').textContent = navigator.platform
    if (document.getElementById('dd-screen')) document.getElementById('dd-screen').textContent = screen.width + 'x' + screen.height

    populateAccount(username, info, key)
    renderGames()
}

// ── TRAINER STATUS ──

const https = require('https')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const os = require('os')

function setActivityTrainer(msg, show = true) {
    const el = document.getElementById('act-trainer')
    const msgEl = document.getElementById('act-trainer-msg')
    const overlayMsg = document.getElementById('trainer-status-msg')
    if (el) el.style.display = show ? 'flex' : 'none'
    if (msgEl) msgEl.textContent = msg
    if (overlayMsg) overlayMsg.textContent = msg
}

async function launchGame(steamId, trainerKey, btn) {
    if (btn) btn.disabled = true
    const overlay = document.getElementById('trainer-overlay')
    if (overlay) overlay.style.display = 'flex'

    // Launch game via Steam
    if (steamId > 0) {
        setActivityTrainer('Launching game...')
        window.openExternal('steam://rungameid/' + steamId)
        // Wait for game to load
        setActivityTrainer('Waiting for game to load...')
        await new Promise(r => setTimeout(r, 15000))
    }

    // Now launch trainer
    await launchTrainer(trainerKey, btn)
}

async function launchTrainer(gameName, btn) {
    const overlay = document.getElementById('trainer-overlay')
    if (overlay) overlay.style.display = 'flex'
    if (btn) btn.disabled = true

    setActivityTrainer('Connecting to server...')

    try {
        const appData = process.env.APPDATA || os.homedir()
        const vortexDir = path.join(appData, 'Vortex')
        const trainerPath = path.join(vortexDir, 'runtime.exe')

        if (!fs.existsSync(vortexDir)) fs.mkdirSync(vortexDir, { recursive: true })

        const url = 'https://vortex-server-production.up.railway.app/api/trainer/' + gameName
        setActivityTrainer('Downloading trainer...')

        const hwid = getHWID()
        const sid = sessionId || ('vortex-' + hwid.substring(0, 8))
        const postData = JSON.stringify({ sessionId: sid, hwid })

        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(trainerPath)
            const options = {
                hostname: 'vortex-server-production.up.railway.app',
                path: '/api/trainer/' + gameName,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }
            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) {
                    reject(new Error('Server returned ' + res.statusCode))
                    return
                }
                const total = parseInt(res.headers['content-length'] || '0')
                let downloaded = 0
                res.on('data', chunk => {
                    downloaded += chunk.length
                    if (total > 0) {
                        const pct = Math.round((downloaded / total) * 100)
                        setActivityTrainer('Downloading... ' + pct + '%')
                    }
                })
                res.pipe(file)
                file.on('finish', () => { file.close(); resolve() })
                file.on('error', reject)
            })
            req.on('error', reject)
            req.write(postData)
            req.end()
        })

        setActivityTrainer('Launching trainer...')
        exec(`"${trainerPath}"`)

        setTimeout(() => {
            if (overlay) overlay.style.display = 'none'
            setActivityTrainer('Trainer launched!', true)
            setTimeout(() => setActivityTrainer('', false), 3000)
            if (btn) btn.disabled = false
        }, 1500)

    } catch(e) {
        console.error('Trainer error:', e)
        setActivityTrainer('Error: ' + (e.message || 'Unknown error'))
        if (btn) btn.disabled = false
        setTimeout(() => {
            if (overlay) overlay.style.display = 'none'
            setActivityTrainer('', false)
        }, 4000)
    }
}

// ── STEAM SCANNER ──
const steamLibraryPaths = [
    'C:\\Program Files (x86)\\Steam\\steamapps',
    'C:\\Program Files\\Steam\\steamapps',
]

function getSteamInstalledIds() {
    const installedIds = new Set()
    try {
        // Read libraryfolders.vdf to get all library paths
        const vdfPaths = [
            'C:\\Program Files (x86)\\Steam\\steamapps\\libraryfolders.vdf',
            'C:\\Program Files\\Steam\\steamapps\\libraryfolders.vdf'
        ]
        let allPaths = [...steamLibraryPaths]
        for (const vdfPath of vdfPaths) {
            if (fs.existsSync(vdfPath)) {
                const content = fs.readFileSync(vdfPath, 'utf8')
                const pathMatches = content.match(/"path"\s+"([^"]+)"/g)
                if (pathMatches) {
                    pathMatches.forEach(m => {
                        const p = m.match(/"path"\s+"([^"]+)"/)[1]
                        allPaths.push(p + '\\steamapps')
                    })
                }
                // Get installed app IDs
                const appMatches = content.match(/"(\d{5,})"\s+"\d+"/g)
                if (appMatches) {
                    appMatches.forEach(m => {
                        const id = m.match(/"(\d{5,})"/)[1]
                        installedIds.add(parseInt(id))
                    })
                }
            }
        }
        // Also scan acf files directly
        for (const libPath of allPaths) {
            if (fs.existsSync(libPath)) {
                fs.readdirSync(libPath).forEach(f => {
                    const m = f.match(/appmanifest_(\d+)\.acf/)
                    if (m) installedIds.add(parseInt(m[1]))
                })
            }
        }
    } catch(e) {
        console.log('Steam scan error:', e.message)
    }
    return installedIds
}

// ── GAMES ──
const gameDefinitions = [
    { name: 'Windrose',        status: 'active', steamId: 3041230,  trainerKey: 'windrose'   },
    { name: 'GTA V',           status: 'active', steamId: 271590,   trainerKey: 'gtav'       },
    { name: 'Valheim',         status: 'active', steamId: 892970,   trainerKey: 'valheim'    },
    { name: 'Skyrim',          status: 'active', steamId: 489830,   trainerKey: 'skyrim'     },
    { name: 'Cyberpunk 2077',  status: 'active', steamId: 1091500,  trainerKey: 'cyberpunk'  },
    { name: 'Sons of Forest',  status: 'active', steamId: 1326470,  trainerKey: 'sonsofforest'},
    { name: 'Grounded',        status: 'active', steamId: 962130,   trainerKey: 'grounded'   },
    { name: 'Red Dead 2',      status: 'active', steamId: 1174180,  trainerKey: 'reddead2'   },
    { name: 'Raft',            status: 'active', steamId: 648800,   trainerKey: 'raft'       },
    { name: 'Minecraft',       status: 'soon',   steamId: 0,        trainerKey: 'minecraft'  },
    { name: 'Project Zomboid', status: 'soon',   steamId: 108600,   trainerKey: 'zomboid'    },
    { name: 'DayZ',            status: 'soon',   steamId: 221100,   trainerKey: 'dayz'       },
]

let installedSteamIds = new Set()
try { installedSteamIds = getSteamInstalledIds() } catch(e) {}
console.log('Installed Steam IDs:', [...installedSteamIds])

const games = gameDefinitions.map(g => ({
    ...g,
    installed: g.steamId > 0 ? installedSteamIds.has(g.steamId) : false
}))

function renderGames(filter = 'all', search = '') {
    const grid = document.getElementById('game-grid')
    if (!grid) return
    grid.innerHTML = ''

    const filtered = games.filter(g => {
        if (filter === 'active' && g.status !== 'active') return false
        if (filter === 'soon'   && g.status !== 'soon')   return false
        if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    filtered.forEach(game => {
        const card = document.createElement('div')
        card.className = 'game-card'

        const coverUrl = game.steamId > 0
            ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamId}/library_600x900.jpg`
            : ''

        const statusHtml = !game.installed
            ? `<div class="game-status s-none"><div class="sdot"></div>Not Installed</div>`
            : game.status === 'active'
                ? `<div class="game-status s-ready"><div class="sdot"></div>Ready</div>`
                : `<div class="game-status s-soon"><div class="sdot"></div>Coming Soon</div>`

        const gameKey = game.trainerKey || game.name.toLowerCase().replace(/ /g, '')
        const hasTrainer = game.status === 'active'

        card.innerHTML = `
            ${coverUrl ? `<img class="game-cover" src="${coverUrl}" alt="${game.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
            <div class="game-cover-placeholder" ${coverUrl ? 'style="display:none"' : ''}>${game.name}</div>
            <div class="card-menu">&#8942;</div>
            <div class="card-corners">
                <div class="cc tl"></div><div class="cc tr"></div>
                <div class="cc bl"></div><div class="cc br"></div>
            </div>
            <div class="game-info">
                <div class="game-name">${game.name}</div>
                ${statusHtml}
                ${hasTrainer ? `<button class="launch-btn" onclick="event.stopPropagation();launchGame(${game.steamId}, '${gameKey}', this)">&#9654; LAUNCH TRAINER</button>` : ''}
            </div>`

        card.addEventListener('click', () => {
            document.querySelectorAll('.game-card').forEach(c => c.classList.remove('selected'))
            card.classList.add('selected')
        })

        grid.appendChild(card)
    })
}

// ── NAV ──
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault()
        const page = item.dataset.page
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'))
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
        item.classList.add('active')
        document.getElementById(`page-${page}`).classList.add('active')
    })
})

// ── SEARCH & FILTER ──
document.getElementById('search').addEventListener('input', e => renderGames('all', e.target.value))
document.getElementById('filter').addEventListener('change', e => renderGames(e.target.value))

// ── DISCORD ──
function openDiscord() {
    window.openExternal('https://discord.gg/wdrj5auhEB')
}

// ── USER DROPDOWN ──
function toggleDropdown() {
    document.getElementById('user-dropdown').classList.toggle('open')
}

document.addEventListener('click', e => {
    const pill = document.getElementById('user-pill')
    const dd = document.getElementById('user-dropdown')
    if (dd && pill && !pill.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.remove('open')
    }
})

// ── LOGOUT ──
function doLogout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionId = null
        document.getElementById('main-app').style.display = 'none'
        document.getElementById('login-page').style.display = 'flex'
        document.getElementById('login-user').value = ''
        document.getElementById('login-pass').value = ''
        switchLoginTab('login')
        initKeyAuth()
    }
}

// ── ACTIVITY BAR ──
const activities = [
    'Vortex Launcher v0.1 released! Check out the latest features.',
    'New game support coming soon!',
    'Join our Discord for support and updates.',
]
let actIdx = 0
setInterval(() => {
    actIdx = (actIdx + 1) % activities.length
    const el = document.querySelector('.act-text')
    if (el) el.textContent = activities[actIdx]
}, 5000)

// ── ENTER KEY ──
document.addEventListener('keypress', e => {
    if (e.key !== 'Enter') return
    if (document.getElementById('form-login').classList.contains('active')) doLogin()
    if (document.getElementById('form-register').classList.contains('active')) doRegister()
    if (document.getElementById('form-forgot') && document.getElementById('form-forgot').classList.contains('active')) doForgotPassword()
})

// ── INIT ──
initKeyAuth()

// ── POPULATE ACCOUNT PAGE ──
function populateAccount(username, info, keyValue) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '-' }

    set('acc-username', username)
    set('acc-platform', navigator.platform)
    set('acc-screen', screen.width + 'x' + screen.height)
    set('acc-lang', navigator.language)
    set('acc-tz', 'UTC' + (new Date().getTimezoneOffset() / -60 >= 0 ? '+' : '') + (new Date().getTimezoneOffset() / -60))
    set('acc-hwid', getHWID())

    if (keyValue) {
        const masked = '****-****-****-' + keyValue.slice(-4).toUpperCase()
        set('acc-key', masked)
    }

    if (info && info.subscriptions && info.subscriptions[0]) {
        const sub = info.subscriptions[0]
        set('acc-plan', sub.subscription || 'Default')
        const exp = new Date(sub.expiry * 1000)
        set('acc-expiry', exp.toLocaleDateString())

        const now = new Date()
        const diff = exp - now
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            set('acc-timeleft', days + 'd ' + hours + 'h remaining')
        } else {
            set('acc-timeleft', 'Expired')
        }
    } else {
        set('acc-plan', 'Default')
        set('acc-timeleft', 'N/A')
    }
}

// ── THEMES ──
function setTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-gold', 'theme-dark')
    if (theme !== 'dark') document.body.classList.add('theme-' + theme)
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'))
    const btn = document.getElementById('theme-' + theme)
    if (btn) btn.classList.add('active')
    localStorage.setItem('vortex-theme', theme)
}

function toggleCompact(el) {
    document.body.classList.toggle('compact', el.checked)
}

function toggleGrid(el) {
    document.querySelector('.main-app').style.backgroundImage = el.checked
        ? 'linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)'
        : 'none'
}

// Load saved theme
const savedTheme = localStorage.getItem('vortex-theme') || 'dark'
setTheme(savedTheme)
