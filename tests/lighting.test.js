import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {initialState,setAllLights} from '../src/house.js';
import {initialFurnishing} from '../src/furnishing-data.js';
import {lightLayout,sourceStrength,lightFalloff} from '../src/lighting-data.js';
import {buildRoomLighting} from '../src/room-lighting.js';
import {createDemoHome} from '../src/home-data.js';
import {solarAltitude,resolveAppearance} from '../src/appearance.js';
import {carportRoof,buildCarportRoof} from '../src/carport.js';
import {chargerPlacement} from '../src/charger.js';
import {toPlan,finishedFloor} from '../src/architecture.js';
import {buildStructure} from '../src/structure.js';
import {frameOverview} from '../src/camera-framing.js';
const storage=()=>{const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};

test('Solar appearance follows actual season and UTC time without changing lamp state',()=>{
 assert.ok(solarAltitude(new Date('2026-06-21T11:00:00Z'))>50);assert.ok(solarAltitude(new Date('2026-12-21T23:00:00Z'))<0);
 assert.equal(resolveAppearance('auto',new Date('2026-10-29T11:00:00Z')).theme,'light');assert.equal(resolveAppearance('auto',new Date('2026-10-29T19:00:00Z')).theme,'dark');assert.equal(resolveAppearance('day',new Date('2026-10-29T19:00:00Z')).daylight,1);assert.equal(resolveAppearance('night',new Date('2026-10-29T11:00:00Z')).daylight,0);
});
test('Bedroom lamps are independent, follow their actual bedside tables and have local falloff',()=>{
 const snapshot=initialFurnishing(),layout=lightLayout(snapshot),left=layout.find(s=>s.id==='sove:lampe'),right=layout.find(s=>s.id==='sove:lampeRight'),ceiling=layout.find(s=>s.id==='sove:loft');assert.ok(left.position[0]<right.position[0]);assert.ok(ceiling.radius>left.radius);assert.ok(ceiling.power>left.power);
 assert.ok(lightFalloff(left,[left.position[0],.12,left.position[2]])>5*lightFalloff(left,[right.position[0],.12,right.position[2]]));
 const table=snapshot.items.find(i=>i.id==='sove-bedside-left');table.x+=.3;assert.ok(Math.abs(lightLayout(snapshot).find(s=>s.id===left.id).position[0]-left.position[0]-.3)<1e-8);assert.deepEqual(lightLayout(snapshot).find(s=>s.id===right.id),right);
 const state=initialState();setAllLights(state,false);state.sove.lights.lampe=true;assert.ok(sourceStrength(left,state)>0);assert.equal(sourceStrength(right,state),0);state.sove.levels.lampe=0;assert.equal(sourceStrength(left,state),0);
});
test('Rendered light materials receive only their own room lights; off bulbs and halos stop emitting',()=>{
 const scene=new THREE.Scene(),model=buildRoomLighting(scene,initialFurnishing()),bedroom=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial()),living=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial());scene.add(bedroom,living);model.bindArchitecture({root:new THREE.Group()},{sove:bedroom,stue:living});
 const state=initialState();setAllLights(state,false);state.sove.lights.lampe=true;model.update(state);const sove=model.bindings.find(b=>b.mesh===bedroom),stue=model.bindings.find(b=>b.mesh===living);assert.ok(sove.uniforms.roomLightPower.value[0]>0);assert.ok([...stue.uniforms.roomLightPower.value].every(p=>p===0));assert.ok(scene.getObjectByName('light:sove:lampe').userData.strength>0);assert.equal(scene.getObjectByName('glow:sove:lampeRight').visible,false);assert.equal(bedroom.material.emissiveIntensity,1);assert.equal(bedroom.material.emissive.getHex(),0);
 state.sove.lights.lampe=false;state.sove.lights.loft=true;model.update(state);assert.equal(scene.getObjectByName('glow:sove:lampe').visible,false);assert.ok(scene.getObjectByName('light:sove:loft').userData.strength>0);
});
test('Old saved homes gain the right bedside lamp and per-device dimming without losing settings',()=>{
 const disk=storage(),old=initialState();delete old.sove.lights.lampeRight;for(const s of Object.values(old))delete s.levels;old.sove.lights.lampe=true;old.sove.target=23;disk.setItem('engstien-v1',JSON.stringify(old));const a=createDemoHome(disk),b=createDemoHome(disk),left=a.load(),right=b.load();assert.equal(left.sove.lights.lampe,true);assert.equal(left.sove.lights.lampeRight,false);assert.equal(left.sove.target,23);left.sove.levels.lampe=35;a.save(left);right.sove.lights.lampeRight=true;b.save(right);const saved=createDemoHome(disk).load();assert.equal(saved.sove.levels.lampe,35);assert.equal(saved.sove.lights.lampeRight,true);assert.equal(saved.sove.lights.lampe,true);
});
test('Open-plan zones share light, while bedrooms remain isolated and zero dimming can be switched on again',()=>{
 const scene=new THREE.Scene(),model=buildRoomLighting(scene,initialFurnishing()),living=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial()),bedroom=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial());scene.add(living,bedroom);model.bindArchitecture({root:new THREE.Group()},{stue:living,sove:bedroom});const state=initialState();setAllLights(state,false);state.kokken.lights.loft=true;model.update(state);assert.ok(model.bindings.find(b=>b.mesh===living).uniforms.roomLightPower.value[0]>0);assert.ok([...model.bindings.find(b=>b.mesh===bedroom).uniforms.roomLightPower.value].every(v=>v===0));state.sove.levels.lampe=0;setAllLights(state,true);assert.ok(state.sove.levels.lampe>0);
});
test('Carport roof covers the original footprint and never moves the shed charger',()=>{
 assert.deepEqual(carportRoof.from,toPlan([1717,739]));assert.deepEqual(carportRoof.to,toPlan([2247,1267]));const before=chargerPlacement(),roof=buildCarportRoof(new THREE.Scene());assert.equal(roof.root.visible,true);roof.setView({plan:true});assert.equal(roof.root.visible,false);roof.setView({charger:true});assert.equal(roof.root.visible,false);roof.setView({});assert.equal(roof.root.visible,true);assert.deepEqual(chargerPlacement(),before);assert.ok(roof.root.getObjectByName('carport-roof-slab'));
});
test('Lit architectural materials follow the actual wall clipping planes in both viewing modes',()=>{
 const scene=new THREE.Scene(),structure=buildStructure(scene),lights=buildRoomLighting(scene,initialFurnishing());lights.bindArchitecture(structure,{});const clipped=lights.bindings.filter(b=>b.original.clippingPlanes?.length);assert.ok(clipped.length>10);for(const enabled of [false,true]){structure.setCutaway(enabled);lights.syncClipping();for(const b of clipped){assert.equal(b.material.clippingPlanes,b.original.clippingPlanes);assert.equal(b.material.clippingPlanes.length,enabled?1:0);}}
});
test('Furniture shares lit materials within a room, while keeping unrelated bedrooms isolated',()=>{
 const scene=new THREE.Scene(),lights=buildRoomLighting(scene,initialFurnishing()),root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),meshes=[];for(const room of ['sove','sove','v1']){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);mesh.userData.room=room;root.add(mesh);meshes.push(mesh);}scene.add(root);lights.bindFurniture(root);assert.equal(meshes[0].material,meshes[1].material);assert.notEqual(meshes[0].material,meshes[2].material);const state=initialState();setAllLights(state,false);state.sove.lights.lampe=true;lights.update(state);assert.ok(lights.bindings.find(b=>b.material===meshes[0].material).uniforms.roomLightPower.value[0]>0);assert.ok([...lights.bindings.find(b=>b.material===meshes[2].material).uniforms.roomLightPower.value].every(v=>v===0));
});
test('Overview framing centres the house across viewports, including the taller Full roof',()=>{
 for(const fov of [25,35])for(const aspect of [.6,.85,1.2,1.8,2.4]){const camera=new THREE.PerspectiveCamera(fov,aspect,.1,150);const framed=frameOverview(camera);assert.ok(framed.extent<.99,'cropped overview at aspect '+aspect);const first=camera.position.clone();frameOverview(camera);assert.ok(camera.position.distanceTo(first)<1e-8,'resizing must not accumulate zoom');const full=frameOverview(camera,undefined,{full:true});assert.ok(full.extent<.93);assert.ok(Math.abs(full.target.z-framed.target.z)<1,'carport must not pull the view off the house');}
});

test('Ceiling and pendant fixtures stay invisible while their light contribution stays active',()=>{
 const scene=new THREE.Scene(),lighting=buildRoomLighting(scene,initialFurnishing()),state=initialState();setAllLights(state,true);lighting.update(state);
 for(const source of lighting.sources){const fixture=scene.getObjectByName('light:'+source.id);assert.equal(fixture.visible,source.fixtureVisible===true,source.id);assert.equal(fixture.userData.strength,sourceStrength(source,state),source.id);assert.ok(fixture.userData.strength>0);}
});
test('Shed walls and door retain full height and black cladding in the house cutaway',()=>{
 const scene=new THREE.Scene(),structure=buildStructure(scene);structure.setCutaway(true);
 for(const name of ['shed-north','shed-east','carport-west','carport-south']){
  const group=structure.root.getObjectByName('wall:'+name),solid=group.getObjectByName('solid:'+name);assert.ok(solid);assert.equal(solid.material.clippingPlanes?.length||0,0);assert.ok(solid.material.color.getHex()<0x404040);assert.ok(group.children.some(c=>c.name==='cladding:'+name));
 }
 const door=structure.root.getObjectByName('leaf:shed-door');assert.equal(door.material.clippingPlanes?.length||0,0);assert.ok(door.material.color.getHex()<0x404040);
 const roof=buildCarportRoof(scene).root.getObjectByName('carport-roof-slab');assert.ok(roof.material.transparent&&roof.material.opacity<.2);assert.equal(roof.castShadow,false);
});
test('Black boards stop exactly at the shed doorway, including partial end boards',()=>{
 const scene=new THREE.Scene(),structure=buildStructure(scene),wall=structure.root.getObjectByName('wall:shed-east');structure.root.updateMatrixWorld(true);
 const door=structure.root.getObjectByName('opening:shed-door'),x=door.position.x,start=door.position.z,end=start+door.userData.width;
 for(const z of [start+.002,start+.03,end-.03,end-.002]){const ray=new THREE.Raycaster(new THREE.Vector3(x+1,1,z),new THREE.Vector3(-1,0,0),0,2);assert.equal(ray.intersectObject(wall,true).length,0,'board obstructs doorway at '+z);}
});

test('Visible lamps rest on their actual support; hiding a table never leaves a floating fixture',()=>{
 const snapshot=initialFurnishing(),scene=new THREE.Scene(),lighting=buildRoomLighting(scene,snapshot);
 for(const source of lighting.sources.filter(s=>s.fixtureVisible)){
  const fixture=scene.getObjectByName('light:'+source.id),base=fixture.children.find(child=>child.isMesh),bottom=fixture.position.y+base.position.y-.011;
  assert.ok(Math.abs(bottom-source.supportHeight)<1e-8,source.id+' floats above its support');
  const support=snapshot.items.find(item=>item.id===source.supportId);assert.ok(support?.visible);
  if(source.kind==='table')assert.ok(Math.abs(source.supportHeight-(finishedFloor+support.height))<1e-8);
 }
 snapshot.items.find(item=>item.id==='sove-bedside-left').visible=false;
 const updated=buildRoomLighting(new THREE.Scene(),snapshot);assert.equal(updated.root.getObjectByName('light:sove:lampe').visible,false);assert.equal(updated.root.getObjectByName('light:sove:lampeRight').visible,true);
});
test('Outdoor light is independent, migrates off, and never illuminates an indoor bedroom',()=>{
 const scene=new THREE.Scene(),lighting=buildRoomLighting(scene,initialFurnishing()),bedroom=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial()),outside=new THREE.Group(),deck=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial());outside.add(deck);scene.add(bedroom,outside);lighting.bindArchitecture({root:new THREE.Group()},{sove:bedroom});lighting.bindOutdoor(outside);
 const state=initialState();setAllLights(state,false);state.entre.lights.ude=true;const active=lighting.update(state);
 assert.ok(active.some(id=>id.startsWith('entre:ude:')));assert.ok([...lighting.bindings.find(b=>b.mesh===bedroom).uniforms.roomLightPower.value].every(v=>v===0));assert.ok([...lighting.bindings.find(b=>b.mesh===deck).uniforms.roomLightPower.value].some(v=>v>0));
 const disk=storage(),old=initialState();delete old.entre.lights.ude;delete old.entre.levels.ude;disk.setItem('engstien-v1',JSON.stringify(old));const migrated=createDemoHome(disk).load();assert.equal(migrated.entre.lights.ude,false);assert.equal(migrated.entre.levels.ude,100);
});
test('All house walls share the same lower cutaway height',()=>{
 const model=buildStructure(new THREE.Scene());
 for(const enabled of [false,true]){model.setCutaway(enabled);for(const [id,height]of [['rear',1.05],['west',1.05],['garden',1.05],['east',1.05],['bedrooms',1.05]]){const material=model.root.getObjectByName('solid:'+id).material;assert.equal(material.clippingPlanes.length,enabled?1:0);if(enabled)assert.equal(material.clippingPlanes[0].constant,finishedFloor+height);}}
 const leaf=model.root.getObjectByName('door-leaf:shed-door'),before=leaf.rotation.y;model.setChargerView(true);assert.equal(leaf.rotation.y,0);model.setChargerView(false);assert.equal(leaf.rotation.y,before);
});
