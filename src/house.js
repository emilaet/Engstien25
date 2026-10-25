import { floorPixels, toPlan } from './architecture.js';
const roomInfo = [
 ['bad1','Bad ved soveværelse','Bad 1',5.2,true],
 ['sove','Soveværelse','Soveværelse',9.3],
 ['walk','Walk-in','Walk-in',6.3],
 ['kokken','Køkken','Køkken',10.6],
 ['depot','Depot','Depot',1.8],
 ['v1','Værelse 1','Værelse 1',10.3],
 ['v2','Værelse 2','Værelse 2',11.7],
 ['stue','Stue','Stue',22.1],
 ['alrum','Alrum','Alrum',19.1],
 ['gang','Gang','Gang',7.6],
 ['bad2','Gæstebad','Bad 2',4.4,true],
 ['bryggers','Bryggers','Bryggers',6.0],
 ['entre','Entré','Entré',4.1],
 ['kontor','Kontor','Kontor',9.9],
];
export const rooms=roomInfo.map(([id,name,short,area,tile=false])=>{
 const polygon=floorPixels[id].map(toPlan);
 const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]);
 const x=Math.min(...xs),z=Math.min(...zs),w=Math.max(...xs)-x,d=Math.max(...zs)-z;
 return {id,name,short,area,tile,polygon,x,z,w,d,...(id==='stue'?{curtains:['Stort vinduesparti','Smalt havevindue','Gavlvindue']}:{} )};
});
export function initialState(){return Object.fromEntries(rooms.map((r,i)=>[r.id,{lights:{loft:['stue','kokken','alrum'].includes(r.id),lampe:r.id==='stue'},brightness:75,current:Math.round((21+i%3*.3)*10)/10,target:22,curtains:(r.curtains||[]).map(()=>65)}]));}
export function toggleRoom(state,id){const on=Object.values(state[id].lights).some(Boolean);for(const key of Object.keys(state[id].lights))state[id].lights[key]=!on;}
export function chargingEstimate(battery,target,capacity,power){return power>0?Math.max(0,target-battery)/100*capacity/power:null;}
