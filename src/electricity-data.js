import {safeStorage} from './storage.js';
import {copenhagenDay,addDays} from './family-data.js';
const ttl=30*60000;
export const electricityPriceUrl=(day,area='DK1')=>`https://www.elprisenligenu.dk/api/v1/prices/${day.slice(0,4)}/${day.slice(5)}_${area==='DK2'?'DK2':'DK1'}.json`;
export function normalizeElectricityPrices(records){
 if(!Array.isArray(records)||records.length>200)throw Error('Elpristjenesten returnerede ugyldige data.');
 const sorted=records.map(r=>({at:Date.parse(r.time_start),end:Date.parse(r.time_end),price:r.DKK_per_kWh})).sort((a,b)=>a.at-b.at);
 if(!sorted.length||sorted.some((r,i)=>!Number.isFinite(r.at)||!Number.isFinite(r.end)||typeof r.price!=='number'||!Number.isFinite(r.price)||r.price< -100||r.price>100||r.end-r.at<60000||r.end-r.at>3600000||i>0&&r.at<sorted[i-1].end))throw Error('Elpristjenesten returnerede ugyldige prisperioder.');
 const hours=new Map();for(const r of sorted){let at=r.at;while(at<r.end){const start=Math.floor(at/3600000)*3600000,end=Math.min(r.end,start+3600000),weight=end-at,h=hours.get(start)||{at:start,sum:0,duration:0};h.sum+=r.price*weight;h.duration+=weight;hours.set(start,h);at=end;}}
 // A partial hour must not be presented as the price of a complete hour.
 return [...hours.values()].filter(h=>h.duration===3600000).map(h=>({at:new Date(h.at).toISOString(),end:new Date(h.at+3600000).toISOString(),price:h.sum/h.duration}));
}
export function electricityBand(price,prices){const values=prices.filter(Number.isFinite).sort((a,b)=>a-b);if(!values.length||values[0]===values.at(-1))return 'medium';const low=values[Math.floor((values.length-1)/3)],high=values[Math.ceil((values.length-1)*2/3)];return price<=low?'low':price>=high?'high':'medium';}
export function createElectricityProvider({storage,fetchImpl=fetch,now=()=>new Date(),onChange=()=>{}}={}){
 const disk=safeStorage(storage);let area='DK1',data=null,error='',busy=false,pending=null,fromCache=false,lastAttempt=null;
 const key=()=>`engstien-electricity-v1:${area}`;
 function restore(){try{const c=JSON.parse(disk.getItem(key()));if(c?.day===copenhagenDay(now())&&Number.isFinite(Date.parse(c.updatedAt))&&Date.parse(c.updatedAt)<=now().getTime()&&Array.isArray(c.hours)&&c.hours.length&&c.hours.every(h=>Number.isFinite(Date.parse(h.at))&&Date.parse(h.end)-Date.parse(h.at)===3600000&&Number.isFinite(h.price))){data=c;fromCache=true;}}catch{}}
 function snapshot(){const day=copenhagenDay(now()),valid=data?.day===day,hours=valid?data.hours:[];return {area,day,hours,status:hours.length?(error||fromCache?'cached':'live'):busy?'loading':'unavailable',updatedAt:valid?data.updatedAt:null,error,current:hours.find(h=>Date.parse(h.at)<=now().getTime()&&Date.parse(h.end)>now().getTime())||null};}
 return {snapshot,async load({force=false,priceArea=area}={}){
  if(pending){await pending;return priceArea!==area?this.load({force,priceArea}):snapshot();}
  if(priceArea!==area){area=priceArea==='DK2'?'DK2':'DK1';data=null;error='';restore();}else if(!data)restore();
  const day=copenhagenDay(now());if(!force&&error&&lastAttempt?.area===area&&lastAttempt.day===day&&now().getTime()-lastAttempt.at<60000)return snapshot();if(!force&&data?.day===day&&now().getTime()-Date.parse(data.updatedAt)<ttl)return snapshot();
  const requestArea=area;lastAttempt={area,day,at:now().getTime()};busy=true;onChange();pending=(async()=>{try{
   const fetchDay=async day=>{const response=await fetchImpl(electricityPriceUrl(day,requestArea),{signal:AbortSignal.timeout(12000),credentials:'omit'});if(!response.ok)throw Error('Elpriser kunne ikke hentes.');return normalizeElectricityPrices(await response.json());};
   const [today,tomorrow]=await Promise.allSettled([fetchDay(day),fetchDay(addDays(day,1))]);if(today.status!=='fulfilled'||!today.value.length)throw Error('Dagens elpriser er ikke tilgængelige.');
   fromCache=false;data={day,area:requestArea,updatedAt:now().toISOString(),hours:[...today.value,...(tomorrow.status==='fulfilled'?tomorrow.value:[])]};error='';disk.setItem(key(),JSON.stringify(data));
  }catch{error='Forbindelsen til elpriser mangler. Prøv igen.';}finally{busy=false;pending=null;onChange();}})();await pending;return snapshot();
 }};
}
