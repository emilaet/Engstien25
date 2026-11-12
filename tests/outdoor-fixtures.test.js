import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {walls,finishedFloor} from '../src/architecture.js';
import {cutawayHeight} from '../src/structure.js';
import {siteLights} from '../src/site-lighting.js';
import {buildOutdoorWallLights} from '../src/outdoor-wall-lights.js';
import {buildParkedCar,parkedCarPlacement} from '../src/parked-car.js';
import {carportArea,outdoorY} from '../src/outdoor-layout.js';

test('Exactly three exterior sconces sit outside solid facade sections, with no garden bollards',()=>{
 const sources=siteLights(),wall=walls.find(w=>w.id==='garden');assert.equal(sources.length,3);
 const model=buildOutdoorWallLights(new THREE.Scene());model.root.updateMatrixWorld(true);
 for(const source of sources){
  const [x,y,z]=source.position;assert.ok(z>wall.from[1]+wall.thickness/2);assert.ok(y>1.7);
  assert.equal(wall.openings.some(o=>x>wall.from[0]+o.start&&x<wall.from[0]+o.end&&y>finishedFloor+o.sill&&y<finishedFloor+o.head),false,'A sconce must never cover a window');
  const body=model.root.getObjectByName('wall-sconce:'+source.id),bounds=new THREE.Box3().setFromObject(body);assert.ok(bounds.min.z>=wall.from[1]+wall.thickness/2+.018,'The housing must not be embedded in the brick skin');
  const footprint=model.root.getObjectByName('wall-light-footprint:'+source.id);assert.ok(footprint.position.z>wall.from[1]+wall.thickness/2+.018,'The light footprint must be in front of the brick skin');
 }
 assert.equal(model.root.children.some(m=>m.name.startsWith('bollard:')),false);
});

test('Facade lamps and both light beams follow saved outdoor dimmer state and the wall cutaway',()=>{
 const model=buildOutdoorWallLights(new THREE.Scene()),state={entre:{lights:{ude:true},levels:{ude:100},brightness:80}};
 model.update(state);const source=siteLights()[0],lamp=model.root.getObjectByName(source.id),beam=model.root.getObjectByName('wall-light-footprint:'+source.id),full=lamp.material.emissiveIntensity;
 assert.ok(full>0);assert.ok(beam.visible);assert.ok(beam.material.map.image.data.some((v,i)=>i%4===3&&v>0));
 state.entre.levels.ude=25;model.update(state);assert.equal(lamp.material.emissiveIntensity,full/4);assert.equal(beam.material.opacity,.2);
 model.setCutaway(true);assert.equal(lamp.material.clippingPlanes[0].constant,finishedFloor+cutawayHeight);assert.equal(beam.material.clippingPlanes[0].constant,finishedFloor+cutawayHeight);
 model.setCutaway(false);assert.ok(lamp.material.clippingPlanes[0].constant>3);
 state.entre.lights.ude=false;model.update(state);assert.equal(lamp.material.emissiveIntensity,0);assert.equal(beam.visible,false);
});

test('The backed-in Model Y fits entirely on the left level parking bay, clear of the shed and posts',()=>{
 const scene=new THREE.Scene(),car=buildParkedCar(scene);scene.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(car.root),shed=walls.find(w=>w.id==='shed-east');
 assert.ok(bounds.min.x>shed.from[0]+shed.thickness/2,'Rear bumper must clear the shed');
 assert.ok(bounds.max.x<carportArea.maxX,'Front bumper must remain on the level covered slab');
 assert.ok(bounds.min.z>(carportArea.minZ+carportArea.maxZ)/2,'Use the left bay when facing into the carport');
 assert.ok(bounds.max.z<carportArea.maxZ-.10,'Mirrors must clear the closed side wall');
 assert.ok(Math.abs(bounds.min.y-outdoorY)<.025,'Tyres must rest on the slab');
 assert.ok(bounds.max.y-outdoorY>1.59&&bounds.max.y-outdoorY<1.65);
 assert.equal(car.root.userData.year,2023);assert.equal(car.root.userData.reversed,true);
 assert.ok(car.root.getObjectsByProperty('name','model-y-black-wheel').every(w=>w.getObjectByName('model-y-black-rim').material.color.getHex()<0x303030));
});

test('Model Y wheel arches are genuinely open and the visible cable ends at its left rear charge port',()=>{
 const scene=new THREE.Scene(),car=buildParkedCar(scene);scene.updateMatrixWorld(true);const [x,y,z]=parkedCarPlacement.position,body=car.root.getObjectByName('model-y-white-body');
 const ray=at=>new THREE.Raycaster(new THREE.Vector3(x+at,y+.355,z+2),new THREE.Vector3(0,0,-1),0,4).intersectObject(body);
 assert.equal(ray(-1.445).length,0);assert.equal(ray(1.445).length,0);assert.ok(ray(0).length>0);
 assert.deepEqual(car.cable.userData.to,car.root.userData.chargePort);const bounds=new THREE.Box3().setFromObject(car.cable);assert.ok(bounds.min.y>outdoorY,'Cable must not pass through the paving');
 assert.ok(car.cable.userData.to[0]<x-1.5&&car.cable.userData.to[2]<z,'Charge inlet must be on the left rear quarter');
});
