import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root)) throw new Error('Invalid path');
    if (!['.html', '.css', '.js', '.svg'].includes(extname(path))) throw new Error('Not found');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log(`Pocket Arcade is ready at http://localhost:${server.address().port}`));
