// Re-render committed PNGs from the vector source: node scripts/render-app-icons.mjs
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage(),source=await readFile(new URL('../src/assets/app-icon.svg',import.meta.url),'utf8');
 for(const [size,name]of [[180,'apple-touch-icon.png'],[192,'app-icon-192.png'],[512,'app-icon-512.png']]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent('<style>html,body{padding:0;margin:0;width:100%;height:100%;overflow:hidden}svg{width:100%;height:100%}</style>'+source);
  await page.screenshot({path:fileURLToPath(new URL('../public/'+name,import.meta.url))});
 }
}finally{await browser.close();}
