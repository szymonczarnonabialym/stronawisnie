import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('dist',{recursive:true});
for(const path of ['index.html','index.css','index.js','offer.js','praca.html','robots.txt','sitemap.xml'])await copyFile(path,'dist/'+path);
await cp('images','dist/images',{recursive:true});
console.log('Public site built in dist/. No repository metadata or credentials copied.');
