const https = require('https')
const fs = require('fs')
const path = require('path')

const PROJECT_REF = 'vkezarhccbxrmawkjvha'

function runQuery(accessToken, sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql })
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data))
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    console.log('SUPABASE_ACCESS_TOKEN not set, skipping migrations')
    return
  }

  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    process.stdout.write(`migrate: ${file} ... `)
    try {
      await runQuery(accessToken, sql)
      console.log('ok')
    } catch (e) {
      console.log(`skipped (${e.message.slice(0, 80)})`)
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
