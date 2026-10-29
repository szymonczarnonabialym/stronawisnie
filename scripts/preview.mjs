import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.env.PORT||5185);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
let cachedOffer=null,loadedAt=0;
async function previewOffer(){
 if(process.env.PREVIEW_OFFER_FIXTURE)return JSON.parse(await readFile(process.env.PREVIEW_OFFER_FIXTURE,'utf8'));
 if(cachedOffer&&Date.now()-loadedAt<45000)return cachedOffer;
 try{
  const response=await fetch('https://czeresniekoscian.pl/api/public/offer',{signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw new Error('Offer unavailable');
  const data=await response.json();
  // Local design preview shows the complete page even while the real season is closed.
  // No writes to the remote application; prices and statuses are never invented.
  cachedOffer={...data,siteEnabled:true,items:Array.isArray(data.items)?data.items:[],message:data.siteEnabled===false?'Podgląd projektu. Sezon na publicznej stronie jest zakończony.':data.message};
 }catch{
  cachedOffer={siteEnabled:true,season:new Date().getFullYear(),items:[],message:'Nie udało się pobrać oferty. Dostępność potwierdzisz telefonicznie.'};
 }
 loadedAt=Date.now();return cachedOffer;
}
const server=createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Podgląd jest tylko do odczytu.');return}
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/api/public/offer'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(await previewOffer()));return}
  if(url.pathname==='/panel'||url.pathname==='/login'){res.writeHead(302,{Location:'https://czeresniekoscian.pl/panel'});res.end();return}
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/')pathname='/index.html';
  if(pathname==='/praca'||pathname==='/praca/')pathname='/praca.html';
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root.endsWith(sep)?root:root+sep)||!types[extname(path)]){res.writeHead(404);res.end('Nie znaleziono strony.');return}
  if(!(await stat(path)).isFile()){res.writeHead(404);res.end();return}
  let content=await readFile(path);
  if(extname(path)==='.html')content=Buffer.from(content.toString().replace('</body>',`<aside class="preview-note">${process.env.PREVIEW_OFFER_FIXTURE?'Podgląd testowy · przykładowa oferta':'Podgląd lokalny · projekt do oceny'}</aside></body>`));
  res.writeHead(200,{'Content-Type':types[extname(path)],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:content);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end('Nie udało się otworzyć podglądu.')}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}\nRead-only preview. Orders are not sent. Production is unchanged.`));
