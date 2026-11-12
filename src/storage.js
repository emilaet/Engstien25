// Prefer the live backing store so updates and deletions in another tab are visible.
export function safeStorage(storage){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 const memory=new Map();let persistent=!!storage;
 return {
  get persistent(){return persistent;},
  getItem(key){try{if(storage&&persistent){const value=storage.getItem(key);if(value===null)memory.delete(key);else memory.set(key,value);return value;}}catch{persistent=false;}return memory.get(key)??null;},
  setItem(key,value){memory.set(key,value);try{if(!storage||!persistent)throw new Error();storage.setItem(key,value);return true;}catch{persistent=false;return false;}},
  removeItem(key){memory.delete(key);try{if(storage&&persistent)storage.removeItem(key);}catch{persistent=false;}},
  entries(prefix){try{if(storage&&persistent&&Number.isInteger(storage.length)&&typeof storage.key==='function'){const entries=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))entries.push([key,storage.getItem(key)]);}for(const k of memory.keys())if(k.startsWith(prefix))memory.delete(k);for(const [k,v]of entries)memory.set(k,v);return entries;}}catch{persistent=false;}return [...memory].filter(([k])=>k.startsWith(prefix));},
 };
}
const queues=new Map();
export function createJournal({key,initial,valid=()=>true,reduce,storage,now=()=>Date.now(),id=()=>crypto.randomUUID(),compactAfter=128}){
 const disk=safeStorage(storage),checkpointKey=key+':checkpoint';let base,last=0,scheduled=false;
 const parse=text=>{try{return JSON.parse(text);}catch{return null;}};
 const saved=parse(disk.getItem(key));base=valid(saved)?saved:initial();
 function read(){
  // A compactor can replace the checkpoint between reads in another tab.
  for(let attempt=0;attempt<4;attempt++){
   const raw=disk.getItem(checkpointKey),primary=parse(raw),backup=parse(disk.getItem(checkpointKey+':backup')),cp=primary?.version===1&&valid(primary.state)&&Array.isArray(primary.covered)?primary:backup,usable=cp?.version===1&&valid(cp.state)&&Array.isArray(cp.covered),covered=new Set(usable?cp.covered:[]);
   const shared=parse(disk.getItem(key));let state=structuredClone(usable?cp.state:valid(shared)?shared:base),clock=usable?cp.lastAt||0:0;
   const ops=disk.entries(key+':op:').map(([k,v])=>[k,parse(v)]).filter(([,o])=>o&&Number.isFinite(o.at)&&typeof o.id==='string').sort(([,a],[,b])=>a.at-b.at||a.id.localeCompare(b.id));
   if(raw!==disk.getItem(checkpointKey))continue;
   for(const [,op]of ops){clock=Math.max(clock,op.at);if(!covered.has(op.id))try{reduce(state,op);}catch{/* Isolate invalid records. */}}
   return {state,clock,ops};
  }
  // Keep immutable records if another tab is continuously compacting.
  return {state:structuredClone(base),clock:last,ops:[]};
 }
 async function compact(){
  const run=()=>{if(!disk.persistent)return false;const {state,clock,ops}=read();if(ops.length<compactAfter)return false;
   // Publish replay coverage before deleting precisely the observed records. New
   // operations from other tabs remain untouched, including equal-time records.
   const cp={version:1,id:id(),state,lastAt:clock,covered:ops.map(([,o])=>o.id)};
   if(!disk.setItem(checkpointKey,JSON.stringify(cp)))return false;if(!disk.setItem(checkpointKey+':backup',JSON.stringify(cp)))return false;
   for(const [k]of ops)disk.removeItem(k);
   disk.setItem(checkpointKey,JSON.stringify({...cp,id:id(),covered:[]}));return true;
  };
  if(globalThis.navigator?.locks)return navigator.locks.request('engstien-journal:'+key,run);
  // Independent tabs cannot safely coordinate deletion without Web Locks.
  if(typeof window!=='undefined')return false;
  const prior=queues.get(key)||Promise.resolve(),next=prior.catch(()=>{}).then(run);queues.set(key,next);try{return await next;}finally{if(queues.get(key)===next)queues.delete(key);}
 }
 function schedule(count){if(count<compactAfter||scheduled)return;scheduled=true;const task=()=>{compact().catch(()=>{}).finally(()=>{scheduled=false;});};if(globalThis.requestIdleCallback)requestIdleCallback(task,{timeout:2000});else setTimeout(task,0);}
 return {load(){const result=read();schedule(result.ops.length);return result.state;},compact,get persistent(){return disk.persistent;},append(change){if(!disk.getItem(key))disk.setItem(key,JSON.stringify(base));const current=read(),at=Math.max(now(),last+1,current.clock+1);last=at;const op={...change,at,id:id()};disk.setItem(key+':op:'+op.id,JSON.stringify(op));schedule(current.ops.length+1);return read().state;},subscribe(fn){if(typeof window==='undefined')return ()=>{};let pending=0,previous=JSON.stringify(read().state);const listener=e=>{if((e.key===key||e.key===checkpointKey||e.key===checkpointKey+':backup'||e.key?.startsWith(key+':op:'))&&!pending)pending=setTimeout(()=>{pending=0;const state=read().state,signature=JSON.stringify(state);if(signature!==previous){previous=signature;fn(state);}},0);};window.addEventListener('storage',listener);return ()=>{clearTimeout(pending);window.removeEventListener('storage',listener);};}};
}
