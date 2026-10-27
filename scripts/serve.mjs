import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/tools.mjs';

const DIST = path.join(ROOT, 'dist');
const port = Number(process.env.PORT) || 4321;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

function build() {
  return spawnSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'inherit' }).status === 0;
}
build();

// Reconstruye al cambiar tools/, src/ o site.json
let timer;
for (const p of ['tools', 'src', 'site.json']) {
  fs.watch(path.join(ROOT, p), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, p);
  if (!file.startsWith(DIST)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': MIME['.html'] });
    return res.end(fs.existsSync(path.join(DIST, '404.html')) ? fs.readFileSync(path.join(DIST, '404.html')) : 'Not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '0.0.0.0', () => console.log(`\nhttp://localhost:${port}  (se reconstruye al editar tools/ o src/)`));
