import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {broadLeafGeometry,buildBotanicalPlant} from '../src/botanical-plant.js';
import {buildLawnDetail,isLawnDetailPoint,isGardenGrassPoint,gardenEdgeFade} from '../src/lawn-detail.js';
import {buildFurnishings} from '../src/furniture.js';
import {initialFurnishing} from '../src/furnishing-data.js';
import {buildRobotModels} from '../src/robot-models.js';
import {frameRobotCamera,robotFieldOfView} from '../src/robot-layout.js';
import {lawnHeight} from '../src/outdoor-layout.js';

test('Botanical leaves are curved thin surfaces with smooth finite normals rather than faceted solid blobs',()=>{
 const geometry=broadLeafGeometry();geometry.computeBoundingBox();assert.ok(geometry.boundingBox.max.z-geometry.boundingBox.min.z>.1);assert.ok(geometry.attributes.position.count>300);for(const n of geometry.attributes.normal.array)assert.ok(Number.isFinite(n));
 const plant=buildBotanicalPlant({color:'#c5b9a3',width:.58,depth:.58,height:1});plant.root.updateMatrixWorld(true);let calls=0,triangles=0;plant.root.traverse(o=>{if(!o.isMesh)return;calls++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});assert.ok(calls<=5);assert.ok(triangles>30000&&triangles<60000);assert.equal(plant.root.getObjectByName('smooth-hollow-ceramic-pot').geometry.type,'LatheGeometry');const leaves=plant.root.getObjectByName('curved-veined-ficus-leaves');assert.ok(leaves.material.map&&leaves.material.bumpMap);assert.equal(leaves.material.side,THREE.DoubleSide);const size=new THREE.Box3().setFromObject(plant.root).getSize(new THREE.Vector3());assert.ok(size.y>.9&&size.y<1.15);assert.ok(size.x<.8&&size.z<.8);
});

test('Removing the editable plant releases its detailed geometry and surface maps',()=>{
 const snapshot=initialFurnishing(),f=buildFurnishings(new THREE.Scene(),snapshot),leaf=f.get('stue-plant').getObjectByName('curved-veined-ficus-leaves');let geometry=false,map=false,bump=false;leaf.geometry.addEventListener('dispose',()=>{geometry=true;});leaf.material.map.addEventListener('dispose',()=>{map=true;});leaf.material.bumpMap.addEventListener('dispose',()=>{bump=true;});f.setSnapshot({...snapshot,items:snapshot.items.filter(i=>i.id!=='stue-plant')});assert.equal(f.get('stue-plant'),undefined);assert.ok(geometry&&map&&bump);f.dispose();
});

test('Living grass is rooted on the real lawn, stays off paving and the dock, and has bounded quality levels',()=>{
 const lawn=buildLawnDetail(new THREE.Group()),mesh=lawn.mesh;assert.ok(lawn.garden.userData.roots.length>40000&&lawn.garden.userData.roots.length<100000);for(const [x,y,z]of lawn.garden.userData.roots){assert.ok(isGardenGrassPoint(x,z));assert.ok(Math.abs(y-(lawnHeight(x)-.001))<1e-6);}assert.equal(gardenEdgeFade(-10,0),0);assert.equal(gardenEdgeFade(0,15),1);assert.equal(isGardenGrassPoint(5,4),false);assert.equal(isGardenGrassPoint(16,10),false);assert.equal(isGardenGrassPoint(8,10),false);assert.equal(mesh.visible,false);assert.ok(mesh.userData.roots.length>50000&&mesh.userData.roots.length<100000);for(const [x,y,z]of mesh.userData.roots){assert.ok(isLawnDetailPoint(x,z));assert.ok(Math.abs(y-(lawnHeight(x)-.001))<1e-6);}assert.equal(isLawnDetailPoint(14,12.5),false);assert.equal(isLawnDetailPoint(15,13.4),false);assert.equal(isLawnDetailPoint(15.4,14),false);assert.ok(mesh.isInstancedMesh);mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z>.04);for(const n of mesh.geometry.attributes.normal.array)assert.ok(Number.isFinite(n));
 lawn.update('mower','detailed');const high=mesh.count;assert.equal(mesh.visible,true);assert.ok(high*mesh.geometry.index.count/3<2500000);lawn.update('mower','standard');const standard=mesh.count;lawn.update('mower','light');assert.ok(mesh.count<standard&&standard<high);lawn.update('rooms','standard');assert.equal(mesh.visible,false);lawn.update('rooms','standard',true);const full=mesh.count,gardenFull=lawn.garden.count;assert.equal(mesh.visible,true);assert.equal(lawn.garden.visible,true);lawn.update('rooms','light',true);assert.ok(mesh.count<full);assert.ok(lawn.garden.count<gardenFull);
});

test('The vacuum itself fills the default frame on phone and tablet without moving the camera behind a room wall',()=>{
 const scene=new THREE.Scene(),robots=buildRobotModels(scene);scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(robots.vacuum),center=bounds.getCenter(new THREE.Vector3());
 for(const aspect of [.75,.85,1.1,1.8]){
  const camera=new THREE.PerspectiveCamera(robotFieldOfView('vacuum',aspect),aspect,.1,500),frame=frameRobotCamera(camera,bounds,'vacuum',{compositionTarget:center});
  assert.ok(frame.extent>.79&&frame.extent<=.821,'The station must occupy the frame rather than shrink to fit a separate plant');assert.ok(camera.position.z>3.4,'Camera must stay in front of the suite wall');assert.ok(camera.position.distanceTo(frame.target)<2.6,'The standard close-up must stay close to the actual product');assert.deepEqual(frame.target.toArray(),center.toArray());
 }
 assert.ok(Math.abs(robotFieldOfView('vacuum',1.8)-30)<1e-10);assert.equal(robotFieldOfView('mower',.85),25);assert.equal(robotFieldOfView('charger',.85),25);
});
