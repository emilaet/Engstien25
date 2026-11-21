import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {broadLeafGeometry,buildBotanicalPlant} from '../src/botanical-plant.js';
import {buildLawnDetail,isLawnDetailPoint} from '../src/lawn-detail.js';
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
 const lawn=buildLawnDetail(new THREE.Group()),mesh=lawn.mesh;assert.equal(mesh.visible,false);assert.ok(mesh.userData.roots.length>50000&&mesh.userData.roots.length<100000);for(const [x,y,z]of mesh.userData.roots){assert.ok(isLawnDetailPoint(x,z));assert.ok(Math.abs(y-(lawnHeight(x)-.001))<1e-6);}assert.equal(isLawnDetailPoint(14,12.5),false);assert.equal(isLawnDetailPoint(15,13.4),false);assert.equal(isLawnDetailPoint(15.4,14),false);assert.ok(mesh.isInstancedMesh);mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.max.z-mesh.geometry.boundingBox.min.z>.04);for(const n of mesh.geometry.attributes.normal.array)assert.ok(Number.isFinite(n));
 lawn.update('mower','detailed');const high=mesh.count;assert.equal(mesh.visible,true);assert.ok(high*mesh.geometry.index.count/3<2500000);lawn.update('mower','standard');const standard=mesh.count;lawn.update('mower','light');assert.ok(mesh.count<standard&&standard<high);lawn.update('rooms','standard');assert.equal(mesh.visible,false);lawn.update('rooms','standard',true);const full=mesh.count;assert.equal(mesh.visible,true);lawn.update('rooms','light',true);assert.ok(mesh.count<full);
});

test('The approved vacuum-and-plant composition fits narrow screens while its camera stays inside the living room',()=>{
 const scene=new THREE.Scene(),robots=buildRobotModels(scene),furniture=buildFurnishings(scene,initialFurnishing());scene.updateMatrixWorld(true);const plant=furniture.get('stue-plant'),bounds=new THREE.Box3().setFromObject(robots.vacuum).union(new THREE.Box3().setFromObject(plant)),samples=[];
 for(const root of [robots.vacuum,plant])root.traverse(o=>{if(o.isMesh&&o.visible){const a=o.geometry.attributes.position;for(let n=0;n<a.count;n+=6)samples.push(new THREE.Vector3().fromBufferAttribute(a,n).applyMatrix4(o.matrixWorld));}});
 for(const aspect of [.85,1.1,1.8]){const camera=new THREE.PerspectiveCamera(robotFieldOfView('vacuum',aspect),aspect,.1,500),frame=frameRobotCamera(camera,bounds,'vacuum',{compositionTarget:bounds.getCenter(new THREE.Vector3()),samples});assert.ok(frame.extent<=.821);assert.ok(camera.position.z>3.4,'Camera must stay in front of the suite wall');assert.ok(camera.position.distanceTo(frame.target)<5.5);}assert.equal(robotFieldOfView('mower',.85),25);assert.equal(robotFieldOfView('charger',.85),25);furniture.dispose();
});
