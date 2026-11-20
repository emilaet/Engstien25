import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {defaultDevices,normalizeDeviceCatalog,compatibleEntity} from '../src/device-catalog.js';
import {planDeviceImport} from '../src/device-import.js';
import {parseNavigation} from '../src/navigation-state.js';
import {createHaBridge,normalizeHaEntity,readHaRegistry} from '../server/home-assistant.mjs';
import {robotCommand} from '../server/robot-commands.mjs';
import {robotSnapshot,robotMetric,robotOptionLabel} from '../src/robot-data.js';
import {buildRobotModels} from '../src/robot-models.js';
import {frameRobotCamera,robotPlacement} from '../src/robot-layout.js';
import {finishedFloor} from '../src/architecture.js';
import {lawnHeight} from '../src/outdoor-layout.js';
import {createDashboardServer} from '../server/app.mjs';
import {robotRawStates,robotRegistry,boundRobotCatalog,robotStorage,mapPng} from './fixtures/robots.js';
const entities=()=>robotRawStates().map(e=>normalizeHaEntity(e,robotRegistry())),snapshot=()=>({online:true,entities:entities(),areas:robotRegistry().$areas}),device=type=>boundRobotCatalog().devices.find(d=>d.type===type),primary=type=>snapshot().entities.find(e=>e.id===device(type).bindings.primary);

test('Old catalogs gain two stable robot locations without losing bindings or accepting mismatched domains',()=>{
 const old=defaultDevices();old.devices=old.devices.filter(d=>!['mower','vacuum'].includes(d.type));old.devices[0].bindings.primary='light.saved';old.revision=7;const c=normalizeDeviceCatalog(old);assert.equal(c.revision,7);assert.equal(c.devices[0].bindings.primary,'light.saved');assert.equal(c.devices.filter(d=>['mower','vacuum'].includes(d.type)).length,2);
 const imported=planDeviceImport(c,snapshot(),{entityId:'lawn_mower.yuka',room:'outside',replaceId:'outside:mower'});assert.equal(imported.catalog.devices.length,c.devices.length);assert.equal(imported.catalog.devices.find(d=>d.id==='outside:mower').bindings.primary,'lawn_mower.yuka');
 assert.equal(compatibleEntity(device('mower'),'primary',{id:'vacuum.qrevo'}),false);assert.equal(compatibleEntity(device('vacuum'),'battery',{id:'sensor.watts',unit:'W'}),false);assert.equal(compatibleEntity(device('mower'),'constructor',{id:'number.bad'}),false);assert.equal(parseNavigation('#mower').view,'mower');assert.equal(parseNavigation('#vacuum').view,'vacuum');
});

test('HA normalization supplies bounded control metadata without leaking manufacturer tokens or image URLs',()=>{
 const raw=robotRawStates(),data=raw.map(e=>normalizeHaEntity(e,robotRegistry()));assert.ok(!JSON.stringify(data).includes('never-expose'));assert.ok(!JSON.stringify(data).includes('private.example'));assert.ok(!JSON.stringify(data).includes('map-secret'));
 assert.deepEqual(data[0].cleaningAreas,['stue','alrum']);assert.equal(data[7].deviceId,'yuka-device');assert.equal(data[8].numberStep,.1);assert.equal(data[10].zoneId,'5001');assert.equal(data[12].taskId,'8001');
 const bounded=normalizeHaEntity({entity_id:'select.x',state:'x',attributes:{options:['safe',42,'x'.repeat(161)],task_id:'https://evil',hash:'constructor',min:Infinity}});assert.deepEqual(bounded.options,['safe']);assert.equal(bounded.taskId,null);assert.equal(bounded.zoneId,null);assert.equal(bounded.numberMin,null);
});

test('HA registry maps vacuum areas from the actual cleaning map, retaining only safe public metadata',async t=>{
 const Previous=globalThis.WebSocket;
 class Socket extends EventTarget{constructor(){super();queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'auth_required'})})));}send(text){const m=JSON.parse(text);if(m.type==='auth'){queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'auth_ok'})})));return;}const result=m.id===1?[{area_id:'stue',name:'Stue'},{area_id:'bad',name:'Bad'}]:m.id===2?[{id:'d',name:'Qrevo',area_id:'stue'}]:[{entity_id:'vacuum.qrevo',device_id:'d',platform:'roborock',options:{vacuum:{area_mapping:{stue:['0_16'],bad:[]}},private:'hidden'}}];queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'result',id:m.id,success:true,result})})));}close(){}}
 globalThis.WebSocket=Socket;t.after(()=>{globalThis.WebSocket=Previous;});const registry=await readHaRegistry(new URL('http://ha.test/'),'private-token');assert.deepEqual(registry['vacuum.qrevo'].cleaningAreas,['stue']);assert.equal(registry['vacuum.qrevo'].area,'Stue');assert.equal(registry.$areas.length,2);assert.ok(!JSON.stringify(registry).includes('hidden'));
});

test('Standard robot services require advertised capabilities, available primaries, exact fan choices and mapped rooms',()=>{
 const s=snapshot(),v=device('vacuum'),vp=primary('vacuum'),m=device('mower'),mp=primary('mower');
 for(const [d,e,action,service] of [[v,vp,'start','start'],[v,vp,'pause','pause'],[v,vp,'home','return_to_base'],[v,vp,'locate','locate'],[m,mp,'start','start_mowing'],[m,mp,'home','dock'],[m,mp,'stop','stop']])assert.deepEqual(robotCommand(d,e,action,undefined,s),{domain:e.id.split('.')[0],service,data:{entity_id:e.id}});
 assert.equal(robotCommand(v,vp,'fan','turbo',s).data.fan_speed,'turbo');assert.deepEqual(robotCommand(v,vp,'areas',['stue'],s).data.cleaning_area_id,['stue']);
 for(const [action,value]of [['fan','unlisted'],['areas',['bad']],['areas',['stue','stue']],['areas',['unknown']],['raw','any'],['constructor',null]])assert.throws(()=>robotCommand(v,vp,action,value,s));
 assert.throws(()=>robotCommand(v,{...vp,features:0},'start',null,s));assert.throws(()=>robotCommand(v,{...vp,state:'unavailable'},'start',null,s));
});

test('Auxiliary robot settings can only target saved typed bindings within real choices, ranges and steps',()=>{
 const s=snapshot(),v=device('vacuum'),vp=primary('vacuum'),m=device('mower'),mp=primary('mower');
 assert.deepEqual(robotCommand(v,vp,'select',{slot:'mopMode',option:'deep'},s),{domain:'select',service:'select_option',data:{entity_id:'select.qrevo_mop',option:'deep'}});
 assert.equal(robotCommand(m,mp,'number',{slot:'speed',number:.5},s).data.value,.5);assert.equal(robotCommand(v,vp,'switch',{slot:'wash',on:true},s).service,'turn_on');assert.equal(robotCommand(v,vp,'switch',{slot:'childLock',on:false},s).data.entity_id,'switch.qrevo_child_lock');
 for(const [action,value] of [['select',{slot:'mopMode',option:'anything'}],['switch',{slot:'map',on:true}],['switch',{slot:'wash',on:'true'}],['select',{slot:'__proto__',option:'bad'}]])assert.throws(()=>robotCommand(v,vp,action,value,s));
 for(const number of [.1,.65,.45,NaN,Infinity,'0.4'])assert.throws(()=>robotCommand(m,mp,'number',{slot:'speed',number},s));
 assert.throws(()=>robotCommand(m,mp,'number',{slot:'bladeHeight',number:40},s));
});

test('Mammotion zones and task buttons belong to the bound HA device and integration; new unknown-state buttons work',()=>{
 const m=device('mower'),mp=primary('mower'),s=snapshot();assert.deepEqual(robotCommand(m,mp,'zones',['switch.yuka_front','switch.yuka_back'],s),{domain:'mammotion',service:'start_mow',data:{entity_id:'lawn_mower.yuka',areas:['switch.yuka_front','switch.yuka_back']}});assert.deepEqual(robotCommand(m,mp,'task','button.yuka_weekend',s),{domain:'button',service:'press',data:{entity_id:'button.yuka_weekend'}});
 for(const [action,value]of [['zones',['switch.other_zone']],['zones',['switch.yuka_front','switch.yuka_front']],['zones',[]],['task','button.other_task'],['task','number.yuka_speed']])assert.throws(()=>robotCommand(m,mp,action,value,s));assert.throws(()=>robotCommand(m,{...mp,platform:'other'},'zones',['switch.yuka_front'],s));const unavailable=structuredClone(s);unavailable.entities.find(e=>e.id==='button.yuka_weekend').state='unavailable';assert.throws(()=>robotCommand(m,mp,'task','button.yuka_weekend',unavailable));
});

test('Robot state never invents telemetry, preserves a zero battery and locks offline controls',()=>{
 let p=robotSnapshot('vacuum',defaultDevices(),{online:false,entities:[]});assert.equal(p.battery,null);assert.equal(p.supports('start'),false);assert.equal(p.status,'Ikke tilsluttet');const s=snapshot();s.entities[0].battery=0;p=robotSnapshot('vacuum',boundRobotCatalog(),s);assert.equal(p.battery,0);assert.deepEqual(p.areas.map(a=>a.id),['stue','alrum']);assert.equal(p.metric('area'),'47,5 m²');assert.equal(p.metric('duration'),'1 t 5 min');assert.equal(robotMetric({state:'off',deviceClass:'problem'}),'Normal');assert.equal(robotSnapshot('vacuum',boundRobotCatalog(),{...s,online:false}).supports('start'),false);assert.equal(robotSnapshot('vacuum',boundRobotCatalog(),s,true).supports('home'),false);assert.equal(robotSnapshot('mower',boundRobotCatalog(),s).zones.length,2);
});

test('Retired robots cannot act or show an invented empty battery, and unknown labels remain literal text',()=>{
 const catalog=boundRobotCatalog();catalog.devices.find(d=>d.id==='stue:vacuum').retired=true;const retired=robotSnapshot('vacuum',catalog,snapshot());assert.equal(retired.status,'Udgået');assert.equal(retired.battery,null);assert.equal(retired.linked,false);assert.equal(retired.supports('start'),false);assert.equal(robotMetric({state:' ',unit:'%'}),'—');assert.equal(robotOptionLabel('constructor'),'constructor');assert.equal(robotOptionLabel('__proto__'),'__proto__');const s=snapshot();s.entities[0].state='constructor';assert.equal(robotSnapshot('vacuum',boundRobotCatalog(),s).status,'constructor');
});

test('Bridge refuses offline and stale commands and proxies only a saved robot image with a bounded raster MIME',async()=>{
 let offline=false,mime='image/png',large=false,posts=0;const requests=[];const bridge=createHaBridge({storage:robotStorage(),haUrl:'http://supervisor/core/',haToken:'private-token',registryImpl:async()=>robotRegistry(),fetchImpl:async(url,options)=>{requests.push(url.pathname);assert.equal(options.headers.authorization,'Bearer private-token');if(offline)throw Error('offline');if(options.method==='POST'){posts++;return new Response('[]');}if(url.pathname.includes('image_proxy'))return new Response(large?new Uint8Array(8*1024*1024+1):mapPng,{headers:{'content-type':mime}});return Response.json(robotRawStates());}});
 assert.deepEqual((await bridge.robotImage('stue:vacuum')).body,mapPng);assert.ok(requests.includes('/core/api/image_proxy/image.qrevo_map'));await assert.rejects(bridge.robotImage('entre:camera'));await assert.rejects(bridge.robotImage('https://evil.example'));
 mime='text/html';await assert.rejects(bridge.robotImage('stue:vacuum'),/kortbillede/);mime='image/svg+xml';await assert.rejects(bridge.robotImage('stue:vacuum'));mime='image/png';large=true;await assert.rejects(bridge.robotImage('stue:vacuum'),/for stort/);
 await assert.rejects(bridge.command({deviceId:'stue:vacuum',action:'start',revision:99}),/ændret/);offline=true;await assert.rejects(bridge.command({deviceId:'stue:vacuum',action:'start',revision:0}),/ikke udført/);assert.equal(posts,0);
});

test('Robot map HTTP endpoint requires authentication and never exposes the HA access token',async t=>{
 const server=createDashboardServer({password:'robot-test-password',storage:robotStorage(),haUrl:'http://ha.test/',haToken:'private-token',registryImpl:async()=>robotRegistry(),fetchImpl:async url=>url.pathname.includes('image_proxy')?new Response(mapPng,{headers:{'content-type':'image/png'}}):Response.json(robotRawStates())});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});const base='http://127.0.0.1:'+server.address().port,path='/api/settings/robot-map?deviceId=stue%3Avacuum';assert.equal((await fetch(base+path)).status,401);const login=await fetch(base+'/api/session',{method:'POST',body:JSON.stringify({password:'robot-test-password'})}),cookie=login.headers.get('set-cookie').split(';')[0];const r=await fetch(base+path,{headers:{cookie}});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');assert.equal(r.headers.get('cache-control'),'no-store');assert.deepEqual(Buffer.from(await r.arrayBuffer()),mapPng);assert.equal((await fetch(base+'/api/settings/robot-map?deviceId=entre%3Acamera',{headers:{cookie}})).status,400);
});

test('Dock models rest on their real floors, face the requested directions, fit phone/tablet cameras and stay batched',()=>{
 const robots=buildRobotModels(new THREE.Scene());robots.root.updateMatrixWorld(true);const v=new THREE.Box3().setFromObject(robots.vacuum),m=new THREE.Box3().setFromObject(robots.mower);
 assert.ok(Math.abs(v.min.y-finishedFloor)<1e-5);assert.ok(v.max.z<6.82,'Dock clears the living-room wall');assert.ok(v.min.x>5.5&&v.max.x<6.2,'Dock fits between the plant and the glazing');assert.ok(Math.abs(m.min.y-lawnHeight(robotPlacement.mower.position[0]))<1e-5);assert.ok(m.min.z>12.7,'Mower stays on grass, beyond the terrace');assert.ok(m.max.x<15.29,'Station clears the shed cladding');const forward=new THREE.Vector3(0,0,1).applyQuaternion(robots.mower.quaternion);assert.ok(forward.x<-.99,'Front faces away from the driveway');
 for(const kind of ['vacuum','mower'])for(const aspect of [.6,1,1.8,2.4]){const camera=new THREE.PerspectiveCamera(25,aspect,.1,500),bounds=new THREE.Box3().setFromObject(robots[kind]),framing=frameRobotCamera(camera,bounds,kind);assert.ok(framing.extent<=.821);assert.ok(camera.position.distanceTo(framing.target)<12);}
 let meshes=0;robots.root.traverse(o=>{if(o.isMesh)meshes++;assert.equal(!!o.isLight,false);});assert.ok(meshes<85,'Fine details must be instanced rather than hundreds of draw calls');
});
