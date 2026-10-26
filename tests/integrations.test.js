import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDashboardServer,fileStorage} from '../server/app.mjs';
import {createDemoVehicle,remainingCharge} from '../src/vehicle-data.js';
import {createDemoHome} from '../src/home-data.js';
const memory=()=>{const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
async function start(t,options={}){const server=createDashboardServer({password:'test-only',storage:memory(),...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const url='http://127.0.0.1:'+server.address().port;const login=async()=>{const r=await fetch(url+'/api/session',{method:'POST',body:JSON.stringify({password:'test-only'})});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return r.headers.get('set-cookie').split(';')[0];};return {url,login};}
test('Vehicle demo persists pause, separates remote charging and never invents a live ETA',()=>{
 const disk=memory(),v=createDemoVehicle(disk);v.scenario('paused');assert.equal(createDemoVehicle(disk).value.status,'paused');assert.equal(remainingCharge(v.value),'På pause');v.set({battery:90,target:80});assert.equal(remainingCharge(v.value),'Mål nået');v.scenario('away');assert.equal(v.value.charging,true);assert.equal(v.value.homeCharging,false);assert.equal(remainingCharge({status:'charging',battery:50,target:80,power:11,capacity:null}),'Kan ikke beregnes');assert.equal(remainingCharge({status:'charging',battery:null,target:80}),'Mangler data');assert.equal(remainingCharge({status:'charging',battery:50,target:80,remainingMinutes:61}),'1 t 1 min');
});
test('Stale home providers preserve unrelated room and lamp edits',()=>{
 const disk=memory(),a=createDemoHome(disk),b=createDemoHome(disk),sa=a.load(),sb=b.load();sa.stue.lights.loft=false;sb.sove.target=24;a.save(sa);b.save(sb);assert.equal(a.load().stue.lights.loft,false);assert.equal(a.load().sove.target,24);
});
test('Dashboard API authenticates, shares persistent lists and scopes undo to the session',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'engstien-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));const path=join(dir,'family.json');const {url,login}=await start(t,{storage:fileStorage(path)});
 assert.equal((await fetch(url+'/api/family')).status,401);const one=await login(),two=await login();const write=async(cookie,action,args)=>{const r=await fetch(url+'/api/family',{method:'POST',headers:{cookie},body:JSON.stringify({action,args})});assert.equal(r.status,200);return r.json();};
 await write(one,'addItem',['shopping','Fælles vare']);let d=await (await fetch(url+'/api/family',{headers:{cookie:two}})).json();assert.ok(d.shopping.some(i=>i.text==='Fælles vare'));assert.equal(d.mode,'server');
 await write(one,'clearCompleted',['tasks']);d=await write(two,'undo',[]);assert.ok(!d.tasks.some(i=>i.id==='task-4'));d=await write(one,'undo',[]);assert.ok(d.tasks.some(i=>i.id==='task-4'));
 const second=await start(t,{storage:fileStorage(path)});const cookie=await second.login();d=await (await fetch(second.url+'/api/family',{headers:{cookie}})).json();assert.ok(d.shopping.some(i=>i.text==='Fælles vare'));
 assert.equal((await fetch(url+'/api/family',{method:'POST',headers:{cookie:one,origin:'https://other.example'},body:'{}'})).status,403);assert.equal((await fetch(url+'/api/vehicle',{method:'POST',headers:{cookie:one},body:'{}'})).status,405);
});
test('HA adapter converts units, keeps charger separate, and returns cached measurements on failure',async t=>{
 let fail=false;const states={battery:['57','%'],status:['on'],target:['80','%'],power:['7200','W'],energy:['12400','Wh'],remaining:['1.5','h'],charger:['off']};
 const {url,login}=await start(t,{haUrl:'http://ha.local:8123',haToken:'test-token',entities:Object.fromEntries(Object.keys(states).map(k=>[k,k])),fetchImpl:async(url,options)=>{assert.equal(options.headers.authorization,'Bearer test-token');if(fail)throw new Error('offline');const [state,unit]=states[url.pathname.split('/').pop()];return {ok:true,json:async()=>({state,attributes:{unit_of_measurement:unit},last_reported:new Date().toISOString()})};}});const cookie=await login();let d=await (await fetch(url+'/api/vehicle',{headers:{cookie}})).json();assert.equal(d.battery,57);assert.equal(d.power,7.2);assert.equal(d.kwh,12.4);assert.equal(d.remainingMinutes,90);assert.equal(d.homeCharging,false);assert.equal(d.quality,'live');assert.equal(d.readonly,true);assert.ok(!JSON.stringify(d).includes('test-token'));
 fail=true;d=await (await fetch(url+'/api/vehicle',{headers:{cookie}})).json();assert.equal(d.battery,57);assert.equal(d.quality,'cached');assert.equal(d.status,'offline');assert.equal(d.homeCharging,false);
});
test('API rejects repeated invalid logins and does not claim unconfigured Tesla data',async t=>{
 const {url,login}=await start(t);const cookie=await login();assert.equal((await (await fetch(url+'/api/vehicle',{headers:{cookie}})).json()).configured,false);
 for(let i=0;i<5;i++)assert.equal((await fetch(url+'/api/session',{method:'POST',body:'{"password":"bad"}'})).status,401);assert.equal((await fetch(url+'/api/session',{method:'POST',body:'{"password":"bad"}'})).status,429);
});
