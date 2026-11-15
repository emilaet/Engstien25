import {houseLightStatus,roomLightStatus,rooms} from './house.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const extraDevices=(catalog,room)=>catalog.devices.filter(d=>!d.anchor&&!d.retired&&d.bindings.primary&&(!room||d.room===room));
export function extraRoomLightStatus(state,devices,getDevice){
 const base=roomLightStatus(state),lights=devices.filter(d=>d.type==='light');
 const unknown=lights.filter(d=>{const p=getDevice(d.id);return !p?.entity||['unknown','unavailable'].includes(p.entity.state)||p.locked&&!p.pending;}).length;
 const on=base.on+lights.filter(d=>getDevice(d.id)?.entity?.state==='on').length,total=base.total+lights.length;
 return {on,total,unknown,mode:unknown?'unknown':on===0?'off':on===total?'on':'partial'};
}
export function extendedHouseLightStatus(state,catalog,connection){
 const base=houseLightStatus(state),lights=extraDevices(catalog).filter(d=>d.type==='light'),on=lights.filter(d=>connection.entities?.find(e=>e.id===d.bindings.primary)?.state==='on');
 const lit=new Set(rooms.filter(r=>Object.values(state[r.id]?.lights||{}).some(Boolean)).map(r=>r.id));for(const d of on)if(rooms.some(r=>r.id===d.room))lit.add(d.room);
 return {...base,on:base.on+on.length,total:base.total+lights.length,litRooms:lit.size};
}
export function extraDeviceCards(devices,getDevice,roomName){
 return devices.map(d=>{
  const p=getDevice(d.id),e=p?.entity,locked=!p||p.locked,id=esc(d.id),label=esc(d.name+' i '+roomName),reason=p?.reason||(!e?'Afventer enhed':'Home Assistant');
  const disabled=locked?'disabled':'',live=e&&!['unknown','unavailable'].includes(e.state),on=e?.state==='on';
  const range=(action,value,min,max,step,caption)=>`<label class="ru-range">${caption}<output>${value}${action==='temperature'?' °C':' %'}</output><input type="range" data-extra-id="${id}" data-extra-range="${action}" data-ru-focus="extra-${id}-${action}" aria-label="${caption} for ${label}" min="${min}" max="${max}" step="${step}" value="${value}" ${disabled}></label>`;
  const button=(action,title,enabled=true)=>`<button type="button" data-extra-id="${id}" data-extra-action="${action}" data-ru-focus="extra-${id}-${action}" ${locked||!enabled?'disabled':''}>${title}</button>`;
  let controls='',status=live?esc(e.state+(e.unit?' '+e.unit:'')):'—';
  if(['light','switch','charger'].includes(d.type)){
   status=live?(on?'Tændt':'Slukket'):'Tilstand mangler';
   controls=`<button type="button" class="ru-switch" role="switch" aria-label="${label}" aria-checked="${on}" data-extra-id="${id}" data-extra-action="${on?'off':'on'}" data-ru-focus="extra-${id}-switch" ${disabled}><i></i></button>`;
  }
  let detail='';
  if(d.type==='light'&&p?.brightness&&Number.isFinite(e?.brightness))detail=range('brightness',Math.round(e.brightness/255*100),0,100,1,'Lysstyrke');
  if(d.type==='climate'){
   status=Number.isFinite(e?.current)?e.current.toLocaleString('da-DK')+' °C målt':'Måling mangler';
   if(Number.isFinite(e?.target)&&(e.features&1||Number.isFinite(e.target)))detail=range('temperature',e.target,e.min,e.max,e.step,'Ønsket temperatur');
  }
  if(d.type==='cover'){
   status=Number.isFinite(e?.position)?e.position+' % åbent':status;
   detail=`<div class="ru-extra-actions">${button('close','Luk',p?.close)}${button('stop','Stop',p?.stop)}${button('open','Åbn',p?.open)}</div>`;
   if(p?.position&&Number.isFinite(e?.position))detail+=range('position',e.position,0,100,1,'Åbning');
  }
  return `<section class="ru-device ru-extra-device ${on?'ru-on':''}" data-room-device="${id}"><div class="ru-device-head"><div class="ru-copy"><h3>${esc(d.name)}</h3><p>${status}</p><small>${esc(reason)}</small></div>${controls}</div>${detail}</section>`;
 }).join('');
}
export function bindExtraDeviceControls(host,onCommand){
 for(const button of host.querySelectorAll('[data-extra-action]'))button.onclick=()=>onCommand(button.dataset.extraId,button.dataset.extraAction);
 for(const range of host.querySelectorAll('[data-extra-range]')){range.oninput=()=>{range.closest('label').querySelector('output').textContent=range.value+(range.dataset.extraRange==='temperature'?' °C':' %');};range.onchange=()=>onCommand(range.dataset.extraId,range.dataset.extraRange,Number(range.value));}
}
