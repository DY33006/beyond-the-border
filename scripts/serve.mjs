import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const args=process.argv.slice(2),get=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const root=resolve('dist'),host=get('--host','127.0.0.1'),port=Number(get('--port','3000'));
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.csv':'text/csv'};
http.createServer(async(req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+(path==='/'?'/index.html':path));
 if(!file.startsWith(root+'/')){res.writeHead(403).end();return;}
 const content=await readFile(file);res.writeHead(200,{'Content-Type':(types[extname(file)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'}).end(content);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,host,()=>console.log(`Preview listening at http://${host}:${port}`));
