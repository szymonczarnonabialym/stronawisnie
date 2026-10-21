// The public site and orchard remain separate repositories and deployments.
// A Service Binding keeps the same hostname and cookies for the private panel.
import {seasonPage} from './season-page.mjs';
export function isOrchardPath(path){
  return path==='/panel'||path.startsWith('/panel/')||path.startsWith('/api/')||path.startsWith('/assets/')||path.startsWith('/_next/')||['/login','/signin-with-chatgpt','/signout-with-chatgpt','/callback','/sw.js','/manifest.webmanifest','/icon-192.png','/icon-512.png','/favicon.svg'].includes(path);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname==='www.czeresniekoscian.pl'||(url.protocol==='http:'&&url.hostname==='czeresniekoscian.pl')){url.hostname='czeresniekoscian.pl';url.protocol='https:';return Response.redirect(url.toString(),308)}
    if(isOrchardPath(url.pathname)){
      if(!env.SAD)return new Response('Panel jest chwilowo niedostępny.',{status:503,headers:{'Cache-Control':'no-store'}});
      const headers=new Headers(request.headers);
      for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-user-'))headers.delete(name);
      return env.SAD.fetch(new Request(request,{headers}));
    }
    if(env.SAD&&['GET','HEAD'].includes(request.method)&&(!/\.[a-z0-9]+$/i.test(url.pathname)||url.pathname.endsWith('.html'))){
      // Unknown addresses stay real 404s (and asset redirects pass through) even while the season screen is on.
      const asset=await env.ASSETS.fetch(request);
      if(asset.status===404||(asset.status>=300&&asset.status<400))return asset;
      try{
        const offer=await env.SAD.fetch(new Request(new URL('/api/public/offer',url),{headers:{Accept:'application/json'}}));
        if(offer.ok){const data=await offer.json();if(data.siteEnabled===false){const response=seasonPage(data.season);return request.method==='HEAD'?new Response(null,{headers:response.headers}):response}}
      }catch{/* API failure leaves the public page with phone ordering and a disabled form. */}
      return asset;
    }
    return env.ASSETS.fetch(request);
  },
};
