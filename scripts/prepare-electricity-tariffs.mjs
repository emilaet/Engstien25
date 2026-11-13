import {readFile,writeFile,rm} from 'node:fs/promises';
import {createTariffProvider,normalizeTariffs,totalElectricityPrice} from '../src/electricity-tariffs.js';
import {createPoliteTariffFetch} from './tariff-http.mjs';
const file=process.argv[2]||'.electricity-tariffs.json';let saved=null;
try{
 const snapshot=JSON.parse(await readFile(file,'utf8')),age=Date.now()-Date.parse(snapshot.updatedAt);
 if(snapshot.version===1&&snapshot.grid==='dinel'&&Number.isFinite(age)&&age>=0&&age<=7*86400000){
  snapshot.records=normalizeTariffs(snapshot.records.map(r=>({ValidFrom:r.from,ValidTo:r.to,GLN_Number:r.gln,ChargeTypeCode:r.code,Note:r.note,...Object.fromEntries(r.prices.map((p,i)=>['Price'+(i+1),p]))})));
  if(totalElectricityPrice({at:new Date().toISOString(),price:0},snapshot,{grid:'dinel'}))saved=snapshot;
 }
}catch{}
if(saved&&Date.now()-Date.parse(saved.updatedAt)<12*3600000){await writeFile(file,JSON.stringify(saved));console.log('Reusing recently verified Dinel tariffs; no new API requests.');process.exit(0);}
// A verified fallback is encrypted inside the app. Never substitute example rates.
if(!saved)await rm(file,{force:true});
const provider=createTariffProvider({fetchImpl:createPoliteTariffFetch()});
const data=await provider.load({gridCompany:'dinel',force:true});
if(data.status!=='live'){
 const message='Could not prepare the electricity tariff fallback: '+data.error;
 if(saved){await writeFile(file,JSON.stringify(saved));console.warn('::warning title=Electricity tariffs::Using a still-valid verified tariff copy because '+data.error);process.exit(0);}
 console.warn('::warning title=Electricity tariff source unavailable::'+message.replaceAll('%','%25').replaceAll('\n','%0A').replaceAll('\r','%0D')+' No unverified tariff rates are embedded; the app will report unavailable totals until the source responds.');process.exit(0);
}
await writeFile(file,JSON.stringify({version:1,grid:data.grid,updatedAt:data.updatedAt,records:data.records}));
console.log('Verified Dinel tariffs and electricity taxes prepared for encrypted publication.');
