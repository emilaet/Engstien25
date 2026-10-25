import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {rooms} from '../src/house.js';
import {walls,doors,windows,passages,wallSections,openingPosition,containsPoint,finishedFloor} from '../src/architecture.js';
import {buildStructure} from '../src/structure.js';
const room=id=>rooms.find(r=>r.id===id);
const wall=id=>walls.find(w=>w.id===id);

test('Bath 1 is reached from the bedroom, suite entrance from living via walk-in',()=>{
 assert.deepEqual(doors.find(d=>d.id==='bath1-door').rooms,['sove','bad1']);
 assert.deepEqual(doors.find(d=>d.id==='suite-door').rooms,['stue','walk']);
 const suite=wall('suite-living');assert.equal(suite.openings.length,1);
 assert.ok(openingPosition(suite.openings[0])[0]>room('walk').x);
 assert.equal(wall('bath-bedroom').openings.length,1);
 const p=passages.find(p=>p.id==='bedroom-walk-passage');assert.equal(p.kind,'passage');assert.equal(p.head,'ceiling');
});
test('Guest bath, utility and office have distinct openings; entry to hall is open',()=>{
 for(const id of ['bath2-door','utility-door','office-door'])assert.ok(doors.find(d=>d.id===id));
 // No wall across the open hall/entrance boundary.
 const e=room('entre');assert.ok(!walls.some(w=>w.axis==='x'&&Math.abs(w.from[1]-e.z)<.01&&w.to[0]>e.x&&w.from[0]<e.x+e.w));
 const office=room('kontor');assert.equal(office.polygon.length,6);
 assert.ok(containsPoint(office.polygon,office.x+.2,office.z+.8));
 assert.ok(!containsPoint(office.polygon,office.x+.2,office.z+office.d-.2));
});
test('Window schedule matches plan: two bedroom windows, no invented rear window in bedroom 2',()=>{
 assert.equal(windows.filter(w=>w.wall==='rear'&&w.room==='sove').length,2);
 assert.equal(windows.filter(w=>w.wall==='rear').length,6);
 assert.equal(windows.filter(w=>w.room==='v2'&&w.wall==='rear').length,0);
 assert.ok(windows.find(w=>w.room==='v2'&&w.wall==='east'));
 const narrow=windows.find(w=>w.id==='garden-living-narrow');assert.equal(narrow.sill,0);assert.ok(narrow.end-narrow.start<1);
 const terrace=windows.find(w=>w.id==='terrace-glazing');assert.equal(terrace.sill,0);assert.equal(terrace.head,3.1);assert.equal(terrace.columns.length,3);assert.equal(terrace.door.panel,0);
});
test('Every scheduled opening is contained in its wall and has no solid in its clear opening',()=>{
 for(const w of walls){
  const sorted=[...w.openings].sort((a,b)=>a.start-b.start);
  for(let i=0;i<sorted.length;i++){
   const o=sorted[i];assert.ok(o.start>=-1e-7&&o.end<=w.length+1e-7,o.id);
   if(i)assert.ok(sorted[i-1].end<=o.start+1e-7,o.id);
   const head=o.head==='ceiling'?2.1:o.head;
   for(const height of [o.sill+.05,(o.sill+head)/2,head-.05]){
    assert.ok(!wallSections(w).some(s=>(o.start+o.end)/2>s.start&&(o.start+o.end)/2<s.end&&height>s.bottom&&(s.top==='ceiling'||height<s.top)),`${o.id} obstructed at ${height}`);
   }
  }
 }
});
test('Rendered walls really have holes, not glass placed in front of opaque solids',()=>{
 const scene=new THREE.Scene();buildStructure(scene);scene.updateMatrixWorld(true);
 for(const w of walls){
  const solids=scene.getObjectByName(`wall:${w.id}`);
  for(const o of w.openings){
   const [x,z]=openingPosition(o),height=o.sill+.25;
   const origin=new THREE.Vector3(x,finishedFloor+height,z);const dir=new THREE.Vector3(w.axis==='z'?1:0,0,w.axis==='x'?1:0);
   origin.addScaledVector(dir,-.5);
   const ray=new THREE.Raycaster(origin,dir,0,1);
   assert.equal(ray.intersectObject(solids,true).length,0,`${o.id} still has an opaque wall across its opening`);
  }
 }
});
test('Open living/dining/kitchen has no optional alcove or accidental partitions',()=>{
 const stue=room('stue'),alrum=room('alrum');
 assert.ok(!walls.some(w=>w.axis==='z'&&w.from[0]>stue.x+.01&&w.from[0]<alrum.x+alrum.w-.01&&w.to[1]>stue.z+.01));
});
test('Rendered door leaves swing into the rooms shown by the drawing arcs',()=>{
 const scene=new THREE.Scene();buildStructure(scene);scene.updateMatrixWorld(true);
 const destinations={
  'bath1-door':'bad1','suite-door':'walk','pantry-door':'kokken',
  'bedroom1-door':'v1','bedroom2-door':'v2','bath2-door':'bad2',
  'utility-door':'bryggers','office-door':'kontor','entrance-door':'entre',
 };
 for(const [id,roomId] of Object.entries(destinations)){
  const o=doors.find(d=>d.id===id),leaf=scene.getObjectByName(`door-leaf:${id}`);
  const p=leaf.localToWorld(new THREE.Vector3((o.hinge==='end'?-1:1)*(o.end-o.start)*.8,.1,0));
  assert.ok(containsPoint(room(roomId).polygon,p.x,p.z),`${id} opens towards the wrong room`);
 }
 const terrace=windows.find(o=>o.id==='terrace-glazing');
 const leaf=scene.getObjectByName('door-leaf:terrace-door');
 const p=leaf.localToWorld(new THREE.Vector3((terrace.end-terrace.start)*.25*.8,.1,0));
 assert.ok(p.z>wall('garden').from[1],'Terrace door must open outwards');
});
