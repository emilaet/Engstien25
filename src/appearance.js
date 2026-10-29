import {safeStorage} from './storage.js';

export const appearanceKey='engstien-appearance-v1';
// Hørning. Solar time is calculated locally; no weather or location permissions.
export const homeLocation={latitude:56.087,longitude:10.037,name:'Hørning'};
export function solarAltitude(date,location=homeLocation){
 const rad=Math.PI/180,days=date.getTime()/86400000-10957.5;
 const mean=(357.5291+.98560028*days)*rad;
 const longitude=(280.147+ .98564736*days+1.9148*Math.sin(mean)+.02*Math.sin(2*mean))*rad;
 const declination=Math.asin(Math.sin(longitude)*Math.sin(23.4397*rad));
 const rightAscension=Math.atan2(Math.sin(longitude)*Math.cos(23.4397*rad),Math.cos(longitude));
 const hourAngle=(280.16+360.9856235*days+location.longitude)*rad-rightAscension;
 const lat=location.latitude*rad;
 return Math.asin(Math.sin(lat)*Math.sin(declination)+Math.cos(lat)*Math.cos(declination)*Math.cos(hourAngle))/rad;
}
export function resolveAppearance(mode='auto',date=new Date(),location=homeLocation){
 const altitude=solarAltitude(date,location),daylight=mode==='day'?1:mode==='night'?0:Math.max(0,Math.min(1,(altitude+6)/12));
 return {mode,theme:(mode==='night'||(mode==='auto'&&altitude<-.833))?'dark':'light',daylight,altitude};
}
export function createAppearance({storage,now=()=>new Date(),onChange=()=>{}}={}){
 const disk=safeStorage(storage);let mode='auto';try{const saved=disk.getItem(appearanceKey);if(['auto','day','night'].includes(saved))mode=saved;}catch{}
 const control=document.createElement('label');control.className='appearance-control';control.innerHTML='<span aria-hidden="true" class="appearance-symbol"></span><select aria-label="Dag- og aftenvisning"><option value="auto">Automatisk · Hørning</option><option value="day">Dag</option><option value="night">Aften</option></select>';control.title='Auto følger solens højde i Hørning. Lyset i huset styres altid separat.';
 document.querySelector('.header-right').append(control);const select=control.querySelector('select');select.value=mode;
 function refresh(){const value=resolveAppearance(mode,now());document.documentElement.dataset.theme=value.theme;document.documentElement.style.colorScheme=value.theme==='dark'?'dark':'light';control.querySelector('.appearance-symbol').innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">'+(value.theme==='dark'?'<path d="M20.7 13.5A9 9 0 0 1 10.5 3.3 9 9 0 1 0 20.7 13.5Z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>')+'</svg>';select.querySelector('[value=auto]').textContent=(value.theme==='dark'?'Aften':'Dag')+' · Auto';onChange(value);return value;}
 select.onchange=()=>{mode=select.value;disk.setItem(appearanceKey,mode);refresh();};
 window.addEventListener('storage',e=>{if(e.key===appearanceKey){mode=['auto','day','night'].includes(e.newValue)?e.newValue:'auto';select.value=mode;refresh();}});
 return {refresh,get value(){return resolveAppearance(mode,now());}};
}
