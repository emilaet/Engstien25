import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
const asset=await readFile(new URL('../src/assets/tesla-model-y.glb',import.meta.url));
const assetBuffer=()=>asset.buffer.slice(asset.byteOffset,asset.byteOffset+asset.byteLength);
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

test('The detailed Model Y fits on the left level parking bay and its tyres touch the slab',async()=>{
 const scene=new THREE.Scene(),car=await buildParkedCar(scene,assetBuffer());scene.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(car.root),shed=walls.find(w=>w.id==='shed-east');
 assert.ok(bounds.min.x>shed.from[0]+shed.thickness/2,'Rear bumper must clear the shed');
 assert.ok(bounds.max.x<carportArea.maxX,'Front bumper must remain on the level covered slab');
 assert.ok(bounds.min.z>(carportArea.minZ+carportArea.maxZ)/2,'Use the left bay when facing into the carport');
 assert.ok(bounds.max.z<carportArea.maxZ-.10,'Mirrors must clear the closed side wall');
 assert.ok(Math.abs(bounds.min.y-outdoorY)<.025,'Tyres must rest on the slab');
 assert.ok(bounds.max.y-outdoorY>1.59&&bounds.max.y-outdoorY<1.65);
 assert.equal(car.root.userData.year,2023);assert.equal(car.root.userData.reversed,true);
 assert.ok(car.root.getObjectByName('model-y-wheels').material.color.getHex()<0x303030);assert.equal(car.root.getObjectByName('model-y-body').material.color.getHex(),0xf5f5f2);
});

test('The compressed real Model Y retains exterior detail and hides every car and cable mesh together',async()=>{
 const scene=new THREE.Scene(),car=await buildParkedCar(scene,assetBuffer());scene.updateMatrixWorld(true);const [x,,z]=parkedCarPlacement.position;
 let triangles=0,meshes=0;car.root.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;}});
 assert.ok(triangles>20000&&triangles<150000);assert.ok(meshes<=20);assert.ok(asset.byteLength<750000,'Model must stay small enough for the encrypted dashboard');
 assert.deepEqual(car.cable.userData.to,car.root.userData.chargePort);const bounds=new THREE.Box3().setFromObject(car.cable);assert.ok(bounds.min.y>outdoorY,'Cable must not pass through the paving');
 assert.ok(car.cable.userData.to[0]<x-1.5&&car.cable.userData.to[2]<z,'Charge inlet must be on the left rear quarter');
 assert.equal(car.presentation.children.includes(car.root),true);assert.equal(car.presentation.children.includes(car.cable),true);assert.ok(car.presentation.getObjectByName('model-y-charging-plug'));
 car.setVisible(false);assert.equal(car.presentation.visible,false);assert.equal(scene.children.length,1,'Nothing from the car may remain outside the hidden group');
 car.setVisible(true);assert.equal(car.presentation.visible,true);
});
