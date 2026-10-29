import { floorPixels, toPlan } from './architecture.js';
const roomInfo = [
 ['bad1','Bad ved soveværelse','Bad 1',5.2,true],
 ['sove','Soveværelse','Soveværelse',9.3],
 ['walk','Walk-in','Walk-in',6.3],
 ['kokken','Køkken','Køkken',10.6],
 ['depot','Depot','Depot',1.8],
 ['v1','Lucas’ værelse','Lucas',10.3],
 ['v2','Sophias værelse','Sophia',11.7],
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
export function initialState(){return Object.fromEntries(rooms.map((r,i)=>{const lights={loft:['stue','kokken','alrum'].includes(r.id),lampe:r.id==='stue',...(r.id==='sove'?{lampeRight:false}:{})};return [r.id,{lights,levels:Object.fromEntries(Object.keys(lights).map(key=>[key,100])),brightness:75,current:Math.round((21+i%3*.3)*10)/10,target:22,curtains:(r.curtains||[]).map(()=>65)}];}));}
export function toggleRoom(state,id){const on=Object.values(state[id].lights).some(Boolean);for(const key of Object.keys(state[id].lights))state[id].lights[key]=!on;}
export function chargingEstimate(battery,target,capacity,power){return power>0?Math.max(0,target-battery)/100*capacity/power:null;}

export function roomLightStatus(roomState){
 const values=Object.values(roomState.lights),on=values.filter(Boolean).length;
 return {on,total:values.length,mode:on===0?'off':on===values.length?'on':'partial'};
}
export function houseLightStatus(state){
 const lamps=Object.values(state).flatMap(s=>Object.values(s.lights));
 const on=lamps.filter(Boolean).length;
 return {on,total:lamps.length,litRooms:Object.values(state).filter(s=>Object.values(s.lights).some(Boolean)).length};
}
export function setAllLights(state,on){
 for(const s of Object.values(state))for(const key of Object.keys(s.lights)){s.lights[key]=on;if(on&&s.levels?.[key]===0)s.levels[key]=100;}
}
