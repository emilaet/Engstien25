import {safeStorage} from './storage.js';
export const notesStorageKey='engstien-apple-notes-v1';
const lists=['tasks','shopping'];
const digest=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0).toString(36);};
export function normalizeNotesSnapshot(value,now=new Date()){
 if(!value||value.version!==1||!lists.every(k=>typeof value[k]==='string'||Array.isArray(value[k])))throw Error('Vælg en Notes-fil med både huskeliste og handleliste.');
 const updatedAt=value.updatedAt||now.toISOString();if(!Number.isFinite(Date.parse(updatedAt))||Date.parse(updatedAt)>now.getTime()+300000)throw Error('Notes-filens dato er ugyldig.');
 const result={version:1,updatedAt:new Date(updatedAt).toISOString(),receivedAt:now.toISOString(),source:'apple-notes'};
 for(const key of lists){
  const raw=typeof value[key]==='string'?value[key].split(/\r?\n/).map(s=>s.trim()).filter(Boolean):value[key];
  if(raw.length>500)throw Error('En note må højst indeholde 500 punkter.');
  const counts=new Map();result[key]=raw.flatMap((entry,index)=>{
   let text,done=false,completionKnown=false;
   if(typeof entry==='string'){const mark=entry.match(/^\s*(?:[-*•]\s*)?(\[[ xX]\]|[☐☑✓✔])\s*/);done=!!mark&&/x|X|☑|✓|✔/.test(mark[1]);completionKnown=!!mark;text=entry.replace(/^\s*(?:[-*•]\s*)?(?:\[[ xX]\]|[☐☑✓✔])?\s*/,'').trim();if(index===0&&[key==='tasks'?'huskeliste':'handleliste',value[key+'Title']?.toLocaleLowerCase('da')].includes(text.toLocaleLowerCase('da')))return [];}
   else if(entry&&typeof entry.text==='string'){text=entry.text.trim();if(entry.done!==undefined&&typeof entry.done!=='boolean')throw Error('Et punkt har en ugyldig afkrydsning.');done=entry.done===true;completionKnown=entry.completionKnown!==false&&typeof entry.done==='boolean';}
   else throw Error('Notes-filen indeholder et ugyldigt punkt.');
   if(!text)return [];if(text.length>500)throw Error('Et punkt må højst være 500 tegn.');const at=counts.get(text)||0;counts.set(text,at+1);return [{id:'notes-'+key+'-'+digest(text+'\0'+at),text,done,detail:'',completionKnown}];
  });
 }
 return result;
}
export function createNotesStore(storage,{now=()=>new Date()}={}){
 const disk=safeStorage(storage);
 function read(){try{const text=disk.getItem(notesStorageKey);if(!text)return null;const raw=JSON.parse(text),snapshot=normalizeNotesSnapshot(raw,now());if(Number.isFinite(Date.parse(raw.receivedAt)))snapshot.receivedAt=raw.receivedAt;return snapshot;}catch{return null;}}
 return {read,import(value){const snapshot=normalizeNotesSnapshot(value,now()),old=read();if(old&&Date.parse(snapshot.updatedAt)<Date.parse(old.updatedAt))throw Error('Denne Notes-fil er ældre end den seneste synkronisering.');if(!disk.setItem(notesStorageKey,JSON.stringify(snapshot)))throw Error('Noterne kunne ikke gemmes på denne enhed.');return snapshot;},subscribe(fn){if(typeof window==='undefined')return ()=>{};const listener=e=>{if(e.key===notesStorageKey)fn();};window.addEventListener('storage',listener);return ()=>window.removeEventListener('storage',listener);}};
}
