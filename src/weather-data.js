import {safeStorage} from './storage.js';
import {copenhagenDay,addDays} from './family-data.js';
import {homeLocation} from './appearance.js';
export const weatherCacheKey='engstien-weather-cache-v1';
const freshMs=10*60*1000,maxCacheMs=24*60*60*1000;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function weatherMeaning(code,isDay=true){
 if(code===0)return {kind:isDay?'sun':'moon',condition:isDay?'Klart og solrigt':'Klar nat'};
 if([1,2].includes(code))return {kind:isDay?'partly':'moon',condition:'Let skyet'};
 if(code===3)return {kind:'cloud',condition:'Overskyet'};
 if([45,48].includes(code))return {kind:'cloud',condition:'Tåge'};
 if([51,53,55].includes(code))return {kind:'rain',condition:'Finregn'};
 if([56,57,66,67].includes(code))return {kind:'rain',condition:'Isslag'};
 if([61,63,65].includes(code))return {kind:'rain',condition:code===65?'Kraftig regn':'Regn'};
 if([71,73,75,77,85,86].includes(code))return {kind:'snow',condition:'Sne'};
 if([80,81,82].includes(code))return {kind:'rain',condition:'Byger'};
 if([95,96,99].includes(code))return {kind:'storm',condition:'Tordenvejr'};
 return {kind:'cloud',condition:'Skyet'};
}
const iso=seconds=>new Date(seconds*1000).toISOString();
const direction=degrees=>['N','NØ','Ø','SØ','S','SV','V','NV'][Math.round(degrees/45)%8];
export function normalizeWeather(raw,now=new Date()){
 const c=raw?.current,d=raw?.daily,h=raw?.hourly;
 if(!c||!finite(c.temperature_2m)||!finite(c.apparent_temperature)||!finite(c.time)||!finite(c.weather_code)||!d||!Array.isArray(d.time)||!h||!Array.isArray(h.time))throw Error('Vejrtjenesten returnerede ikke en gyldig prognose.');
 const today=copenhagenDay(now),last=addDays(today,4);
 const days=d.time.map((time,i)=>({day:finite(time)?copenhagenDay(new Date(time*1000)):'',...weatherMeaning(d.weather_code?.[i]),high:finite(d.temperature_2m_max?.[i])?Math.round(d.temperature_2m_max[i]):null,low:finite(d.temperature_2m_min?.[i])?Math.round(d.temperature_2m_min[i]):null,rain:finite(d.precipitation_probability_max?.[i])?d.precipitation_probability_max[i]:null})).filter(day=>day.day>=today&&day.day<=last&&finite(day.high)&&finite(day.low));
 const hours=h.time.map((time,i)=>({at:finite(time)?iso(time):'',...weatherMeaning(h.weather_code?.[i],h.is_day?.[i]!==0),temperature:finite(h.temperature_2m?.[i])?Math.round(h.temperature_2m[i]):null,rain:finite(h.precipitation_probability?.[i])?h.precipitation_probability[i]:null})).filter(hour=>hour.at&&Date.parse(hour.at)>now.getTime()&&finite(hour.temperature)).slice(0,6);
 if(!days.length)throw Error('Vejrtjenesten returnerede ingen kommende dage.');
 return {status:'live',source:'Open-Meteo',location:homeLocation.name,current:Math.round(c.temperature_2m),feels:Math.round(c.apparent_temperature),...weatherMeaning(c.weather_code,c.is_day!==0),wind:finite(c.wind_speed_10m)?Math.round(c.wind_speed_10m*10)/10:null,direction:finite(c.wind_direction_10m)?direction(c.wind_direction_10m):'—',days,hours,observedAt:iso(c.time),updatedAt:now.toISOString(),error:''};
}
export function weatherUrl(){const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:String(homeLocation.latitude),longitude:String(homeLocation.longitude),current:'temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m',hourly:'temperature_2m,precipitation_probability,weather_code,is_day',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',wind_speed_unit:'ms',timezone:'Europe/Copenhagen',timeformat:'unixtime',forecast_days:'5'}).toString();return url.href;}
const empty=(status,error='')=>({status,source:'Open-Meteo',location:homeLocation.name,current:null,feels:null,condition:status==='loading'?'Henter vejret …':'Vejret er ikke tilgængeligt',kind:'cloud',wind:null,direction:'—',days:[],hours:[],updatedAt:null,error});
export function createWeatherProvider({storage,fetchImpl=fetch,now=()=>new Date(),onChange=()=>{}}={}){
 const disk=safeStorage(storage);let current=empty('loading'),good=null,pending=null,lastAttempt=null;
 try{const saved=JSON.parse(disk.getItem(weatherCacheKey));if(saved?.version===1&&finite(saved.data?.current)&&Array.isArray(saved.data.days)&&Array.isArray(saved.data.hours)&&now().getTime()-Date.parse(saved.data.updatedAt)<maxCacheMs){good=saved.data;current={...good,status:'cached'};}}catch{}
 function snapshot(){const day=copenhagenDay(now());return {...structuredClone(current),days:current.days.filter(d=>d.day>=day),hours:current.hours.filter(h=>Date.parse(h.at)>now().getTime())};}
 return {snapshot,async load({force=false}={}){if(pending)return pending;if(!force&&good&&current.status==='live'&&now().getTime()-Date.parse(good.updatedAt)<freshMs){current={...good,status:'live'};return snapshot();}
  if(!force&&lastAttempt!==null&&now().getTime()-lastAttempt<60000)return snapshot();lastAttempt=now().getTime();
  pending=(async()=>{try{const response=await fetchImpl(weatherUrl(),{signal:AbortSignal.timeout(12000),credentials:'omit'});if(!response.ok)throw Error('Vejrtjenesten svarer ikke lige nu.');good=normalizeWeather(await response.json(),now());current=good;disk.setItem(weatherCacheKey,JSON.stringify({version:1,data:good}));}catch(error){const usable=good&&now().getTime()-Date.parse(good.updatedAt)<maxCacheMs;current=usable?{...good,status:'cached',error:'Forbindelsen mangler. Viser sidst hentede vejr.'}:empty('unavailable',error.name==='TimeoutError'?'Vejrtjenesten svarede ikke i tide.':error.message||'Vejret kunne ikke hentes.');}return snapshot();})().finally(()=>{pending=null;onChange();});return pending;
 }};
}
