const https = require('https')
const fs = require('fs')

const WEBHOOK = 'https://discordapp.com/api/webhooks/1501440918967025694/gNWDFfPPkrDHixltPPvaPVT5-N5Ax3kvmeVByH4c0QCTiW85whgmTD17qH5jgkBXqdQi'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version

const payload = JSON.stringify({
    username: '🌀 Vortex Updates',
    avatar_url: 'https://cdn.discordapp.com/attachments/1501442936963993631/1501443289671536711/e32c00d2-60e7-4c18-b1fa-e5cbf2f36bd2.png?ex=69fc1787&is=69fac607&hm=e09ee2230e0eca7f647bac88d5828270aa5a9deb86716fce900277a91d190371&',
    embeds: [{
        title: `🌀 Vortex Launcher v${version} Released!`,
        description: `A new version of Vortex Launcher is now available!\n\n**Whats new in v${version}:**\n> Check the full changelog on GitHub`,
        color: 0xD4AF37,
        fields: [
            { name: '📥 Download', value: `[VortexLauncher-Setup-${version}.exe](https://github.com/Z1PPYCAT/VortexLauncher/releases/tag/v${version})`, inline: true },
            { name: '🔄 Auto Update', value: 'Open your launcher to update automatically!', inline: true }
        ],
        image: {
            url: 'https://cdn.discordapp.com/attachments/1501442936963993631/1501442973689188372/f178ba61-e16c-4e48-a5a5-45bb4b001318.png?ex=69fc173c&is=69fac5bc&hm=ca674974a599c7e28c77feaf6da62826252e89299ff119396ad9fbfb6c5a4e8a&'
        },
        thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/1501442936963993631/1501443289671536711/e32c00d2-60e7-4c18-b1fa-e5cbf2f36bd2.png?ex=69fc1787&is=69fac607&hm=e09ee2230e0eca7f647bac88d5828270aa5a9deb86716fce900277a91d190371&'
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
