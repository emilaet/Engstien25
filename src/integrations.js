export function remoteFamilyProvider(){
 async function request(action,args){const r=await fetch('/api/family',{method:action?'POST':'GET',headers:action?{'content-type':'application/json'}:{},credentials:'same-origin',body:action?JSON.stringify({action,args}):undefined});if(!r.ok)throw new Error('Forbindelsen til den fælles liste mangler. Genopret forbindelse.');return r.json();}
 const provider={load:()=>request()};for(const action of ['addItem','setDone','editItem','clearCompleted','undo','importNotes'])provider[action]=(...args)=>request(action,args);return provider;
}
