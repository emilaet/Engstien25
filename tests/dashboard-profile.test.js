import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDashboardProfileStore,defaultDashboardProfile,normalizeDashboardProfile,dashboardProfileKey} from '../src/dashboard-profile.js';
import {createProfileSync} from '../src/profile-sync.js';
import {createDashboardServer,fileStorage} from '../server/app.mjs';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const profile=()=>defaultDashboardProfile();
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
function bridge(store){let offline=false,puts=0;return {get puts(){return puts;},set offline(v){offline=v;},async fetch(_url,options={}){if(offline)throw Error('offline');try{let value;if(options.method==='PUT'){puts++;const body=JSON.parse(options.body);value=store.save(body.profile,body.expectedRevision);}else value=store.load();return {ok:true,json:async()=>value};}catch(e){return {ok:false,status:e.status||400,json:async()=>({error:e.message})};}}};}
function client(network,initial=profile(),options={}){let current=structuredClone(initial),applies=0;const sync=createProfileSync({storage:memory(),delay:60000,fetchImpl:network.fetch.bind(network),getProfile:()=>current,applyProfile:p=>{current=p;applies++;},...options});return {sync,get current(){return current;},get applies(){return applies;},edit(fn){fn(current);sync.changed();}};}

test('Shared profiles validate the complete dashboard and discard unknown fields and credentials',()=>{
 const p=profile();p.secret='private';p.widgets.shopping.secret='private';p.layout[0].secret='private';const clean=normalizeDashboardProfile(p);assert.ok(!JSON.stringify(clean).includes('private'));assert.equal(clean.layout.length,13);assert.equal(clean.widgets.shopping.view,p.widgets.shopping.view);
 for(const change of [p=>p.layout[0].width=99,p=>p.appearance='unknown',p=>p.density='tiny',p=>p.briefing='true']){const invalid=profile();change(invalid);assert.throws(()=>normalizeDashboardProfile(invalid));}
});
test('Shared profile storage uses revisions and never silently resets a corrupt saved profile',()=>{
 const disk=memory(),store=createDashboardProfileStore(disk);assert.equal(store.load().profile,null);assert.equal(store.save(profile(),0).revision,1);assert.throws(()=>store.save(profile(),0),{status:409});assert.throws(()=>store.save(profile()),{status:409});disk.setItem(dashboardProfileKey,'invalid');assert.throws(()=>store.load());
});
test('A new isolated browser pulls the saved household layout instead of overwriting it with defaults',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store),a=client(network);await a.sync.connect();a.edit(p=>{p.layout.find(w=>w.id==='weather').visible=false;p.widgets.shopping.view='compact';p.density='comfortable';});await a.sync.flush();const b=client(network);await b.sync.connect();assert.deepEqual(b.current,a.current);assert.equal(network.puts,2);assert.equal(b.applies,1);a.sync.disconnect();b.sync.disconnect();
});
test('Offline edits survive a client restart; conflicting edits preserve both choices until resolved',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store),disk=memory(),a=client(network,profile(),{storage:disk});await a.sync.connect();network.offline=true;a.edit(p=>p.appearance='night');await a.sync.flush();assert.equal(a.sync.snapshot().status,'offline');a.sync.disconnect();network.offline=false;const b=client(network);await b.sync.connect();b.edit(p=>p.density='comfortable');await b.sync.flush();const resumed=client(network,profile(),{storage:disk});await resumed.sync.connect();assert.equal(resumed.sync.snapshot().conflict,true);assert.equal(store.load().profile.appearance,'auto');await resumed.sync.useLocal();assert.equal(store.load().profile.appearance,'night');assert.equal(resumed.sync.snapshot().hasPending,false);b.sync.disconnect();resumed.sync.disconnect();
});
test('A stale writer receives a conflict and can explicitly keep the shared profile',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store),a=client(network),b=client(network);await a.sync.connect();await b.sync.connect();a.edit(p=>p.appearance='night');await a.sync.flush();b.edit(p=>p.appearance='day');await b.sync.flush();assert.equal(b.sync.snapshot().conflict,true);assert.equal(b.current.appearance,'day');await b.sync.useShared();assert.equal(b.current.appearance,'night');assert.equal(b.sync.snapshot().hasPending,false);a.sync.disconnect();b.sync.disconnect();
});
test('Edits made during a save are sent afterwards without applying the old acknowledgement',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store),hold=deferred();let held=false;const a=client(network,profile(),{fetchImpl:async(url,options)=>{if(options?.method==='PUT'&&held)await hold.promise;return network.fetch(url,options);}});await a.sync.connect();held=true;a.edit(p=>p.appearance='night');const saving=a.sync.flush();a.edit(p=>p.density='comfortable');hold.resolve();await saving;assert.equal(store.load().profile.density,'comfortable');assert.equal(a.current.appearance,'night');assert.equal(a.applies,0);a.sync.disconnect();
});
test('A profile response does not replace an open layout draft or a newer local edit',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store);store.save(profile(),0);let editing=false;const hold=deferred(),a=client(network,profile(),{isEditing:()=>editing,fetchImpl:async(url,o)=>{const r=await network.fetch(url,o);await hold.promise;return r;}});const connecting=a.sync.connect();editing=true;hold.resolve();await connecting;assert.equal(a.applies,0);editing=false;await a.sync.refresh();assert.equal(a.applies,1);a.sync.disconnect();
});
test('Unauthenticated layout changes stay local and never send a profile',async()=>{
 const network=bridge(createDashboardProfileStore(memory())),a=client(network);a.edit(p=>p.appearance='day');await a.sync.flush();assert.equal(network.puts,0);assert.equal(a.sync.snapshot().status,'local');a.sync.disconnect();
});
test('The profile API authenticates, enforces origin and revision, and persists across independent sessions and restarts',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'engstien-profile-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));const path=join(directory,'data.json');
 async function start(){const server=createDashboardServer({password:'profile-test-only',storage:fileStorage(path)});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const url='http://127.0.0.1:'+server.address().port;const login=async()=>{const response=await fetch(url+'/api/session',{method:'POST',body:JSON.stringify({password:'profile-test-only'})});return response.headers.get('set-cookie').split(';')[0];};return {url,login};}
 const first=await start(),endpoint=first.url+'/api/settings/profile';assert.equal((await fetch(endpoint)).status,401);assert.equal((await fetch(endpoint,{method:'PUT',body:'{}'})).status,401);const one=await first.login(),two=await first.login(),p=profile();p.widgets.shopping.view='compact';
 const write=(cookie,body,origin)=>fetch(endpoint,{method:'PUT',headers:{cookie,...(origin?{origin}:{})},body:JSON.stringify(body)});
 assert.equal((await write(one,{profile:p,expectedRevision:0},'https://other.test')).status,403);assert.equal((await write(one,{profile:p,expectedRevision:0})).status,200);assert.equal((await write(two,{profile:p,expectedRevision:0})).status,409);assert.equal((await write(one,{profile:{},expectedRevision:1})).status,400);assert.equal((await write(one,{padding:'x'.repeat(40000)})).status,400);
 const shared=await fetch(endpoint,{headers:{cookie:two}});assert.equal(shared.headers.get('cache-control'),'no-store');assert.equal((await shared.json()).profile.widgets.shopping.view,'compact');const restarted=await start(),cookie=await restarted.login();assert.equal((await (await fetch(restarted.url+'/api/settings/profile',{headers:{cookie}})).json()).profile.widgets.shopping.view,'compact');
});
test('Offline pending queues are isolated when switching account scope',async()=>{
 const store=createDashboardProfileStore(memory()),network=bridge(store),a=client(network);a.sync.scope('first-account');await a.sync.connect();network.offline=true;a.edit(p=>p.appearance='night');await a.sync.flush();assert.equal(a.sync.snapshot().hasPending,true);a.sync.scope('second-account');assert.equal(a.sync.snapshot().hasPending,false);a.sync.scope('first-account');assert.equal(a.sync.snapshot().hasPending,true);a.sync.disconnect();
});

for(const switchAccount of [false,true])test('A delayed explicit shared-profile choice cannot mutate '+(switchAccount?'a new account scope':'a signed-out local profile'),async()=>{
 const disk=memory(),firstStore=createDashboardProfileStore(memory()),secondStore=createDashboardProfileStore(memory()),first=bridge(firstStore),second=bridge(secondStore),hold=deferred(),started=deferred();
 firstStore.save(profile(),0);const other=profile();other.appearance='day';secondStore.save(other,0);let network=first,paused=false;
 const a=client(first,profile(),{storage:disk,fetchImpl:async(url,options)=>{const response=await network.fetch(url,options);if(paused&&options?.method!=='PUT'){started.resolve();await hold.promise;}return response;}});
 try{
  a.sync.scope('first');await a.sync.connect();const oldShared=profile();oldShared.appearance='night';firstStore.save(oldShared,1);paused=true;const choosing=a.sync.useShared();await started.promise;
  if(switchAccount){paused=false;network=second;a.sync.scope('second');await a.sync.connect();a.edit(p=>p.density='comfortable');}
  else{a.sync.disconnect();a.edit(p=>p.appearance='day');}
  const expected=structuredClone(a.current),before=a.sync.snapshot();hold.resolve();await choosing;
  assert.deepEqual(a.current,expected);assert.equal(a.sync.snapshot().hasPending,true);assert.equal(a.sync.snapshot().authenticated,switchAccount);assert.equal(a.sync.snapshot().status,before.status);assert.equal(a.sync.snapshot().revision,before.revision);
 }finally{hold.resolve();a.sync.disconnect();}
});

for(const failedLookup of [false,true])test('A stale conflict '+(failedLookup?'lookup failure':'lookup result')+' cannot block edits in a new account scope',async()=>{
 const firstStore=createDashboardProfileStore(memory()),secondStore=createDashboardProfileStore(memory()),first=bridge(firstStore),second=bridge(secondStore),hold=deferred(),started=deferred();firstStore.save(profile(),0);const other=profile();other.appearance='day';secondStore.save(other,0);let network=first,paused=false;
 const a=client(first,profile(),{fetchImpl:async(url,options)=>{const response=await network.fetch(url,options);if(paused&&options?.method!=='PUT'){started.resolve();await hold.promise;if(failedLookup)throw Error('old account offline');}return response;}});
 try{
  a.sync.scope('first');await a.sync.connect();const changed=profile();changed.appearance='night';firstStore.save(changed,1);a.edit(p=>p.density='comfortable');paused=true;const saving=a.sync.flush();await started.promise;
  paused=false;network=second;a.sync.scope('second');await a.sync.connect();a.edit(p=>p.briefing=false);hold.resolve();await saving;
  assert.equal(a.sync.snapshot().conflict,false);assert.equal(a.sync.snapshot().hasPending,true);assert.equal(a.current.appearance,'day');assert.equal(a.current.briefing,false);await a.sync.flush();assert.equal(secondStore.load().profile.briefing,false);assert.equal(a.sync.snapshot().status,'synced');
 }finally{hold.resolve();a.sync.disconnect();}
});

test('A delayed connect response cannot replace the currently connected account profile',async()=>{
 const firstStore=createDashboardProfileStore(memory()),secondStore=createDashboardProfileStore(memory()),first=bridge(firstStore),second=bridge(secondStore),hold=deferred(),started=deferred();const initial=profile();initial.appearance='night';firstStore.save(initial,0);const other=profile();other.appearance='day';secondStore.save(other,0);let network=first,paused=true;
 const a=client(first,profile(),{fetchImpl:async(url,options)=>{const response=await network.fetch(url,options);if(paused){started.resolve();await hold.promise;}return response;}});
 try{a.sync.scope('first');const connecting=a.sync.connect();await started.promise;paused=false;network=second;a.sync.scope('second');await a.sync.connect();hold.resolve();await connecting;assert.equal(a.current.appearance,'day');assert.equal(a.sync.snapshot().authenticated,true);assert.equal(a.sync.snapshot().status,'synced');}
 finally{hold.resolve();a.sync.disconnect();}
});
