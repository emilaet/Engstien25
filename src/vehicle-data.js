import {safeStorage} from './storage.js';
export const chargeStates={charging:'Lader nu',paused:'På pause',disconnected:'Ingen bil tilsluttet',waiting:'Venter på planlagt opladning',complete:'Lademål nået',sleeping:'Bilen sover',offline:'Forbindelse mangler',error:'Opladningsfejl',away:'Bilen lader ude'};
export function createDemoVehicle(storage){
 const disk=safeStorage(storage),initial={status:'charging',battery:54,target:80,power:11,capacity:75,kwh:12.4,price:2.15,updatedAt:new Date().toISOString(),source:'Demo · Tesla / ladeboks',quality:'demo'};
 let data=initial;try{const saved=JSON.parse(disk.getItem('engstien-vehicle-v1'));if(saved&&chargeStates[saved.status]&&Number.isFinite(saved.battery)&&Number.isFinite(saved.target))data={...initial,...saved};}catch{}
 return {get value(){return {...data,charging:['charging','away'].includes(data.status),homeCharging:data.status==='charging',persistence:disk.persistent?'device':'memory'};},set(patch){data={...data,...patch,updatedAt:patch.quality==='cached'?data.updatedAt:new Date().toISOString()};disk.setItem('engstien-vehicle-v1',JSON.stringify(data));return this.value;},scenario(status){if(!chargeStates[status])return this.value;const patch={status,quality:['offline','sleeping'].includes(status)?'cached':'demo',power:['charging','away'].includes(status)?11:0};if(status==='complete')patch.battery=data.target;else if(status==='charging'&&data.battery>=data.target)patch.battery=Math.max(0,data.target-20);return this.set(patch);}};
}
export function remainingCharge(data){
 if(['offline','error','disconnected','sleeping','waiting','away'].includes(data.status))return chargeStates[data.status];
 if(!Number.isFinite(data.battery)||!Number.isFinite(data.target))return 'Mangler data';
 if(data.battery>=data.target)return 'Mål nået';
 if(data.status!=='charging')return chargeStates[data.status]||'Ukendt';
 if(Number.isFinite(data.remainingMinutes)&&data.remainingMinutes>=0){const minutes=Math.ceil(data.remainingMinutes);return `${Math.floor(minutes/60)} t ${minutes%60} min`;}
 if(!(data.power>0)||!(data.capacity>0)||!Number.isFinite(data.battery))return 'Kan ikke beregnes';
 // A labelled fallback estimate. Prefer a vehicle-reported ETA with live data.
 const minutes=Math.ceil((data.target-data.battery)/100*data.capacity/(data.power*.9)*60);
 return `${Math.floor(minutes/60)} t ${minutes%60} min`;
}
