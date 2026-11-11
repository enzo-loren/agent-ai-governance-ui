import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT ?? '4173');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (file !== root && !file.startsWith(root + sep)) {res.writeHead(403).end(); return;}
  if (pathname.startsWith('/.git') || pathname.startsWith('/tests/') || pathname.startsWith('/docs/') || pathname.startsWith('/scripts/')) {res.writeHead(404).end(); return;}
  try {
    const info = await stat(file);
    if (!info.isFile()) {res.writeHead(404).end(); return;}
    const body = await readFile(file);
    res.setHeader('Content-Type',types[extname(file)] ?? 'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.writeHead(200).end(body);
  } catch {res.writeHead(404).end('Not found');}
}).listen(port, '127.0.0.1', () => console.log(`Prototype on http://127.0.0.1:${port}`));
