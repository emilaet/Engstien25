import {defaultDevices,deviceCatalogKey} from '../../src/device-catalog.js';
export const robotRawStates=()=>[
 {entity_id:'vacuum.qrevo',state:'docked',attributes:{friendly_name:'Qrevo',battery_level:78,fan_speed:'balanced',fan_speed_list:['quiet','balanced','turbo'],supported_features:8192|4|8|16|32|512|16384,access_token:'never-expose-this'}},
 {entity_id:'select.qrevo_mop',state:'standard',attributes:{options:['standard','deep']}},
 {entity_id:'switch.qrevo_wash',state:'off',attributes:{}},
 {entity_id:'switch.qrevo_child_lock',state:'off',attributes:{}},
 {entity_id:'sensor.qrevo_area',state:'47.5',attributes:{unit_of_measurement:'m²'}},
 {entity_id:'sensor.qrevo_duration',state:'3900',attributes:{unit_of_measurement:'s'}},
 {entity_id:'image.qrevo_map',state:'2026-11-20T09:00:00Z',attributes:{entity_picture:'https://private.example/token',access_token:'map-secret'}},
 {entity_id:'lawn_mower.yuka',state:'docked',attributes:{friendly_name:'Yuka Mini 2',battery_level:64,supported_features:15}},
 {entity_id:'number.yuka_speed',state:'0.4',attributes:{min:0.2,max:0.6,step:0.1,unit_of_measurement:'m/s'}},
 {entity_id:'select.yuka_route',state:'standard',attributes:{options:['standard','deep']}},
 {entity_id:'switch.yuka_front',state:'on',attributes:{friendly_name:'Forhave',hash:5001}},
 {entity_id:'switch.yuka_back',state:'off',attributes:{friendly_name:'Baghave',hash:5002}},
 {entity_id:'button.yuka_weekend',state:'unknown',attributes:{friendly_name:'Weekend',task_id:8001}},
 {entity_id:'switch.other_zone',state:'on',attributes:{hash:9001}},
 {entity_id:'button.other_task',state:'2026-11-20',attributes:{task_id:9002}},
];
// HA button states are often "unknown" until their first press. The entity is
// still available and may run its task; only "unavailable" denotes offline.
export const robotRegistry=()=>({
 ...Object.fromEntries(robotRawStates().map(e=>[e.entity_id,{deviceId:e.entity_id.includes('other_')?'other':e.entity_id.includes('qrevo')?'qrevo-device':'yuka-device',platform:e.entity_id.includes('qrevo')?'roborock':'mammotion',cleaningAreas:e.entity_id==='vacuum.qrevo'?['stue','alrum']:[]}])),
 $areas:[{id:'stue',name:'Stue'},{id:'alrum',name:'Alrum'},{id:'bad',name:'Bad'}],
});
export function boundRobotCatalog(){const c=defaultDevices();c.devices.find(d=>d.id==='stue:vacuum').bindings={primary:'vacuum.qrevo',mopMode:'select.qrevo_mop',wash:'switch.qrevo_wash',childLock:'switch.qrevo_child_lock',area:'sensor.qrevo_area',duration:'sensor.qrevo_duration',map:'image.qrevo_map'};c.devices.find(d=>d.id==='outside:mower').bindings={primary:'lawn_mower.yuka',speed:'number.yuka_speed',route:'select.yuka_route'};return c;}
export function robotStorage(){const data=new Map([[deviceCatalogKey,JSON.stringify(boundRobotCatalog())]]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
export const mapPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDQAAAABJRU5ErkJggg==','base64');
