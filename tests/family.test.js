import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoFamilyProvider,FAMILY_STORAGE_KEY,copenhagenDay,addDays,relativeDay} from '../src/family-data.js';
const now=()=>new Date('2026-10-25T23:30:00Z');
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
test('Family calendar uses Copenhagen calendar dates across daylight saving and month boundaries',()=>{
 assert.equal(copenhagenDay(now()),'2026-10-26');assert.equal(addDays('2026-10-25',1),'2026-10-26');assert.equal(addDays('2026-12-31',1),'2027-01-01');
 assert.equal(relativeDay('2026-10-26','2026-10-25'),'I morgen');assert.equal(relativeDay('2026-10-25','2026-10-25'),'I dag');assert.equal(relativeDay('2026-10-24','2026-10-25'),'I går');
});
test('List changes persist across providers, keep lists separate and never mutate returned snapshots',async()=>{
 const storage=memory(),p=createDemoFamilyProvider({storage,now,createId:()=> 'new-item'});
 const before=await p.load();const added=await p.addItem('shopping','  Havregryn  ');assert.equal(added.shopping[0].text,'Havregryn');assert.deepEqual(added.tasks,before.tasks);
 await p.setDone('shopping','new-item',true);const restored=await createDemoFamilyProvider({storage,now}).load();assert.equal(restored.shopping.find(i=>i.id==='new-item').done,true);
 restored.tasks.length=0;assert.equal((await p.load()).tasks.length,before.tasks.length);
 const cleared=await p.clearCompleted('shopping');assert.ok(!cleared.shopping.some(i=>i.done));assert.deepEqual(cleared.tasks,before.tasks);assert.ok(storage.getItem(FAMILY_STORAGE_KEY));
});
test('Invalid list writes fail without changing saved state',async()=>{
 const storage=memory(),p=createDemoFamilyProvider({storage,now});await p.addItem('tasks','Test');const saved=storage.getItem(FAMILY_STORAGE_KEY);
 await assert.rejects(p.addItem('shopping',null));await assert.rejects(p.addItem('shopping','  '));await assert.rejects(p.addItem('shopping','x'.repeat(121)));await assert.rejects(p.setDone('tasks','missing',true));await assert.rejects(p.addItem('other','Test'));assert.equal(storage.getItem(FAMILY_STORAGE_KEY),saved);
});
test('Storage errors do not falsely mark an item as saved',async()=>{
 const p=createDemoFamilyProvider({storage:{getItem:()=>null,setItem:()=>{throw new Error('Quota');}},now});const before=await p.load();await assert.rejects(p.addItem('tasks','Kan ikke gemmes'));assert.deepEqual((await p.load()).tasks,before.tasks);
});
test('Waste calendar is explicitly a demo with future example dates and named sources',async()=>{
 const data=await createDemoFamilyProvider({storage:null,now}).load();assert.equal(data.mode,'demo');assert.equal(data.sources.shopping.name,'Apple Noter');assert.equal(data.sources.waste.name,'Renosyd');assert.equal(data.sources.waste.status,'demo');
 assert.ok(data.waste.every(event=>event.date>data.today));assert.equal(data.waste[0].date,'2026-10-27');assert.deepEqual(data.waste[0].fractions,['rest','food']);
});
