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
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 let state=seed(copenhagenDay(now()));
 try{const saved=JSON.parse(storage?.getItem(FAMILY_STORAGE_KEY)||'null');if(validStored(saved))state=saved;}catch{}
 function snapshot(){const today=copenhagenDay(now());return structuredClone({
  ...state,today,mode:'demo',persistence:storage?'device':'memory',
  sources:{tasks:{name:'Huskeliste',status:'demo'},shopping:{name:'Apple Noter',status:'demo'},waste:{name:'Renosyd',status:'demo'}},
  // Rolling EXAMPLE dates, not predictions of this property's actual schedule.
  waste:[
   {id:'waste-rest-food',date:addDays(today,1),fractions:['rest','food'],label:'Rest- og madaffald'},
   {id:'waste-plastic-cartons',date:addDays(today,4),fractions:['plasticCartons'],label:'Plast og kartoner'},
   {id:'waste-paper-card',date:addDays(today,8),fractions:['paper','cardboard'],label:'Papir og pap'},
   {id:'waste-glass-metal',date:addDays(today,11),fractions:['glassMetal'],label:'Glas og metal'},
  ],
 });}
 async function mutate(change){const next=structuredClone(state);change(next);storage?.setItem(FAMILY_STORAGE_KEY,JSON.stringify(next));state=next;return snapshot();}
 const checkList=list=>{if(!['tasks','shopping'].includes(list))throw new Error('Ukendt liste.');};
 return {
  async load(){return snapshot();},
  async addItem(list,text){checkList(list);const clean=typeof text==='string'?text.trim().replace(/\s+/g,' '):'';if(!clean||clean.length>120)throw new Error('Skriv et punkt på 1–120 tegn.');return mutate(next=>next[list].unshift({id:createId(),text:clean,done:false,detail:''}));},
  async setDone(list,id,done){checkList(list);return mutate(next=>{const item=next[list].find(item=>item.id===id);if(!item)throw new Error('Punktet findes ikke længere.');item.done=Boolean(done);});},
  async clearCompleted(list){checkList(list);return mutate(next=>{next[list]=next[list].filter(item=>!item.done);});},
 };
}
