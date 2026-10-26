import {createJournal} from './storage.js';
/**
 * Family-data boundary. The UI consumes this provider contract rather than
 * Apple Notes, Renosyd or browser storage directly. All sources are DEMO.
 * A future server/HA adapter can implement load/addItem/setDone/clearCompleted.
 */
export const FAMILY_STORAGE_KEY='engstien-family-v1';
export function copenhagenDay(now=new Date()){
 return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function addDays(day,amount){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
export function daysBetween(day,today){return Math.round((Date.parse(day+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);}
export function relativeDay(day,today){const days=daysBetween(day,today);return days===0?'I dag':days===1?'I morgen':days===-1?'I går':days<0?`${-days} dage siden`:`Om ${days} dage`;}
export function formatDay(day,options={day:'numeric',month:'short'}){return new Intl.DateTimeFormat('da-DK',{...options,timeZone:'Europe/Copenhagen'}).format(new Date(day+'T12:00:00Z'));}
function seed(today){return {
 version:1,
 tasks:[
  {id:'task-1',text:'Husk gymnastiktøjet',done:false,due:today,detail:'Til tasken i morgen'},
  {id:'task-2',text:'Bestil filtre til ventilationen',done:false,due:addDays(today,1),detail:'Tjek størrelsen først'},
  {id:'task-3',text:'Book tid til dækskifte',done:false,due:addDays(today,3),detail:''},
  {id:'task-4',text:'Vand planterne',done:true,due:today,detail:''},
 ],
 shopping:[
  {id:'shop-1',text:'Havremælk',done:false,detail:'2 kartoner'},
  {id:'shop-2',text:'Æg',done:false,detail:'1 bakke'},
  {id:'shop-3',text:'Rugbrød',done:false,detail:''},
  {id:'shop-4',text:'Bananer',done:false,detail:''},
  {id:'shop-5',text:'Kaffe',done:false,detail:''},
  {id:'shop-6',text:'Opvasketabs',done:true,detail:''},
 ],
};}
function validStored(value){return value?.version===1&&['tasks','shopping'].every(key=>Array.isArray(value[key])&&value[key].every(item=>typeof item.id==='string'&&typeof item.text==='string'&&typeof item.done==='boolean'&&(!item.detail||typeof item.detail==='string')&&(!item.due||/^\d{4}-\d{2}-\d{2}$/.test(item.due))));}
export function createDemoFamilyProvider({storage,now=()=>new Date(),createId=()=>crypto.randomUUID()}={}){
 const journal=createJournal({key:FAMILY_STORAGE_KEY,initial:()=>seed(copenhagenDay(now())),valid:validStored,storage,now:()=>now().getTime(),reduce(state,op){
  if(!['tasks','shopping'].includes(op.list))return;
  if(op.kind==='add'&&!state[op.list].some(i=>i.id===op.item.id))state[op.list].unshift(op.item);
  if(op.kind==='setDone'){const item=state[op.list].find(i=>i.id===op.itemId);if(item)item.done=op.done;}
  if(op.kind==='edit'){const item=state[op.list].find(i=>i.id===op.itemId);if(item)Object.assign(item,op.patch);}
  if(op.kind==='remove')state[op.list]=state[op.list].filter(i=>!op.items.some(old=>old.id===i.id));
  if(op.kind==='restore')for(const item of op.items)if(!state[op.list].some(i=>i.id===item.id))state[op.list].push(item);
 }});
 let scenario='normal',undo=null;
 function snapshot(){const today=copenhagenDay(now());return {...journal.load(),today,mode:'demo',persistence:journal.persistent?'device':'memory',updatedAt:now().toISOString(),
  sources:{tasks:{name:'Huskeliste',status:'demo'},shopping:{name:'Apple Noter',status:'demo'},waste:{name:'Renosyd',status:scenario==='offline'?'offline':'demo'}},
  waste:scenario==='empty'?[]:[{id:'waste-rest-food',date:addDays(today,scenario==='today'?0:1),fractions:['rest','food'],label:'Rest- og madaffald'},{id:'waste-plastic-cartons',date:addDays(today,4),fractions:['plasticCartons'],label:'Plast og kartoner'},{id:'waste-paper-card',date:addDays(today,8),fractions:['paper','cardboard'],label:'Papir og pap'},{id:'waste-glass-metal',date:addDays(today,11),fractions:['glassMetal'],label:'Glas og metal'}],canUndo:!!undo};}
 const check=list=>{if(!['tasks','shopping'].includes(list))throw new Error('Ukendt liste.');};
 const text=value=>{const clean=typeof value==='string'?value.trim().replace(/\s+/g,' '):'';if(!clean||clean.length>120)throw new Error('Skriv et punkt på 1–120 tegn.');return clean;};
 return {
  async load(){return snapshot();},
  async addItem(list,value){check(list);journal.append({kind:'add',list,item:{id:createId(),text:text(value),done:false,detail:''}});return snapshot();},
  async setDone(list,id,done){check(list);if(!journal.load()[list].some(i=>i.id===id))throw new Error('Punktet findes ikke længere.');journal.append({kind:'setDone',list,itemId:id,done:!!done});return snapshot();},
  async editItem(list,id,patch){check(list);const item=journal.load()[list].find(i=>i.id===id);if(!item)throw new Error('Punktet findes ikke længere.');const next={text:text(patch.text??item.text),detail:String(patch.detail??item.detail??'').slice(0,120)};if(patch.due!==undefined){if(patch.due&&(!/^\d{4}-\d{2}-\d{2}$/.test(patch.due)||!Number.isFinite(Date.parse(patch.due+'T12:00:00Z'))||new Date(patch.due+'T12:00:00Z').toISOString().slice(0,10)!==patch.due))throw new Error('Vælg en gyldig dato.');next.due=patch.due;}journal.append({kind:'edit',list,itemId:id,patch:next});return snapshot();},
  async clearCompleted(list){check(list);const items=journal.load()[list].filter(i=>i.done);if(items.length){undo={kind:'restore',list,items};journal.append({kind:'remove',list,items});}return snapshot();},
  async undo(){if(undo){journal.append(undo);undo=null;}return snapshot();},
  async setScenario(value){scenario=value;return snapshot();},
  subscribe(fn){return journal.subscribe(()=>fn(snapshot()));},
 };
}
