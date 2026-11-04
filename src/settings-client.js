import {createDeviceCatalog,deviceCatalogKey} from './device-catalog.js';
import {remoteFamilyProvider} from './integrations.js';

export function createSettingsClient({family,onSnapshot=()=>{},onConnection=()=>{},onVehicle=()=>{},fetchImpl=fetch,storage}={}){
 const local=createDeviceCatalog(storage);let catalog=local.load(),server=false,authenticated=false,notice='',ha={configured:false,online:false,entities:[]};
 let connectionEpoch=0,legacyConfigured=false;const listeners=new Set();const emit=()=>{onSnapshot(catalog,ha);onConnection(authenticated);for(const fn of listeners)fn();};
 async function request(path,options={}){const response=await fetchImpl(path,{...options,credentials:'same-origin',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(12000)});let value;try{value=await response.json();}catch{throw Error('Dashboardserveren svarede ikke som forventet.');}if(response.status===401&&path!=='/api/session')authenticated=false;if(!response.ok)throw Error(value.error||'Forbindelsen til dashboardserveren mangler.');return value;}
 async function legacyVehicle(){if(catalog.devices.some(d=>d.type==='vehicle'&&d.bindings.primary&&!d.retired))return;try{const data=await request('/api/vehicle');if(data.configured){legacyConfigured=true;onVehicle(data);}}catch{if(legacyConfigured)onVehicle({status:'offline',homeCharging:false,quality:'cached',readonly:true});}}
 if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(!authenticated&&e.key===deviceCatalogKey){catalog=local.load();emit();}});
 const value=()=>({catalog:structuredClone(catalog),ha:structuredClone(ha),server,authenticated,notice,persistent:authenticated||local.persistent});
 return {
  value,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  async discover(){if(import.meta.env.STATIC_PREVIEW)return value();try{const info=await request('/api/info');server=info.service==='engstien-dashboard';if(server){try{catalog=await request('/api/settings/catalog');ha=await request('/api/settings/ha');authenticated=true;await legacyVehicle();await family?.setProvider(remoteFamilyProvider());}catch{authenticated=false;}}}catch{server=false;}emit();return value();},
  async login(password){if(!server)throw Error('Start dashboardserveren ved Home Assistant for at forbinde.');await request('/api/session',{method:'POST',body:JSON.stringify({password})});const previous=local.load();catalog=await request('/api/settings/catalog');ha=await request('/api/settings/ha');authenticated=true;await legacyVehicle();await family?.setProvider(remoteFamilyProvider());notice=JSON.stringify(previous.devices)!==JSON.stringify(catalog.devices)?'Serverens opsætning er hentet. Din lokale plan er bevaret og kan eksporteres eller overføres til serveren.':'';emit();},
  async refresh(force=false){if(!authenticated)return;const epoch=connectionEpoch;try{const next=await request('/api/settings/ha'+(force?'?refresh=1':''));if(epoch!==connectionEpoch)return;ha=next;await legacyVehicle();}catch{if(legacyConfigured)onVehicle({status:'offline',homeCharging:false,quality:'cached',readonly:true});ha={...ha,online:false,error:'Dashboardserveren svarer ikke. De viste værdier kan være forældede.'};}emit();},
  async save(next){if(authenticated)catalog=await request('/api/settings/catalog',{method:'PUT',body:JSON.stringify(next)});else catalog=local.save(next);notice=authenticated?'Opsætningen er gemt på dashboardserveren.':local.persistent?'Opsætningen er gemt på denne enhed.':'Lagring mangler. Hent en backup, før du lukker siden.';emit();return catalog;},
  async reloadCatalog(){if(authenticated)catalog=await request('/api/settings/catalog');else catalog=local.load();emit();return catalog;},
  async uploadLocal(){const next={...local.load(),revision:catalog.revision};return this.save(next);},
  localPlan:()=>local.load(),
  async configure(url,token){connectionEpoch++;if(!authenticated)throw Error('Log ind på dashboardserveren først.');ha=await request('/api/settings/ha',{method:'POST',body:JSON.stringify({url,token})});emit();return ha;},
  async disconnect(){connectionEpoch++;ha=await request('/api/settings/ha',{method:'DELETE'});emit();},
  async command(deviceId,action,value){if(!authenticated)throw Error('Log ind på dashboardserveren først.');const epoch=connectionEpoch;const result=await request('/api/settings/command',{method:'POST',body:JSON.stringify({deviceId,action,value,revision:catalog.revision})});if(epoch===connectionEpoch){ha=result.snapshot;emit();}return result;},
 };
}
