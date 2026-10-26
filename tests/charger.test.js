import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chargerPlacement,chargerPulse,buildCharger,carportPostPixels} from '../src/charger.js';
import {doors,walls,openingPosition,finishedFloor} from '../src/architecture.js';
test('Charger is mounted outside the shed wall to the left of the door from the carport',()=>{
 const p=chargerPlacement(),door=doors.find(d=>d.id==='shed-door'),wall=walls.find(w=>w.id===door.wall),[x,endZ]=openingPosition(door,door.end);
 assert.ok(p.position[0]-.105/2>x+wall.thickness/2);assert.ok(p.position[2]-.29/2>endZ);assert.ok(p.position[2]+.29/2<wall.to[1]);assert.equal(p.rotationY,Math.PI/2);assert.ok(p.position[1]-.49/2>finishedFloor);
});
test('Carport retains only end posts, without the middle post',()=>{
 assert.deepEqual(carportPostPixels,[[2247,745],[2247,1262]]);assert.ok(!carportPostPixels.some(([,z])=>z>745&&z<1262));
});
test('Rendered charger includes a green ring that pulses, with stable paused/reduced motion states',()=>{
 const scene=new THREE.Scene(),charger=buildCharger(scene);
 const ring=scene.getObjectByName('charger-status-ring'),halo=scene.getObjectByName('charger-status-halo');assert.ok(ring);assert.ok(halo);
 charger.update(.5,true,false);const high=ring.material.color.clone(),highHalo=halo.material.opacity;charger.update(1.5,true,false);assert.ok(high.g>ring.material.color.g);assert.ok(highHalo>halo.material.opacity);assert.ok(high.g>high.r&&high.g>high.b);
 charger.update(1,true,true);const steady=ring.material.color.clone();charger.update(2,true,true);assert.ok(steady.equals(ring.material.color));
 charger.update(1,false,false);assert.equal(halo.material.opacity,0);assert.equal(chargerPulse(1,false),0);
});
