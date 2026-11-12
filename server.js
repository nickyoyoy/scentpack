import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port default 3001 agar tidak tabrakan dengan dashboard ads (port 3000)
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health check endpoint
  if (pathname === '/healthz' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'scentpack-fulfillment', uptime: process.uptime() }));
    return;
  }

  // 2. Serve static files from dist/
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check: prevent path traversal attacks
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  // If file doesn't exist, fallback to index.html (SPA client-side routing)
  let stats;
  try {
    stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
      stats = fs.statSync(filePath);
    }
  } catch {
    filePath = path.join(DIST_DIR, 'index.html');
    try {
      stats = fs.statSync(filePath);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Build files not found. Run "npm run build" first to generate dist/.');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHashedAsset = pathname.startsWith('/assets/') && ext !== '.html';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'Cache-Control': isHashedAsset
      ? 'public, max-age=31536000, immutable'
      : 'no-cache, no-store, must-revalidate',
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`[ScentPack Fulfillment Dashboard] Server running at http://${HOST}:${PORT}`);
  console.log(`- Static directory: ${DIST_DIR}`);
  console.log(`- Health check: http://${HOST}:${PORT}/healthz`);
});

