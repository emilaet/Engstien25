import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rooms,initialState,toggleRoom,chargingEstimate,setAllLights,roomLightStatus,houseLightStatus} from '../src/house.js';
import {containsPoint} from '../src/architecture.js';
test('Room tap switches all lamps off when only a table lamp is on, then all on',()=>{const s=initialState();s.stue.lights={loft:false,lampe:true};toggleRoom(s,'stue');assert.deepEqual(s.stue.lights,{loft:false,lampe:false});toggleRoom(s,'stue');assert.deepEqual(s.stue.lights,{loft:true,lampe:true});});
test('Room control leaves other rooms unchanged',()=>{const s=initialState(),original=structuredClone(s.kokken);toggleRoom(s,'stue');assert.deepEqual(s.kokken,original);});
test('Room floor polygons do not overlap, including notches',()=>{
 assert.equal(new Set(rooms.map(r=>r.id)).size,rooms.length);
 const xs=[...new Set(rooms.flatMap(r=>r.polygon.map(p=>p[0])))].sort((a,b)=>a-b);
 const zs=[...new Set(rooms.flatMap(r=>r.polygon.map(p=>p[1])))].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++){
  const x=(xs[i-1]+xs[i])/2,z=(zs[j-1]+zs[j])/2;
  assert.equal(rooms.filter(r=>containsPoint(r.polygon,x,z)).length,1,`Missing or overlapping floor at ${x},${z}`);
 }
});
test('Charging estimates respect target and unavailable power',()=>{assert.equal(chargingEstimate(54,80,75,11),19.5/11);assert.equal(chargingEstimate(85,80,75,11),0);assert.equal(chargingEstimate(54,80,75,0),null);});

test('Whole-house lighting includes separate lamps and preserves heating, dimming and curtains',()=>{
 const s=initialState(),before=structuredClone(s);
 for(const on of [false,true]){
  setAllLights(s,on);
  for(const id of Object.keys(s)){
   assert.ok(Object.values(s[id].lights).every(value=>value===on));
   assert.equal(s[id].target,before[id].target);assert.equal(s[id].current,before[id].current);
   assert.equal(s[id].brightness,before[id].brightness);assert.deepEqual(s[id].curtains,before[id].curtains);
  }
 }
});
test('Partial room state is separate from all-on and all-off states',()=>{
 const s=initialState();setAllLights(s,true);s.stue.lights.loft=false;
 assert.deepEqual(roomLightStatus(s.stue),{on:1,total:2,mode:'partial'});
 const house=houseLightStatus(s);assert.equal(house.litRooms,rooms.length);assert.equal(house.on,house.total-1);
 setAllLights(s,false);assert.equal(roomLightStatus(s.stue).mode,'off');assert.equal(houseLightStatus(s).on,0);
 setAllLights(s,true);assert.equal(roomLightStatus(s.stue).mode,'on');
});
