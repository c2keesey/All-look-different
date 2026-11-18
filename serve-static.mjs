// Read-only static server for alllookdifferent.c2k.page. Serves the game files in $ROOT
// on loopback; the c2k-website Cloudflare Tunnel is the only ingress. Same shape as the
// Quietly demo server: GET/HEAD only, no directory listings, no dotfiles, strict CSP.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve(process.env.ROOT ?? 'public')
const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 4336)
const LEADERBOARD = 'https://alllookdifferent-leaderboard.c2k-projects.workers.dev'
// c2k.page's project showcase reads faces.json; nothing else is shared cross-origin.
const SHARED_ORIGINS = new Set(['https://c2k.page'])

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

const headers = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' ${LEADERBOARD}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
}

async function resolveFile(urlPath) {
  let decoded
  try { decoded = decodeURIComponent(urlPath) } catch { return null }
  if (decoded.includes('\0')) return null
  const file = normalize(join(root, decoded))
  if (file !== root && !file.startsWith(root + sep)) return null
  if (file.split(sep).some((part) => part.startsWith('.') && part.length > 1)) return null
  try {
    const info = await stat(file)
    return info.isFile() ? file : null
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }).end()
    return
  }
  const path = (req.url ?? '/').split('?')[0]
  const file = path === '/' ? join(root, 'index.html') : await resolveFile(path)
  if (!file) {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
    return
  }
  try {
    const body = await readFile(file)
    const extra = {}
    const origin = req.headers.origin
    if (file.endsWith('faces.json') && SHARED_ORIGINS.has(origin)) {
      extra['Access-Control-Allow-Origin'] = origin
      extra['Vary'] = 'Origin'
    }
    const cache = file.includes(`${sep}images${sep}`) ? 'public, max-age=604800' : 'no-cache'
    res.writeHead(200, { ...headers, ...extra, 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': cache })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    res.writeHead(500, headers).end()
  }
}).listen(port, host, () => console.log(`serving ${root} on http://${host}:${port}`))
