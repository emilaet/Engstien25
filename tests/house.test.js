import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rooms,initialState,toggleRoom,chargingEstimate} from '../src/house.js';
test('Room tap switches all lamps off when only a table lamp is on, then all on',()=>{const s=initialState();s.stue.lights={loft:false,lampe:true};toggleRoom(s,'stue');assert.deepEqual(s.stue.lights,{loft:false,lampe:false});toggleRoom(s,'stue');assert.deepEqual(s.stue.lights,{loft:true,lampe:true});});
test('Room control leaves other rooms unchanged',()=>{const s=initialState(),original=structuredClone(s.kokken);toggleRoom(s,'stue');assert.deepEqual(s.kokken,original);});
test('Model has unique IDs, positive dimensions and no overlapping room interiors',()=>{assert.equal(new Set(rooms.map(r=>r.id)).size,rooms.length);for(const r of rooms){assert.ok(r.w>0&&r.d>0);for(const b of rooms.filter(b=>b!==r)){assert.ok(r.x+r.w<=b.x||b.x+b.w<=r.x||r.z+r.d<=b.z||b.z+b.d<=r.z,`${r.id} overlaps ${b.id}`);}}});
test('Charging estimates respect target and unavailable power',()=>{assert.equal(chargingEstimate(54,80,75,11),19.5/11);assert.equal(chargingEstimate(85,80,75,11),0);assert.equal(chargingEstimate(54,80,75,0),null);});
