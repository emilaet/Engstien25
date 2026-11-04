import {compatibleEntity,normalizeDeviceCatalog,deviceCatalogKey,defaultDevices} from '../src/device-catalog.js';

const supported=new Set(['light','climate','cover','sensor','number','binary_sensor','switch','input_boolean','camera','media_player','vacuum']);
export function normalizeHaEntity(raw,registry={}){
 if(!raw||typeof raw.entity_id!=='string'||!supported.has(raw.entity_id.split('.')[0]))return null;
 const a=raw.attributes||{},r=registry[raw.entity_id]||{};
 return {id:raw.entity_id,name:String(a.friendly_name||raw.entity_id).slice(0,160),state:String(raw.state??'unknown').slice(0,100),area:r.area||'',device:r.device||'',deviceClass:String(a.device_class||''),unit:String(a.unit_of_measurement||''),features:Number(a.supported_features)||0,colorModes:Array.isArray(a.supported_color_modes)?a.supported_color_modes.filter(x=>typeof x==='string'):[],brightness:Number.isFinite(a.brightness)?a.brightness:null,position:Number.isFinite(a.current_position)?a.current_position:null,current:Number.isFinite(a.current_temperature)?a.current_temperature:null,target:Number.isFinite(a.temperature)?a.temperature:null,min:Number.isFinite(a.min_temp)?a.min_temp:16,max:Number.isFinite(a.max_temp)?a.max_temp:28,step:Number.isFinite(a.target_temp_step)?a.target_temp_step:.5,updatedAt:raw.last_reported||raw.last_updated||null};
}
export async function readHaRegistry(url,token){
 const wsUrl=new URL('api/websocket',url);wsUrl.protocol=wsUrl.protocol==='https:'?'wss:':'ws:';
 return new Promise(resolve=>{
  let socket;const results={},timer=setTimeout(()=>finish({}),2500);let done=false;
  function finish(value){if(done)return;done=true;clearTimeout(timer);try{socket?.close();}catch{}resolve(value);}
  try{socket=new WebSocket(wsUrl);socket.addEventListener('error',()=>finish({}));socket.addEventListener('close',()=>finish({}));socket.addEventListener('message',event=>{
   try{const message=JSON.parse(String(event.data));if(message.type==='auth_required')socket.send(JSON.stringify({type:'auth',access_token:token}));
    if(message.type==='auth_invalid')finish({});
    if(message.type==='auth_ok')for(const [i,type]of ['config/area_registry/list','config/device_registry/list','config/entity_registry/list'].entries())socket.send(JSON.stringify({id:i+1,type}));
    if(message.type==='result'){results[message.id]=message.success&&Array.isArray(message.result)?message.result:[];if(Object.keys(results).length===3){const areas=new Map(results[1].map(a=>[a.area_id,a.name])),devices=new Map(results[2].map(d=>[d.id,d]));finish(Object.fromEntries(results[3].map(e=>{const device=devices.get(e.device_id);return [e.entity_id,{area:areas.get(e.area_id||device?.area_id)||'',device:device?.name_by_user||device?.name||''}];})));}}
   }catch{finish({});}
  });}catch{finish({});}
 });
}
export function createHaBridge({haUrl='',haToken='',storage,credentialStore,fetchImpl=fetch,registryImpl=readHaRegistry}={}){
 let cached=null,registry={},registryAt=0,inflight=null,configurationVersion=0;
 try{const saved=JSON.parse(credentialStore?.getItem('connection')||'null');if(saved?.disabled){haUrl='';haToken='';}else if(saved?.url&&saved?.token){haUrl=saved.url;haToken=saved.token;}}catch{}
 const base=()=>{const url=new URL(haUrl);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('Brug Home Assistants http- eller https-adresse uden loginoplysninger.');url.pathname=url.pathname.replace(/\/?$/,'/');return url;};
 const catalog=()=>{try{return normalizeDeviceCatalog(JSON.parse(storage?.getItem(deviceCatalogKey)||'null'));}catch{return defaultDevices();}};
 async function request(path,options={}){const response=await fetchImpl(new URL(path,base()),{...options,headers:{authorization:'Bearer '+haToken,'Content-Type':'application/json'},signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error(response.status===401?'Home Assistant afviste adgangsnøglen.':'Home Assistant kunne ikke kontaktes.');return response;}
 async function snapshot(force=false){
  if(!haUrl||!haToken)return {configured:false,online:false,entities:[],url:haUrl||'',controlEnabled:true};
  if(inflight)return inflight;if(!force&&cached&&Date.now()-cached.fetchedAt<5000)return {...cached,url:haUrl};
  const version=configurationVersion;
  inflight=(async()=>{try{
   const response=await request('api/states'),states=await response.json();if(!Array.isArray(states))throw Error('Home Assistant returnerede et ugyldigt svar.');
   if(Date.now()-registryAt>60000){registry=await registryImpl(base(),haToken);registryAt=Date.now();}
   if(version!==configurationVersion)throw Error('Forbindelsen er ændret. Hent enheder igen.');
   cached={configured:true,online:true,entities:states.map(e=>normalizeHaEntity(e,registry)).filter(Boolean),fetchedAt:Date.now(),controlEnabled:true};return {...cached,url:haUrl};
  }catch(error){return {configured:true,online:false,entities:cached?.entities||[],fetchedAt:cached?.fetchedAt||null,url:haUrl,controlEnabled:true,error:error.message==='Home Assistant afviste adgangsnøglen.'?error.message:'Forbindelsen til Home Assistant mangler. Sidst hentede værdier kan være forældede.'};}finally{inflight=null;}})();return inflight;
 }
 function commandFor(device,entity,action,value){
  const domain=entity.id.split('.')[0],data={entity_id:entity.id};let service;
  if(['unknown','unavailable'].includes(entity.state))throw Error('Enheden er utilgængelig.');
  if(device.type==='light'){
   if(action==='on'||action==='off')service=action==='on'?'turn_on':'turn_off';
   if(action==='brightness'){if(!Number.isFinite(value)||value<0||value>100||!entity.colorModes.some(m=>!['onoff','unknown'].includes(m))&&!(entity.features&1))throw Error('Lampen understøtter ikke den valgte lysstyrke.');service='turn_on';data.brightness_pct=value;}
  }else if(device.type==='climate'&&action==='temperature'){
   if(!(entity.features&1)&&!Number.isFinite(entity.target))throw Error('Denne varmeenhed understøtter ikke temperaturvalg.');if(!Number.isFinite(value)||value<entity.min||value>entity.max)throw Error('Temperaturen er uden for enhedens tilladte område.');service='set_temperature';data.temperature=value;
  }else if(device.type==='cover'){
   if(action==='open'&&(entity.features&1))service='open_cover';if(action==='close'&&(entity.features&2))service='close_cover';if(action==='stop'&&(entity.features&8))service='stop_cover';
   if(action==='position'&&(entity.features&4)&&Number.isFinite(value)&&value>=0&&value<=100){service='set_cover_position';data.position=value;}
  }else if(['charger','switch'].includes(device.type)&&['on','off'].includes(action))service=action==='on'?'turn_on':'turn_off';
  if(!service)throw Error('Handlingen understøttes ikke af denne enhed.');return {domain,service,data};
 }
 return {
  snapshot,catalog,get configured(){return !!haUrl&&!!haToken;},async entity(id){if(!haUrl||!haToken)throw Error('Home Assistant er ikke tilsluttet.');return (await request('api/states/'+encodeURIComponent(id))).json();},
  async configure({url,token}){if(inflight)await inflight;if(typeof url!=='string'||!url.trim()||typeof token!=='string'||!token.trim()||url.length>500||token.length>4096)throw Error('Angiv Home Assistant-adresse og adgangsnøgle.');const oldUrl=haUrl;haUrl=url.trim();try{base();}catch(e){haUrl=oldUrl;throw e;}haToken=token.trim();configurationVersion++;cached=null;registry={};registryAt=0;credentialStore?.setItem('connection',JSON.stringify({url:haUrl,token:haToken}));return snapshot(true);},
  disconnect(){haUrl='';haToken='';configurationVersion++;cached=null;registry={};credentialStore?.setItem('connection',JSON.stringify({disabled:true}));return {configured:false,online:false,entities:[],url:'',controlEnabled:true};},
  saveCatalog(value){const next=normalizeDeviceCatalog(value),previous=catalog();if(next.revision!==previous.revision){const e=Error('Opsætningen er ændret på en anden skærm. Hent den nyeste opsætning, før du gemmer.');e.status=409;throw e;}next.revision++;storage?.setItem(deviceCatalogKey,JSON.stringify(next));return next;},
  async command({deviceId,action,value,revision}){const initial=catalog(),version=configurationVersion;if(revision!==undefined&&revision!==initial.revision){const error=Error('Opsætningen er ændret. Hent den seneste opsætning, før du betjener enheden.');error.status=409;throw error;}const d=initial.devices.find(d=>d.id===deviceId&&!d.retired);if(!d?.bindings.primary)throw Error('Enheden er ikke koblet til Home Assistant.');const current=await snapshot(true);if(!current.online)throw Error('Forbindelsen til Home Assistant mangler. Handlingen blev ikke udført.');if(version!==configurationVersion||catalog().revision!==initial.revision)throw Error('Forbindelsen eller koblingen er ændret. Hent opsætningen igen.');const e=current.entities.find(e=>e.id===d.bindings.primary);if(!e||!compatibleEntity(d,'primary',e))throw Error('Den koblede enhed mangler eller har forkert type.');const command=commandFor(d,e,action,value);await request('api/services/'+command.domain+'/'+command.service,{method:'POST',body:JSON.stringify(command.data)});cached=null;return {accepted:true,message:'Kommando sendt. Kontrollér den rapporterede tilstand.',snapshot:await snapshot(true)};},
 };
}
