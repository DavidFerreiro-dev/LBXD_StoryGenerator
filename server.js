// Tiny zero-dependency static server for local use: npm start -> http://localhost:3000
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let pathname = '/';
  try { pathname = decodeURIComponent(req.url.split('?')[0]); } catch (e) {}
  const file = path.join(root, pathname === '/' ? 'index.html' : path.normalize(pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('LBXD Story Generator -> http://localhost:' + (process.env.PORT || 3000)));
