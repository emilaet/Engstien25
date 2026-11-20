import {compatibleRobotEntity,robotFeatures,robotServices,robotFields,relatedRobotEntities} from '../src/robot-profiles.js';
const missing=()=>{throw Error('Denne funktion er ikke tilgængelig på den tilsluttede robot.');};
export function robotCommand(device,primary,action,value,snapshot){
 const type=device.type,domain=primary.id.split('.')[0],features=robotFeatures[type];
 if(!features)missing();
 const ready=entity=>entity&&!['unknown','unavailable',''].includes(entity.state);
 if(!ready(primary)||!compatibleRobotEntity(device,'primary',primary))missing();
 const target=slot=>{const e=snapshot.entities.find(e=>e.id===device.bindings[slot]);if(!ready(e)||!compatibleRobotEntity(device,slot,e))missing();return e;};
 if(Object.hasOwn(features,action)){
  if(!(primary.features&features[action]))missing();
  const data={entity_id:primary.id};
  if(action==='fan'){if(typeof value!=='string'||!(primary.fanSpeeds||[]).includes(value))throw Error('Vælg en sugestyrke, som robotten understøtter.');data.fan_speed=value;}
  if(action==='areas'){if(!Array.isArray(value)||!value.length||value.length>32||new Set(value).size!==value.length||value.some(id=>typeof id!=='string'||!primary.cleaningAreas?.includes(id)||!(snapshot.areas||[]).some(a=>a.id===id)))throw Error('Vælg kendte Home Assistant-rum. Kobl dem først til Roborocks kort.');data.cleaning_area_id=value;}
  return {domain,service:robotServices[type][action],data};
 }
 if(action==='select'){
  if(!value||typeof value.slot!=='string'||!Object.hasOwn(robotFields[type],value.slot)||!robotFields[type][value.slot][1].includes('select'))missing();const e=target(value.slot);
  if(typeof value.option!=='string'||!e.options?.includes(value.option))throw Error('Den valgte indstilling understøttes ikke.');
  return {domain:'select',service:'select_option',data:{entity_id:e.id,option:value.option}};
 }
 if(action==='number'){
  if(!value||typeof value.slot!=='string'||!Object.hasOwn(robotFields[type],value.slot)||!robotFields[type][value.slot][1].includes('number'))missing();const e=target(value.slot),n=value.number;
  if(!Number.isFinite(n)||!Number.isFinite(e.numberMin)||!Number.isFinite(e.numberMax)||!Number.isFinite(e.numberStep)||e.numberStep<=0||n<e.numberMin||n>e.numberMax||Math.abs((n-e.numberMin)/e.numberStep-Math.round((n-e.numberMin)/e.numberStep))>1e-5)throw Error('Værdien er uden for robottens tilladte interval.');
  return {domain:'number',service:'set_value',data:{entity_id:e.id,value:n}};
 }
 if(action==='switch'){
  if(!value||typeof value.slot!=='string'||!Object.hasOwn(robotFields[type],value.slot)||!robotFields[type][value.slot][1].includes('switch')||typeof value.on!=='boolean')missing();const e=target(value.slot);return {domain:'switch',service:value.on?'turn_on':'turn_off',data:{entity_id:e.id}};
 }
 if(type==='mower'&&primary.platform==='mammotion'){
  const children=relatedRobotEntities(primary,snapshot.entities);
  if(action==='task'){const e=children.find(e=>e.id===value&&e.id.startsWith('button.')&&e.taskId!==null&&e.taskId!==undefined);if(!e||e.state==='unavailable')missing();return {domain:'button',service:'press',data:{entity_id:e.id}};}
  if(action==='zones'){if(!(primary.features&features.start)||!Array.isArray(value)||!value.length||value.length>32||new Set(value).size!==value.length||value.some(id=>!children.some(e=>e.id===id&&e.id.startsWith('switch.')&&e.zoneId!==null&&e.zoneId!==undefined&&ready(e))))missing();return {domain:'mammotion',service:'start_mow',data:{entity_id:primary.id,areas:value}};}
 }
 missing();
}
