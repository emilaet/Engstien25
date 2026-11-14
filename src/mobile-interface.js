import {phoneMedia} from './mobile-app.js';
import {controlRooms} from './house.js';

// Mobile navigation shows the current task. Household-wide controls live in a
// sheet; the vehicle's detailed summary belongs on Home, with readable type.
export function createMobileInterface({getView,getRoom,getSummary,onAllLights}={}){
 const phone=matchMedia(phoneMedia),root=document.documentElement,more=document.querySelector('#home-options-menu'),appearance=document.querySelector('.appearance-control'),header=document.querySelector('main>header');
 const appearanceSlot=document.createElement('div');appearanceSlot.className='mobile-appearance-slot';more.append(appearanceSlot);
 const lightsAction=document.createElement('button');lightsAction.className='mobile-menu-action';lightsAction.textContent='Lys i hele huset';lightsAction.dataset.mobileLights='';more.append(lightsAction);
 const dialog=document.createElement('dialog');dialog.className='mobile-lights-sheet';dialog.setAttribute('aria-label','Lys i hele huset');dialog.innerHTML='<div class="mobile-sheet-heading"><div><p>INDE OG UDE</p><h2>Hele husets lys</h2></div><button type="button" data-mobile-close aria-label="Luk husets lysstyring">×</button></div><p class="mobile-sheet-description">Tænd eller sluk alle lamper med ét tryk.</p><div class="mobile-sheet-actions"><button type="button" data-mobile-all="on" aria-label="Tænd alt lys i huset">Tænd alt lys</button><button type="button" data-mobile-all="off" aria-label="Sluk alt lys i huset">Sluk alt lys</button></div><p class="mobile-sheet-source"></p>';document.body.append(dialog);
 let returnFocus=null,source='Eksempel',previousPage='',previousRoom=null;
 function close(focus=true){
  dialog.close();
  if(focus){
   // Updating all lamps replaces the overview. The More-menu action may also
   // remain connected while hidden, so restore to a visible control only.
   const target=returnFocus?.isConnected&&returnFocus.getClientRects().length?returnFocus:document.querySelector('.ru-mobile-overview [data-mobile-lights]')||document.querySelector('#home-options');
   target?.focus({preventScroll:true});
  }
 }
 function refresh(nextSource){
  if(nextSource)source=nextSource;const view=getView(),room=getRoom(),summary=getSummary(),mobile=phone.matches;
  root.dataset.mobileRoomSelected=String(mobile&&view==='rooms'&&!!room);
  const roomName=controlRooms.find(r=>r.id===room)?.name;
  if(!mobile&&view==='rooms')header.querySelector('h1').textContent='Rum';
  if(mobile&&view==='rooms'&&roomName){const title=header.querySelector('h1');title.textContent=roomName;title.tabIndex=-1;if(previousRoom!==room||previousPage!==view)title.focus({preventScroll:true});}
  if(dialog.open&&previousPage&&previousPage!==view)close(false);
  for(const node of document.querySelectorAll('[data-mobile-light-count]'))node.textContent=summary.on===0?'Alt lys er slukket':summary.litRooms?`Lys i ${summary.litRooms} rum`:'Kun udelys er tændt';
  const quality=source==='Eksempel'?'Eksempeldata':source;
  for(const node of document.querySelectorAll('[data-mobile-light-source],.mobile-sheet-source'))node.textContent=quality;
  dialog.querySelector('[data-mobile-all=on]').disabled=summary.on===summary.total;dialog.querySelector('[data-mobile-all=off]').disabled=summary.on===0;
  lightsAction.hidden=!mobile||view!=='rooms';
  previousPage=view;previousRoom=room;
 }
 function place(){
  if(phone.matches)appearanceSlot.append(appearance);else{document.querySelector('.home-layout-menu').before(appearance);if(dialog.open)close(false);}
  appearanceSlot.hidden=!phone.matches;refresh();
 }
 document.addEventListener('click',e=>{if(e.target.closest('[data-mobile-lights]')){returnFocus=e.target.closest('button');more.hidden=true;document.querySelector('#home-options').setAttribute('aria-expanded','false');refresh();dialog.showModal();dialog.querySelector('[data-mobile-close]').focus({preventScroll:true});}});
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-mobile-close]'))close();const action=e.target.closest('[data-mobile-all]');if(action&&!action.disabled){onAllLights(action.dataset.mobileAll==='on');close();}});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});window.addEventListener('popstate',()=>close(false));phone.addEventListener('change',place);place();
 return {refresh};
}
