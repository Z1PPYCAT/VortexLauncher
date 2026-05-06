const https = require('https')
const fs = require('fs')

const WEBHOOK = 'https://discordapp.com/api/webhooks/1501440918967025694/gNWDFfPPkrDHixltPPvaPVT5-N5Ax3kvmeVByH4c0QCTiW85whgmTD17qH5jgkBXqdQi'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version

const payload = JSON.stringify({
    username: '🌀 Vortex Updates',
    avatar_url: 'https://raw.githubusercontent.com/Z1PPYCAT/VortexLauncher/main/src/assets/icon.png',
    embeds: [{
        title: `🌀 Vortex Launcher v${version} Released!`,
        description: `A new version of Vortex Launcher is now available!\n\n**Whats new in v${version}:**\n> Check the full changelog on GitHub`,
        color: 0xD4AF37,
        fields: [
            { name: '📥 Download', value: `[VortexLauncher-Setup-${version}.exe](https://github.com/Z1PPYCAT/VortexLauncher/releases/tag/v${version})`, inline: true },
            { name: '🔄 Auto Update', value: 'Open your launcher to update automatically!', inline: true }
        ],
        image: {
            url: 'https://raw.githubusercontent.com/Z1PPYCAT/VortexLauncher/main/src/assets/icon512.png'
        },
        thumbnail: {
            url: 'https://raw.githubusercontent.com/Z1PPYCAT/VortexLauncher/main/src/assets/icon.png'
        },
        footer: { text: 'Vortex Launcher • TheTechGuy' },
        timestamp: new Date().toISOString()
    }]
})

const url = new URL(WEBHOOK)
const req = https.request({
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
}, (res) => {
    if (res.statusCode === 204) console.log('Discord notified!')
    else console.log('Failed:', res.statusCode)
})

req.on('error', (e) => console.error('Error:', e.message))
req.write(payload)
req.end()
