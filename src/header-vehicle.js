import {phoneMedia} from './mobile-app.js';
import {chargeStates,chargeTiming} from './vehicle-data.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createHeaderVehicle({getVehicle,onOpen,weatherButton}={}){
 const group=document.createElement('div');group.className='header-live-widgets';weatherButton.before(group);group.append(weatherButton);
 const button=document.createElement('button');button.type='button';button.className='header-tesla';button.onclick=()=>onOpen();group.append(button);
 const phone=matchMedia(phoneMedia),place=()=>{if(phone.matches)document.querySelector('main>header').append(group);else document.querySelector('.header-right .date').before(group);};phone.addEventListener('change',place);place();
 function refresh(){const car=getVehicle(),charging=['charging','away'].includes(car.status),timing=chargeTiming(car),status=car.quality==='cached'?'Sidst kendte data':charging?(car.status==='away'?'Lader ude':'Lader nu'):'Lader ikke · '+(chargeStates[car.status]||'Ukendt status'),source=car.quality==='demo'?'Eksempel':car.quality==='cached'?'Sidst kendte':'Home Assistant';
  const battery=Number.isFinite(car.battery)?car.battery.toLocaleString('da-DK',{maximumFractionDigits:0})+' %':'—',target=charging&&Number.isFinite(car.target)?' · til '+car.target+' %':'';
  button.dataset.state=car.status;button.dataset.quality=car.quality;button.setAttribute('aria-label',`Tesla ${battery}. ${status}${target}.${timing?' Ca. '+timing.duration+' tilbage, færdig '+timing.prefix+timing.clock+'.':''} ${source}. Åbn Billader.`);
  button.innerHTML=`<span class="header-tesla-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 2-9 12h7l-2 8 9-12h-7Z"/></svg></span><span class="header-tesla-main"><span>Tesla <strong>${battery}</strong></span><small>${esc(status+target)}</small></span><span class="header-tesla-eta">${timing?`<strong>${timing.duration}</strong><small>Ca. ${timing.prefix}${timing.clock}</small>`:''}<small class="header-tesla-source">${source}</small></span>`;
 }
 return {button,refresh};
}
