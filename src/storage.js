// Keep working when browser storage is unavailable. Never report memory as saved.
export function safeStorage(storage){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 const memory=new Map();let persistent=!!storage;
 return {
  get persistent(){return persistent;},
  getItem(key){if(memory.has(key))return memory.get(key);try{return storage?.getItem(key)??null;}catch{persistent=false;return null;}},
  setItem(key,value){memory.set(key,value);try{if(!storage)throw new Error();storage.setItem(key,value);return true;}catch{persistent=false;return false;}},
  removeItem(key){memory.delete(key);try{storage?.removeItem(key);}catch{persistent=false;}},
  entries(prefix){const entries=new Map();try{for(let i=0;i<(storage?.length||0);i++){const key=storage.key(i);if(key?.startsWith(prefix))entries.set(key,storage.getItem(key));}}catch{persistent=false;}for(const [k,v]of memory)if(k.startsWith(prefix))entries.set(k,v);return [...entries];},
 };
}
export function createJournal({key,initial,valid=()=>true,reduce,storage,now=()=>Date.now(),id=()=>crypto.randomUUID()}){
 const disk=safeStorage(storage);let base;
 try{const parsed=JSON.parse(disk.getItem(key));if(valid(parsed))base=parsed;}catch{}
 base??=initial();
 function load(){let state=structuredClone(base);try{const shared=JSON.parse(disk.getItem(key));if(valid(shared))state=shared;}catch{}
  const ops=disk.entries(key+':op:').map(([,v])=>{try{return JSON.parse(v);}catch{return null;}}).filter(o=>o&&Number.isFinite(o.at)&&typeof o.id==='string').sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  for(const op of ops){try{reduce(state,op);}catch{/* Ignore invalid records without losing other entries. */}}
  return state;
 }
 let last=0;
 return {load,get persistent(){return disk.persistent;},append(change){if(!disk.getItem(key))disk.setItem(key,JSON.stringify(base));const clock=disk.entries(key+':op:').reduce((max,[,v])=>{try{return Math.max(max,JSON.parse(v).at||0);}catch{return max;}},0);const at=Math.max(now(),last+1,clock+1);last=at;const op={...change,at,id:id()};disk.setItem(key+':op:'+op.id,JSON.stringify(op));return load();},subscribe(fn){if(typeof window==='undefined')return ()=>{};const listener=e=>{if(e.key===key||e.key?.startsWith(key+':op:'))fn(load());};window.addEventListener('storage',listener);return ()=>window.removeEventListener('storage',listener);}};
}
