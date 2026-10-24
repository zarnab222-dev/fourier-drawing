const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
http.createServer((req,res) => {
  const name = req.url.split('?')[0];
  const files = {'/':'index.html','/index.html':'index.html','/toy.js':'toy.js'};
  if (!files[name]) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html');
  res.setHeader('Cache-Control','no-store');
  fs.createReadStream(path.join(root,files[name])).pipe(res);
}).listen(4186,'127.0.0.1',() => console.log('little hungers: http://127.0.0.1:4186'));
