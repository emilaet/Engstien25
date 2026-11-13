import {retryAfterMillis} from './retry-after.js';
import {safeStorage} from './storage.js';
import {copenhagenDay} from './family-data.js';
// DataHub D03 consumption tariffs, C / low voltage. Prices are DKK/kWh excl. VAT.
// Charge identifiers are documented in docs/widget-design.md.
export const gridCompanies={
 dinel:{name:'Dinel',gln:'5790000610099',codes:['TCL>100_02']},
 konstant:{name:'Konstant',gln:'5790000704842',codes:['C_FBTNTR_B','C_FBTNTR_R']},
 n1:{name:'N1',gln:'5790001089030',codes:['CD']},
 radius:{name:'Radius',gln:'5790000705689',codes:['DT_C_01']},
 cerius:{name:'Cerius',gln:'5790000705184',codes:['30TR_C_ET','30RE_C_ET']}
};
const systemNotes=['Elafgift','Systemtarif','Transmissions nettarif'];
const localHour=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Copenhagen',hour:'2-digit',hourCycle:'h23'});
export function tariffUrls(grid='dinel'){
 const company=gridCompanies[grid];if(!company)throw Error('Vælg netselskab.');
 const columns=['ValidFrom','ValidTo','GLN_Number','ChargeTypeCode','Note',...Array.from({length:24},(_,i)=>'Price'+(i+1))].join(',');
 const url=filter=>'https://api.energidataservice.dk/dataset/DatahubPricelist?'+new URLSearchParams({filter:JSON.stringify(filter),sort:'ValidFrom desc',limit:'500',columns});
 return [url({GLN_Number:[company.gln],ChargeTypeCode:company.codes,ChargeType:['D03']}),url({Note:systemNotes})];
}
export function normalizeTariffs(records){
 if(!Array.isArray(records)||records.length>1000)throw Error('Ugyldige tarifdata.');
 return records.map(r=>{
  const from=String(r.ValidFrom||'').slice(0,10),to=r.ValidTo?String(r.ValidTo).slice(0,10):null;
  const prices=Array.from({length:24},(_,i)=>{const value=r['Price'+(i+1)]??r.Price1;return typeof value==='string'&&/^-?\d+(?:\.\d+)?$/.test(value)?Number(value):value;});
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||to&&!/^\d{4}-\d{2}-\d{2}$/.test(to)||to&&to<=from||prices.some(p=>typeof p!=='number'||!Number.isFinite(p)||p< -100||p>100))throw Error('Ugyldige tarifsatser.');
  return {from,to,prices,note:String(r.Note||''),gln:String(r.GLN_Number||''),code:String(r.ChargeTypeCode||'')};
 });
}
// DataHub also returns cancelled revisions and historical rows with no price.
// They must not invalidate a different, currently effective tariff.
export function applicableTariffRecords(records,day){
 if(!Array.isArray(records)||records.length>1000)throw Error('Tarifkilden returnerede et ugyldigt svar.');
 const tomorrow=new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10);
 return records.filter(r=>{const from=String(r.ValidFrom||'').slice(0,10),to=r.ValidTo?String(r.ValidTo).slice(0,10):null;return (!to||to>day)&&from<=tomorrow&&(!to||to>from);});
}
function rate(records,day,hour,predicate){
 const candidates=records.filter(r=>r.from<=day&&(!r.to||day<r.to)&&predicate(r)).sort((a,b)=>b.from.localeCompare(a.from));
 if(!candidates.length)return null;
 const latest=candidates[0],duplicates=candidates.filter(r=>r.from===latest.from);
 // Different versions of one charge must never be added together.
 return duplicates.every(r=>r.prices[hour]===latest.prices[hour])?latest.prices[hour]:null;
}
export function totalElectricityPrice(period,tariffs,options={}){
 if(!period||!Number.isFinite(period.price))return null;
 const company=gridCompanies[options.grid||'dinel'];if(!company)return null;
 const day=copenhagenDay(new Date(period.at)),hour=Number(localHour.format(new Date(period.at))),rows=tariffs?.records||[];
 const charges=company.codes.map(code=>rate(rows,day,hour,r=>r.gln===company.gln&&r.code===code));
 const system=systemNotes.map(note=>rate(rows,day,hour,r=>r.note===note));
 if(charges.some(v=>v===null)||system.some(v=>v===null))return null;
 const markup=Number(options.supplierMarkup??0);if(!Number.isFinite(markup)||markup<0||markup>200)return null;
 const breakdown={spot:period.price,grid:charges.reduce((a,b)=>a+b,0),tax:system[0],system:system[1],transmission:system[2],supplier:markup/100/1.25};
 const subtotal=Object.values(breakdown).reduce((a,b)=>a+b,0),vat=options.vat===false?0:subtotal*.25;
 return {...breakdown,subtotal,vat,total:subtotal+vat};
}
export function createTariffProvider({storage,fetchImpl=fetch,now=()=>new Date(),onChange=()=>{},bundledSnapshot=import.meta.env?.VITE_TARIFF_SNAPSHOT}={}){
 const disk=safeStorage(storage);let grid='dinel',data=null,error='',busy=false,pending=null,cached=false,bundled=false,lastAttempt=0;let retryAt=Number(disk.getItem('engstien-tariff-retry-at-v1'))||0;if(!Number.isFinite(retryAt))retryAt=0;if(retryAt>now().getTime())error='Tarifkilden begrænser forespørgsler (HTTP 429). Prøv igen om '+Math.ceil((retryAt-now().getTime())/60000)+' min.';
 const key=()=>`engstien-tariffs-v1:${grid}`;
 const snapshot=()=>({grid,records:bundled&&now().getTime()-Date.parse(data.updatedAt)>7*86400000?[]:data?.records||[],updatedAt:data?.updatedAt||null,status:data?(cached||error?'cached':'live'):busy?'loading':'unavailable',error,retryAt});
 function restoreBundled(){try{
  const c=typeof bundledSnapshot==='string'?JSON.parse(bundledSnapshot):bundledSnapshot,age=now().getTime()-Date.parse(c?.updatedAt);
  if(c?.version!==1||c.grid!==grid||!Number.isFinite(age)||age<0||age>7*86400000)return;
  const records=normalizeTariffs(c.records.map(r=>({ValidFrom:r.from,ValidTo:r.to,Note:r.note,GLN_Number:r.gln,ChargeTypeCode:r.code,...Object.fromEntries(r.prices.map((p,i)=>['Price'+(i+1),p]))})));
  if(!totalElectricityPrice({at:now().toISOString(),price:0},{records},{grid}))return;
  data={grid,records,updatedAt:c.updatedAt};cached=true;bundled=true;
 }catch{}}
 function restore(){try{const c=JSON.parse(disk.getItem(key()));if(c?.grid!==grid||!Array.isArray(c.records)||!Number.isFinite(Date.parse(c.updatedAt))||Date.parse(c.updatedAt)>now().getTime()||now().getTime()-Date.parse(c.updatedAt)>2*86400000)return;
  // Revalidate persisted data with exactly the same rules as a network response.
  const records=normalizeTariffs(c.records.map(r=>({ValidFrom:r.from,ValidTo:r.to,Note:r.note,GLN_Number:r.gln,ChargeTypeCode:r.code,...Object.fromEntries(r.prices.map((p,i)=>['Price'+(i+1),p]))})));
  data={...c,records};cached=true;
 }catch{}}
 return {snapshot,async load({gridCompany=grid,force=false}={}){
  if(pending){await pending;return gridCompany!==grid?this.load({gridCompany,force}):snapshot();}
  if(gridCompany!==grid){grid=gridCompanies[gridCompany]?gridCompany:'dinel';data=null;error='';bundled=false;lastAttempt=0;restore();}else if(!data)restore();if(!data)restoreBundled();
  if(now().getTime()<retryAt)return snapshot();
  if(!force&&(error&&now().getTime()-lastAttempt<60000||data&&now().getTime()-Date.parse(data.updatedAt)<12*3600000))return snapshot();
  lastAttempt=now().getTime();busy=true;onChange();pending=(async()=>{try{
   const sets=await Promise.all(tariffUrls(grid).map(async url=>{const response=await fetchImpl(url,{signal:AbortSignal.timeout(12000),credentials:'omit'});if(response.status===429){retryAt=now().getTime()+Math.max(60000,retryAfterMillis(response.headers?.get?.('retry-after'),now().getTime()));disk.setItem('engstien-tariff-retry-at-v1',String(retryAt));throw Error('Tarifkilden begrænser forespørgsler (HTTP 429). Prøv igen om '+Math.ceil((retryAt-now().getTime())/60000)+' min.');}if(!response.ok)throw Error('Tarifkilden svarer med HTTP '+response.status+'.');const body=await response.json();return normalizeTariffs(applicableTariffRecords(body.records,copenhagenDay(now())));}));
   const records=sets.flat();if(!totalElectricityPrice({at:now().toISOString(),price:0},{records},{grid})){const day=copenhagenDay(now()),hour=Number(localHour.format(now())),company=gridCompanies[grid],missing=[...company.codes.filter(code=>rate(records,day,hour,r=>r.gln===company.gln&&r.code===code)===null).map(code=>company.name+' '+code),...systemNotes.filter(note=>rate(records,day,hour,r=>r.note===note)===null)];throw Error('Manglende eller modstridende tariffer: '+missing.join(', ')+'.');}
   data={grid,records,updatedAt:now().toISOString()};error='';cached=false;bundled=false;retryAt=0;disk.setItem('engstien-tariff-retry-at-v1','0');disk.setItem(key(),JSON.stringify(data));
  }catch(reason){error=reason?.name==='TimeoutError'?'Tarifkilden tog for lang tid om at svare.':reason instanceof TypeError?'Forbindelsen til tarifkilden kunne ikke oprettes.':reason.message||'Nettarif og afgifter kunne ikke hentes.';}finally{busy=false;pending=null;onChange();}})();await pending;return snapshot();
 }};
}
