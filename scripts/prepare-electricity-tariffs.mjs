import {writeFile} from 'node:fs/promises';
import {createTariffProvider} from '../src/electricity-tariffs.js';
// A verified fallback is encrypted inside the app. Public browser APIs may be
// unavailable due to CORS, rate limits or temporary outages; never fake rates.
const provider=createTariffProvider({fetchImpl:(url,options)=>fetch(url,{...options,headers:{Accept:'application/json','User-Agent':'Engstien25/tariff-publisher (github.com/emilaet/Engstien25)'}})});
const data=await provider.load({gridCompany:'dinel',force:true});
if(data.status!=='live')throw Error('Could not prepare the electricity tariff fallback: '+data.error);
await writeFile(process.argv[2]||'.electricity-tariffs.json',JSON.stringify({version:1,grid:data.grid,updatedAt:data.updatedAt,records:data.records}));
console.log('Verified Dinel tariffs and electricity taxes prepared for encrypted publication.');
