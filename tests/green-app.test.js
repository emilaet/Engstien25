import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDashboardServer,fileStorage} from '../server/app.mjs';
import {createHaBridge} from '../server/home-assistant.mjs';
import {defaultDevices} from '../src/device-catalog.js';
import {availableImports,planDeviceImport} from '../src/device-import.js';
import {initialState} from '../src/house.js';
import {extraDevices,extendedHouseLightStatus} from '../src/extra-room-devices.js';
import {apiPath} from '../src/api-path.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const headers={'x-ingress-path':'/api/hassio_ingress/test-session','x-remote-user-id':'owner'};
async function start(t,options={}){const server=createDashboardServer({storage:memory(),ingress:{trustedAddress:'127.0.0.1'},...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});return 'http://127.0.0.1:'+server.address().port;}

test('Ingress refuses forged headers from an untrusted peer and keeps health separate from authentication',async t=>{
 const url=await start(t,{ingress:{trustedAddress:'172.30.32.2'}});for(const path of ['/','/api/info','/api/settings/catalog'])assert.equal((await fetch(url+path,{headers})).status,403);assert.equal((await fetch(url+'/health')).status,200);
 const local=await start(t);assert.equal((await fetch(local+'/api/info')).status,403);assert.equal((await fetch(local+'/api/info',{headers:{...headers,'x-ingress-path':'//evil.example/'}})).status,403);
});
test('Ingress uses HA login, keeps credentials private and rejects cross-origin writes',async t=>{
 const url=await start(t,{managedHa:true,haUrl:'http://supervisor/core/',haToken:'never-send-this',registryImpl:async()=>({}),fetchImpl:async()=>({ok:true,json:async()=>[]})});
 const info=await(await fetch(url+'/api/info',{headers})).json();assert.equal(info.authentication,'ingress');assert.ok(info.version);assert.equal((await fetch(url+'/api/settings/catalog',{headers})).status,200);
 const snap=await(await fetch(url+'/api/settings/ha',{headers})).text();assert.ok(!snap.includes('never-send-this'));assert.equal(JSON.parse(snap).managed,true);
 assert.equal((await fetch(url+'/api/settings/catalog',{method:'PUT',headers:{...headers,origin:'https://evil.example'},body:JSON.stringify(defaultDevices())})).status,403);
 const proxyHeaders={...headers,'x-forwarded-host':'homeassistant.example',origin:'https://homeassistant.example'};assert.equal((await fetch(url+'/api/settings/catalog',{method:'PUT',headers:proxyHeaders,body:JSON.stringify(defaultDevices())})).status,200);assert.equal((await fetch(url+'/api/settings/catalog',{method:'PUT',headers:{...proxyHeaders,origin:'https://evil.example'},body:JSON.stringify(defaultDevices())})).status,403);
 assert.equal((await fetch(url+'/api/session',{method:'POST',headers,body:'{}'})).status,405);
 assert.equal((await fetch(url+'/api/settings/ha',{method:'POST',headers,body:JSON.stringify({url:'http://evil.example',token:'foreign'})})).status,400);
});
test('Ingress HTML supplies an installation-specific base without caching another session path',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'engstien-html-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));writeFileSync(join(directory,'index.html'),'<html><head></head><body>App</body></html>');
 const url=await start(t,{staticRoot:directory});for(const session of ['one','two']){const r=await fetch(url+'/',{headers:{...headers,'x-ingress-path':'/api/hassio_ingress/'+session}});const html=await r.text();assert.equal(r.headers.get('cache-control'),'no-store');assert.ok(html.includes('<base href="/api/hassio_ingress/'+session+'/">'));assert.ok(html.includes('name="engstien-base"'));}
});
test('Managed HA ignores old connection credentials and uses Supervisor API and registry paths',async()=>{
 const credentials=memory(),paths=[];credentials.setItem('connection',JSON.stringify({disabled:true,url:'https://old.example',token:'old'}));
 const bridge=createHaBridge({managed:true,haUrl:'http://supervisor/core/',haToken:'supervisor-only',credentialStore:credentials,fetchImpl:async(url,opts)=>{assert.equal(opts.headers.authorization,'Bearer supervisor-only');paths.push(url.pathname);return {ok:true,json:async()=>[]};},registryImpl:async(url,token,options)=>{assert.equal(options.supervisor,true);assert.equal(url.pathname,'/core/');return {};}});
 assert.equal((await bridge.snapshot()).online,true);assert.deepEqual(paths,['/core/api/states']);assert.throws(()=>bridge.disconnect(),/administreres/);await assert.rejects(bridge.configure({url:'https://other.example',token:'x'}),/administreres/);
});
test('A new runtime version reads the same durable household settings after restart',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'engstien-update-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));const dataFile=join(directory,'dashboard.json');
 const one=await start(t,{storage:fileStorage(dataFile),version:'0.2.0',build:'before'}),catalog=await(await fetch(one+'/api/settings/catalog',{headers})).json();catalog.devices[0].name='Mit eget navn';assert.equal((await fetch(one+'/api/settings/catalog',{method:'PUT',headers,body:JSON.stringify(catalog)})).status,200);
 const two=await start(t,{storage:fileStorage(dataFile),version:'0.2.1',build:'after'});assert.equal((await(await fetch(two+'/api/settings/catalog',{headers})).json()).devices[0].name,'Mit eget navn');assert.equal((await(await fetch(two+'/api/info',{headers})).json()).build,'after');
});
test('Individual import can add or bind an existing room control without duplicate primary mappings',()=>{
 const catalog=defaultDevices(),connection={online:true,entities:[{id:'light.new',name:'Ny lampe',area:'Stue',state:'off'},{id:'climate.new',name:'Ny varme',state:'heat'}]};
 const existing=planDeviceImport(catalog,connection,{entityId:'light.new',room:'stue',replaceId:'stue:loft'});assert.equal(existing.catalog.devices.length,catalog.devices.length);assert.equal(existing.catalog.devices.find(d=>d.id==='stue:loft').bindings.primary,'light.new');assert.ok(existing.catalog.devices.find(d=>d.id==='stue:loft').anchor);
 const added=planDeviceImport(catalog,connection,{entityId:'light.new',room:'stue',id:'custom-lamp'});assert.equal(added.catalog.devices.length,catalog.devices.length+1);assert.equal(added.catalog.devices.at(-1).anchor,undefined);assert.equal(availableImports(added.catalog,connection).length,1);
 assert.throws(()=>planDeviceImport(added.catalog,connection,{entityId:'light.new',room:'stue'}),/allerede/);assert.throws(()=>planDeviceImport(catalog,{...connection,online:false},{entityId:'light.new',room:'stue'}),/Forbind/);assert.throws(()=>planDeviceImport(catalog,connection,{entityId:'light.new',room:'stue',type:'climate'}),/Funktionen/);
});
test('Extra lights contribute to counts without modifying demo state or creating physical model anchors',()=>{
 const catalog=planDeviceImport(defaultDevices(),{online:true,entities:[{id:'light.new',name:'Ekstra'}]},{entityId:'light.new',room:'kontor',id:'custom-extra'}).catalog,state=initialState(),before=structuredClone(state);const status=extendedHouseLightStatus(state,catalog,{entities:[{id:'light.new',state:'on'}]});assert.equal(extraDevices(catalog,'kontor').length,1);assert.ok(status.on>0);assert.equal(status.litRooms,4);assert.deepEqual(state,before);
});
test('API paths support ingress and reject foreign origins rather than posting credentials elsewhere',()=>{
 assert.equal(apiPath('/api/family','/'),'/api/family');assert.equal(apiPath('/api/settings/profile','/api/hassio_ingress/token_1/'),'/api/hassio_ingress/token_1/api/settings/profile');assert.throws(()=>apiPath('/api/session','https://evil.example/'));assert.throws(()=>apiPath('https://evil.example/','/'));
});
