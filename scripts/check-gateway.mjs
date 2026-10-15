import assert from 'node:assert/strict';
import worker,{isOrchardPath} from '../cloudflare/worker.mjs';
for(const path of ['/panel','/panel/','/api/farm','/api/site-offer','/api/public/offer','/assets/index.js','/_next/static/index.js','/login','/sw.js','/manifest.webmanifest'])assert.ok(isOrchardPath(path),path);
for(const path of ['/','/praca.html','/images/hero_cherries.png','/offer.js','/panel-public','/robots.txt'])assert.ok(!isOrchardPath(path),path);
let forwarded;
const env={SAD:{fetch:async r=>{forwarded=r;return Response.json({ok:true})}},ASSETS:{fetch:async()=>new Response('public')}};
assert.equal(await (await worker.fetch(new Request('https://czeresniekoscian.pl/'),env)).text(),'public');
const request=new Request('https://czeresniekoscian.pl/api/site-offer',{method:'PUT',headers:{Cookie:'__Host-sad_session=fixture',Origin:'https://czeresniekoscian.pl','oai-authenticated-user-id':'forged'},body:'test'});
await worker.fetch(request,env);
assert.equal(forwarded.url,request.url);assert.equal(forwarded.headers.get('Cookie'),'__Host-sad_session=fixture');assert.equal(forwarded.headers.get('Origin'),'https://czeresniekoscian.pl');assert.equal(forwarded.headers.get('oai-authenticated-user-id'),null);assert.equal(await forwarded.text(),'test');
const www=await worker.fetch(new Request('https://www.czeresniekoscian.pl/praca.html?x=1'),env);assert.equal(www.status,308);assert.equal(www.headers.get('Location'),'https://czeresniekoscian.pl/praca.html?x=1');
const closedEnv={...env,SAD:{fetch:async r=>new URL(r.url).pathname==='/api/public/offer'?Response.json({siteEnabled:false,season:2026}):new Response('private panel')}};
for(const path of ['/','/praca','/praca.html']){
  const closed=await worker.fetch(new Request('https://czeresniekoscian.pl'+path),closedEnv);const html=await closed.text();assert.ok(html.includes('Sezon 2026 zakończony'));assert.ok(html.includes('Zapraszamy w przyszłym roku!'));assert.ok(!html.includes('orderForm'));assert.equal(closed.headers.get('Cache-Control'),'no-store');
}
assert.equal(await (await worker.fetch(new Request('https://czeresniekoscian.pl/panel'),closedEnv)).text(),'private panel');
assert.equal(await (await worker.fetch(new Request('https://czeresniekoscian.pl/',{method:'HEAD'}),closedEnv)).text(),'');
console.log('PASS: public assets, private panel/API forwarding, same-origin cookies, identity header stripping, canonical hostname.');
