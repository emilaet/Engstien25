import {robotProfiles,robotFields,robotFeatures,robotStatus,relatedRobotEntities} from './robot-profiles.js';
export function robotMetric(entity,slot){
 if(!entity||!String(entity.state??'').trim()||['unknown','unavailable'].includes(entity.state))return '—';
 const {state,unit='',deviceClass=''}=entity,n=Number(state),number=value=>value.toLocaleString('da-DK',{maximumFractionDigits:1});
 if(['on','off'].includes(state))return slot==='rain'?(state==='on'?'Regn':'Tørt'):deviceClass==='problem'?(state==='on'?'Kræver hjælp':'Normal'):(state==='on'?'Ja':'Nej');
 if(Number.isFinite(n)){
  if(['s','sec','min','minutes','h','hr'].includes(unit)){
   const minutes=Math.max(0,Math.round(n*(['s','sec'].includes(unit)?1/60:['h','hr'].includes(unit)?60:1))),hours=Math.floor(minutes/60),rest=minutes%60;
   return hours?hours+' t'+(rest?' '+rest+' min':''):minutes+' min';
  }
  return number(n)+(unit?' '+unit:'');
 }
 return state+(unit?' '+unit:'');
}
export function robotOptionLabel(value){const labels={quiet:'Stille',silent:'Stille',balanced:'Balanceret',turbo:'Turbo',max:'Maksimal',max_plus:'Maksimal +',off:'Fra',low:'Lav',medium:'Mellem',high:'Høj',mild:'Mild',moderate:'Moderat',intense:'Intensiv',custom:'Tilpasset',standard:'Standard',deep:'Grundig',deep_plus:'Ekstra grundig',vacuum:'Støvsugning',mop:'Gulvvask',vacuum_and_mop:'Støvsugning og gulvvask',vacuum_then_mop:'Støvsugning, derefter gulvvask',auto:'Automatisk'};return Object.hasOwn(labels,value)?labels[value]:value;}
export function robotSnapshot(kind,catalog,connection,pending=false){
 const profile=robotProfiles[kind],device=catalog.devices.find(d=>d.id===profile.id),entities=connection.entities||[],primary=entities.find(e=>e.id===device?.bindings.primary);
 const read=slot=>entities.find(e=>e.id===device?.bindings[slot]),available=e=>!!e&&typeof e.state==='string'&&!!e.state.trim()&&!['unknown','unavailable'].includes(e.state),numeric=e=>available(e)&&Number.isFinite(Number(e.state))?Number(e.state):null;
 const linked=!!device?.bindings.primary&&!device.retired,online=linked&&connection.online&&available(primary),locked=!online||pending;
 const batterySensor=read('battery'),batteryRaw=numeric(batterySensor)??primary?.battery,battery=!device?.retired&&Number.isFinite(batteryRaw)&&batteryRaw>=0&&batteryRaw<=100?batteryRaw:null;
 const status=device?.retired?'Udgået':!linked?'Ikke tilsluttet':!connection.online?'Forbindelsen mangler':!available(primary)?'Afventer robotten':Object.hasOwn(robotStatus,primary.state)?robotStatus[primary.state]:primary.state;
 const child=primary?.platform==='mammotion'?relatedRobotEntities(primary,entities):[];
 const zones=child.filter(e=>e.id.startsWith('switch.')&&e.zoneId!==null&&e.zoneId!==undefined),tasks=child.filter(e=>e.id.startsWith('button.')&&e.taskId!==null&&e.taskId!==undefined);
 return {profile,device,primary,linked,online,locked,pending,status,battery,read,available,numeric,zones,tasks,areas:kind==='vacuum'?(connection.areas||[]).filter(a=>primary?.cleaningAreas?.includes(a.id)):[],fields:robotFields[profile.type],supports:action=>!locked&&!!(primary.features&robotFeatures[profile.type]?.[action]),metric:slot=>robotMetric(read(slot),slot)};
}
