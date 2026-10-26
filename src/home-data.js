import {createJournal} from './storage.js';
import {initialState,rooms} from './house.js';
export function createDemoHome(storage){
 const journal=createJournal({key:'engstien-v1',initial:initialState,storage,valid:s=>s&&rooms.every(r=>s[r.id]?.lights&&Array.isArray(s[r.id].curtains)&&['target','current','brightness'].every(k=>Number.isFinite(s[r.id][k]))&&Object.values(s[r.id].lights).every(v=>typeof v==='boolean')),reduce(state,op){if(op.kind!=='field'||!state[op.room])return;const target=op.group?state[op.room][op.group]:state[op.room];if(target&&Object.hasOwn(target,op.field))target[op.field]=op.value;}});
 let previous=journal.load();
 return {load(){previous=journal.load();return structuredClone(previous);},save(state){for(const r of rooms){for(const key of ['target','brightness','current'])if(state[r.id][key]!==previous[r.id][key])journal.append({kind:'field',room:r.id,field:key,value:state[r.id][key]});for(const group of ['lights','curtains'])for(const field of Object.keys(state[r.id][group]))if(state[r.id][group][field]!==previous[r.id][group][field])journal.append({kind:'field',room:r.id,group,field,value:state[r.id][group][field]});}previous=journal.load();return structuredClone(previous);},get persistent(){return journal.persistent;},subscribe(fn){return journal.subscribe(value=>{previous=value;fn(structuredClone(value));});}};
}
