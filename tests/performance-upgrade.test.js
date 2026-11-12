import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as THREE from 'three';
import {createJournal,safeStorage} from '../src/storage.js';
import {createDemoHome} from '../src/home-data.js';
import {setAllLights} from '../src/house.js';
import {buildFurnishings} from '../src/furniture.js';
import {initialFurnishing} from '../src/furnishing-data.js';
import {createDashboardServer,fileStorage} from '../server/app.mjs';
const memory=()=>{const values=new Map();return {get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const journal=storage=>createJournal({key:'test',storage,initial:()=>({sum:0}),valid:v=>Number.isFinite(v?.sum),reduce:(s,o)=>{s.sum+=o.amount;},compactAfter:16});
test('Journal compaction preserves concurrent providers, bounded history and restart recovery',async()=>{
 const storage=memory(),a=journal(storage),b=journal(storage);for(let i=0;i<64;i++)(i%2?a:b).append({amount:1});assert.equal(a.load().sum,64);await Promise.all([a.compact(),b.compact()]);assert.equal(a.load().sum,64);assert.ok(storage.length<6);b.append({amount:3});assert.equal(journal(storage).load().sum,67);
 // Covered IDs prevent replay if deletion was interrupted; backup also survives
 // corruption of the primary checkpoint after a successful compaction.
 storage.setItem('test:checkpoint','invalid');assert.equal(journal(storage).load().sum,67);
 for(let i=0;i<32;i++)a.append({amount:2});await a.compact();assert.equal(b.load().sum,131);
});
test('A concurrent append during checkpoint publication is retained and not replayed twice',async()=>{
 const disk=memory(),a=journal(disk);for(let i=0;i<20;i++)a.append({amount:1});const original=disk.setItem;let once=true;disk.setItem=(key,value)=>{original(key,value);if(key==='test:checkpoint'&&once){once=false;journal(disk).append({amount:7});}};await a.compact();assert.equal(a.load().sum,27);assert.equal(journal(disk).load().sum,27);
});
test('Checkpoint write failure leaves saved operations intact and remains usable in memory',async()=>{
 const disk=memory(),a=journal(disk);for(let i=0;i<20;i++)a.append({amount:1});const write=disk.setItem;disk.setItem=(k,v)=>{if(k.includes('checkpoint'))throw Error('quota');write(k,v);};assert.equal(await a.compact(),false);assert.equal(journal(disk).load().sum,20);a.append({amount:1});assert.equal(a.load().sum,21);assert.equal(a.persistent,false);
});
test('Storage reads observe changes and deletions written by other tabs',()=>{const raw=memory(),a=safeStorage(raw),b=safeStorage(raw);a.setItem('x','1');b.setItem('x','2');assert.equal(a.getItem('x'),'2');b.removeItem('x');assert.equal(a.getItem('x'),null);assert.deepEqual(a.entries('x'),[]);});
test('All-lights gesture is one operation and retains independent changes from stale providers',()=>{
 const raw=memory(),a=createDemoHome(raw),b=createDemoHome(raw),one=a.load(),two=b.load();setAllLights(one,true);a.save(one);assert.equal([...Array(raw.length)].map((_,i)=>raw.key(i)).filter(k=>k.includes(':op:')).length,1);two.sove.target=24;b.save(two);assert.equal(a.load().sove.target,24);assert.ok(Object.values(a.load()).every(room=>Object.values(room.lights).every(Boolean)));
});
test('Furniture updates preserve unrelated objects and geometry through transforms, colour and visibility edits',()=>{
 const scene=new THREE.Scene(),value=initialFurnishing(),model=buildFurnishings(scene,value),unrelated=model.get('sove-bed'),sofa=model.get('stue-sofa'),geometry=sofa.children[0].geometry;
 value.items.find(i=>i.id==='stue-sofa').x+=.1;assert.deepEqual(model.setSnapshot(value),['stue-sofa']);assert.equal(model.get('stue-sofa'),sofa);assert.equal(sofa.children[0].geometry,geometry);value.visible=false;assert.deepEqual(model.setSnapshot(value),[]);assert.equal(model.get('sove-bed'),unrelated);value.visible=true;
 for(let i=0;i<15;i++){value.items.find(i=>i.id==='stue-sofa').color=i%2?'#eeeeee':'#aaaaaa';model.setSnapshot(value);assert.equal(model.get('sove-bed'),unrelated);}model.dispose();
});
test('Static assets validate with ETag; hashed assets cache immutably; API responses remain private',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'engstien-cache-'));await writeFile(join(dir,'index.html'),'<p>Test</p>');await writeFile(join(dir,'app-AbCd1234.js'),'test');const server=createDashboardServer({password:'test',storage:memory(),staticRoot:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});});const url='http://127.0.0.1:'+server.address().port;
 const response=await fetch(url),etag=response.headers.get('etag');assert.ok(etag);assert.equal(response.headers.get('cache-control'),'no-cache');assert.equal((await fetch(url,{headers:{'if-none-match':etag}})).status,304);assert.match((await fetch(url+'/app-AbCd1234.js')).headers.get('cache-control'),/immutable/);assert.equal((await fetch(url+'/api/info')).headers.get('cache-control'),'no-store');
});
test('Asynchronous file storage flushes a grouped snapshot before restart, including deletions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'engstien-durable-'));try{const path=join(dir,'data.json'),disk=fileStorage(path);for(let i=0;i<100;i++)disk.setItem('key'+i,String(i));disk.removeItem('key3');await disk.flush();assert.equal(fileStorage(path).getItem('key99'),'99');assert.equal(JSON.parse(await readFile(path,'utf8')).key3,undefined);}finally{await rm(dir,{recursive:true,force:true});}
});

test('Replacing a furniture item disposes every retired geometry, including resources with stable cache keys',()=>{
 const scene=new THREE.Scene(),value=initialFurnishing(),model=buildFurnishings(scene,value),retired=new Set(),disposed=new Set();model.get('stue-sofa').traverse(mesh=>{if(mesh.geometry){retired.add(mesh.geometry);mesh.geometry.addEventListener('dispose',()=>disposed.add(mesh.geometry));}});
 try{value.items.find(i=>i.id==='stue-sofa').color='#abcdef';model.setSnapshot(value);const active=new Set();model.root.traverse(mesh=>{if(mesh.geometry)active.add(mesh.geometry);});for(const geometry of retired)if(!active.has(geometry))assert.ok(disposed.has(geometry),'Retired geometry must be disposed: '+geometry.type);}finally{model.dispose();}
});
