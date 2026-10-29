import {initialFurnishing} from './furnishing-data.js';
import {rooms} from './house.js';
import {ceilingHeight,finishedFloor} from './architecture.js';

const names={sove:['Sengelampe venstre','Sengelampe højre'],stue:['Gulvlampe'],kokken:['Arbejdslys'],alrum:['Spisebordslampe'],walk:['Skabslys'],depot:['Hyldelys'],bad1:['Spejllys'],bad2:['Spejllys'],bryggers:['Arbejdslys'],entre:['Spejllys'],gang:['Væglys'],kontor:['Skrivebordslampe'],v1:['Sengelampe'],v2:['Sengelampe']};
export function lightName(room,key){return key==='loft'?'Loftslys':(names[room]?.[key==='lampeRight'?1:0]||'Bordlampe');}
export function normalizedRoomLighting(room,state){const lights={...state.lights};if(room==='sove'&&!Object.hasOwn(lights,'lampeRight'))lights.lampeRight=false;return {...state,lights,levels:Object.fromEntries(Object.keys(lights).map(key=>[key,Math.max(0,Math.min(100,Number.isFinite(state.levels?.[key])?state.levels[key]:100))]))};}
export function normalizeHomeLighting(state){return Object.fromEntries(Object.entries(state).map(([id,s])=>[id,normalizedRoomLighting(id,s)]));}

// Positions derive from the existing furniture, never from generated artwork.
export function lightLayout(snapshot=initialFurnishing()){
 const catalog=new Map(snapshot.items.map(i=>[i.id,i]));
 function at(id,local=[0,0,0]){const i=catalog.get(id);if(!i)return null;const a=i.rotation*Math.PI/180;return [i.x+local[0]*Math.cos(a)+local[2]*Math.sin(a),finishedFloor+local[1],i.z-local[0]*Math.sin(a)+local[2]*Math.cos(a)];}
 return rooms.flatMap(r=>{
  const center=[r.x+r.w/2,finishedFloor+ceilingHeight(r.z+r.d/2)-.1,r.z+r.d/2];
  const generic=[r.x+r.w*.75,finishedFloor+1.35,r.z+r.d*.7];
  let anchors={sove:at('sove-bedside-left',[0,.70,0]),stue:at('stue-armchair',[.42,1.35,.05]),kokken:at('kokken-rear',[0,1.25,-.12]),alrum:at('alrum-dining',[0,1.85,0]),walk:at('walk-east',[.32,1.65,0]),depot:at('depot-shelf',[0,1.5,.13]),bad1:at('bad1-vanity',[0,1.88,-.12]),bad2:at('bad2-vanity',[0,1.88,-.12]),bryggers:at('bryggers-units',[0,1.4,-.05]),entre:at('entre-console',[0,1.85,-.07]),kontor:at('kontor-desk',[-.6,.96,-.12]),v1:at('v1-bench',[0,.53,0]),v2:at('v2-bench',[0,.53,0])};
  const ceiling={id:r.id+':loft',room:r.id,key:'loft',name:'Loftslys',kind:'ceiling',position:center,radius:Math.max(6.5,Math.hypot(r.w,r.d)+1),power:18,kelvin:3000};
  const lamp={id:r.id+':lampe',room:r.id,key:'lampe',name:lightName(r.id,'lampe'),kind:['sove','kontor','v1','v2'].includes(r.id)?'table':r.id==='stue'?'floor':r.id==='alrum'?'pendant':'task',position:anchors[r.id]||generic,radius:['sove','v1','v2'].includes(r.id)?2.25:r.id==='stue'?3.2:3.8,power:r.id==='alrum'?3.5:1.7,kelvin:2700};
  return [ceiling,lamp,...(r.id==='sove'?[{...lamp,id:'sove:lampeRight',key:'lampeRight',name:lightName(r.id,'lampeRight'),position:at('sove-bedside-right',[0,.70,0])||generic}]:[])];
 });
}
export function sourceStrength(source,state){const room=state[source.room];return room?.lights[source.key]?source.power*Math.max(0,Math.min(1,room.brightness/100))*Math.max(0,Math.min(1,(room.levels?.[source.key]??100)/100)):0;}
export function lightFalloff(source,point){const d=Math.hypot(...source.position.map((v,i)=>v-point[i]));return Math.max(0,1-d/source.radius)**2/(.35+d*d);}
