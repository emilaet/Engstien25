import {rooms,initialState} from './house.js';
import {lightName} from './lighting-data.js';
import {safeStorage} from './storage.js';
export const deviceCatalogKey='engstien-devices-v1';
export const deviceRooms=[...rooms.map(({id,name})=>({id,name})),{id:'carport',name:'Carport og bil'},{id:'outside',name:'Udeområder'}];
export const deviceTypes={light:'Lys',climate:'Gulvvarme',cover:'Gardiner',sensor:'Sensorer',switch:'Kontakter',charger:'Ladeboks',vehicle:'Bil',camera:'Kamera',media_player:'Lyd',vacuum:'Robotstøvsuger'};
export const bindingSlots={light:{primary:'Lampe'},climate:{primary:'Varmezone'},cover:{primary:'Gardin'},sensor:{primary:'Sensor'},switch:{primary:'Kontakt'},camera:{primary:'Kamera'},media_player:{primary:'Afspiller'},vacuum:{primary:'Robotstøvsuger'},charger:{primary:'Start/stop-kontakt',status:'Ladestatus',power:'Ladeeffekt',energy:'Sessionsenergi'},vehicle:{primary:'Batteriprocent',status:'Bilens ladestatus',target:'Lademål',remaining:'Resterende ladetid'}};
export function defaultDevices(){
 const base=initialState(),items=[];
 for(const room of rooms){
  for(const key of Object.keys(base[room.id].lights))items.push({id:room.id+':'+key,room:room.id,name:lightName(room.id,key),type:'light',anchor:{room:room.id,group:'lights',key},bindings:{}});
  items.push({id:room.id+':heat',room:room.id,name:'Gulvvarme',type:'climate',anchor:{room:room.id,group:'heat'},bindings:{}});
  (room.curtains||[]).forEach((name,i)=>items.push({id:room.id+':curtain:'+i,room:room.id,name,type:'cover',anchor:{room:room.id,group:'curtains',key:String(i)},bindings:{}}));
 }
 items.push({id:'carport:charger',room:'carport',name:'OK ladeboks',type:'charger',bindings:{}},{id:'carport:vehicle',room:'carport',name:'Tesla',type:'vehicle',bindings:{}},{id:'entre:camera',room:'entre',name:'Hoveddørskamera',type:'camera',bindings:{}});
 return {version:1,revision:0,devices:items};
}
const domains={light:['light','switch','input_boolean'],climate:['climate'],cover:['cover'],sensor:['sensor','binary_sensor'],switch:['switch','input_boolean'],camera:['camera'],media_player:['media_player'],vacuum:['vacuum']};
export function compatibleEntity(device,slot,entity){
 const domain=entity.id.split('.')[0],unit=entity.unit||'',kind=entity.deviceClass||'';
 if(device.type==='charger')return slot==='primary'?['switch','input_boolean'].includes(domain):slot==='power'?domain==='sensor'&&['W','kW'].includes(unit):slot==='energy'?domain==='sensor'&&['Wh','kWh'].includes(unit):['sensor','binary_sensor'].includes(domain);
 if(device.type==='vehicle')return slot==='primary'?domain==='sensor'&&(unit==='%'||kind==='battery'):slot==='target'?['sensor','number'].includes(domain)&&unit==='%':slot==='remaining'?domain==='sensor'&&['min','minutes','h','hr'].includes(unit):['sensor','binary_sensor'].includes(domain);
 return slot==='primary'&&(domains[device.type]||[]).includes(domain);
}
export function normalizeDeviceCatalog(value){
 if(!value||value.version!==1||!Array.isArray(value.devices)||value.devices.length>500)throw Error('Filen indeholder ikke et gyldigt enhedskatalog.');
 const seed=new Map(defaultDevices().devices.map(d=>[d.id,d])),ids=new Set(),primaries=new Set();
 const devices=value.devices.map(d=>{
  if(!d||typeof d.id!=='string'||!/^[a-zA-Z0-9:_-]{1,100}$/.test(d.id)||ids.has(d.id)||!Object.hasOwn(deviceTypes,d.type)||!deviceRooms.some(r=>r.id===d.room)||typeof d.name!=='string'||!d.name.trim()||d.name.length>100)throw Error('En enhed har ugyldigt navn, rum, type eller ID.');ids.add(d.id);
  const original=seed.get(d.id);if(original&&original.type!==d.type)throw Error('En modelenheds type kan ikke ændres.');
  const bindings={};for(const [slot,id]of Object.entries(d.bindings||{})){
   if(!Object.hasOwn(bindingSlots[d.type],slot)||typeof id!=='string'||!/^[a-z_]+\.[a-z0-9_]+$/.test(id))throw Error('En Home Assistant-kobling er ugyldig.');
   if(!compatibleEntity(d,slot,{id,unit:slot==='remaining'?'min':d.type==='vehicle'?'%':slot==='power'?'W':slot==='energy'?'kWh':''}))throw Error('Koblingen passer ikke til enhedstypen.');
   if(slot==='primary'&&!d.retired){if(primaries.has(id))throw Error('Samme Home Assistant-enhed er allerede koblet til en anden enhed i huset.');primaries.add(id);}bindings[slot]=id;
  }
  return {id:d.id,name:d.name.trim(),room:d.room,type:d.type,bindings,...(original?.anchor?{anchor:original.anchor}:{}),...(d.retired===true?{retired:true}:{})};
 });
 // New model revisions may add devices; keep existing choices intact.
 for(const [id,device]of seed)if(!ids.has(id))devices.push(device);
 return {version:1,revision:Number.isSafeInteger(value.revision)&&value.revision>=0?value.revision:0,devices};
}
export function deviceStatus(device,connection){
 if(device.retired)return {key:'retired',label:'Udgået'};
 const ids=Object.values(device.bindings);if(!ids.length)return {key:'planned',label:'Planlagt'};
 if(!connection?.configured)return {key:'pending',label:'Afventer Home Assistant'};
 if(!connection.online)return {key:'offline',label:'Forbindelse afbrudt'};
 const entities=connection.entities||[];
 if(ids.some(id=>!entities.some(e=>e.id===id)))return {key:'missing',label:'Enhed mangler'};
 if(ids.some(id=>['unavailable','unknown'].includes(entities.find(e=>e.id===id)?.state)))return {key:'offline',label:'Enhed utilgængelig'};
 if(!device.bindings.primary)return {key:'partial',label:'Delvist koblet'};
 return {key:'connected',label:'Tilsluttet'};
}
export function createDeviceCatalog(storage){
 const disk=safeStorage(storage);let current=defaultDevices();try{const value=disk.getItem(deviceCatalogKey);if(value)current=normalizeDeviceCatalog(JSON.parse(value));}catch{}
 function readLatest(){try{const value=disk.getItem(deviceCatalogKey);if(value)current=normalizeDeviceCatalog(JSON.parse(value));}catch{}return current;}
 return {get persistent(){return disk.persistent;},load:()=>structuredClone(readLatest()),save(value){const normalized=normalizeDeviceCatalog(value);readLatest();if(normalized.revision!==current.revision)throw Error('Opsætningen er ændret på en anden skærm. Hent den nyeste opsætning, før du gemmer.');normalized.revision=current.revision+1;current=normalized;disk.setItem(deviceCatalogKey,JSON.stringify(current));return structuredClone(current);},replace(value){current=normalizeDeviceCatalog(value);disk.setItem(deviceCatalogKey,JSON.stringify(current));return structuredClone(current);}};
}
export function suggestEntities(device,slot,entities){
 const room=deviceRooms.find(r=>r.id===device.room)?.name||'',tokens=(room+' '+device.name).toLocaleLowerCase('da').split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>2);
 return entities.filter(e=>compatibleEntity(device,slot,e)).map(entity=>({entity,score:tokens.reduce((n,t)=>n+((entity.name+' '+entity.id+' '+(entity.area||'')).toLocaleLowerCase('da').includes(t)?1:0),0)})).sort((a,b)=>b.score-a.score||a.entity.name.localeCompare(b.entity.name,'da')).map(x=>x.entity);
}
