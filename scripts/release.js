const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version
const ADMIN_KEY = 'hrcvyMhmzlHpuy6B7Yf9HsFlvhyHWbWD'
const VPS = '2.24.88.146'
const PORT = 3000

async function uploadFile(filePath, filename) {
    return new Promise((resolve, reject) => {
        const data = fs.readFileSync(filePath)
        const options = {
            hostname: VPS,
            port: PORT,
            path: '/api/update/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': data.length,
                'x-admin-key': ADMIN_KEY,
                'x-filename': filename
            }
        }
        const req = http.request(options, (res) => {
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => {
                console.log(`✅ Uploaded ${filename}:`, body)
                resolve()
            })
        })
        req.on('error', reject)
        req.write(data)
        req.end()
    })
}

async function release() {
    const distDir = 'dist'
    const exeFile = `VortexLauncher-Setup-${version}.exe`
    const blockmapFile = `VortexLauncher-Setup-${version}.exe.blockmap`
    const ymlFile = 'latest.yml'

    console.log(`🚀 Releasing v${version} to VPS...`)

    // Upload exe
    if (fs.existsSync(path.join(distDir, exeFile))) {
        await uploadFile(path.join(distDir, exeFile), exeFile)
    }

    // Upload blockmap
    if (fs.existsSync(path.join(distDir, blockmapFile))) {
        await uploadFile(path.join(distDir, blockmapFile), blockmapFile)
    }

    // Upload latest.yml
    if (fs.existsSync(path.join(distDir, ymlFile))) {
        await uploadFile(path.join(distDir, ymlFile), ymlFile)
    }

    console.log(`✅ v${version} released to VPS!`)

    // Notify Discord
    require('./notify-discord')
}

release().catch(console.error)
