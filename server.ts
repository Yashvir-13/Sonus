import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApiRequest } from './server/api-router.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
if (
  process.env.VITE_API_BASE_URL === 'http://127.0.0.1:8000' ||
  process.env.VITE_API_BASE_URL === 'http://localhost:8000'
) {
  delete process.env.VITE_API_BASE_URL
}
const PORT = Number(
  process.env.DEFAULT_APP_PORT ||
    (process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? process.env.PORT : 3000)
)
const HOST = process.env.HOST || '0.0.0.0'
const IS_PROD = process.env.NODE_ENV === 'production'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

async function startServer() {
  let viteMiddleware: ((req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void) | null = null

  if (!IS_PROD) {
    const viteModulePath = path.resolve(__dirname, 'apps/web/node_modules/vite/dist/node/index.js')
    const vitePkg = await import(viteModulePath)
    const viteServer = await vitePkg.createServer({
      root: path.resolve(__dirname, 'apps/web'),
      configFile: path.resolve(__dirname, 'apps/web/vite.config.ts'),
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    })
    viteMiddleware = viteServer.middlewares
  }

  const distDir = path.resolve(__dirname, 'apps/web/dist')

  const server = http.createServer(async (req, res) => {
    const handled = await handleApiRequest(req, res)
    if (handled) return

    if (viteMiddleware) {
      viteMiddleware(req, res, () => {
        res.statusCode = 404
        res.end('Not Found')
      })
      return
    }

    // Production static file + SPA fallback
    const urlPath = (req.url || '/').split('?')[0]
    const safeRel = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
    let filePath = path.join(distDir, safeRel === '/' ? 'index.html' : safeRel)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html')
    }
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  })

  server.listen(PORT, HOST, () => {
    console.log(`Sonus full-stack server listening on http://${HOST}:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start Sonus server:', err)
  process.exit(1)
})
