import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildExterior} from '../src/exterior.js';
import {buildStructure} from '../src/structure.js';
import {walls,openingPosition,finishedFloor} from '../src/architecture.js';
test('Full exterior keeps the original window and door openings and a single-pitch roof',()=>{
 const scene=new THREE.Scene(),exterior=buildExterior(scene);assert.equal(exterior.root.visible,false);exterior.setVisible(true);scene.updateMatrixWorld(true);
 for(const w of walls.filter(w=>w.exterior))for(const o of w.openings){const [x,z]=openingPosition(o),dir=new THREE.Vector3(w.axis==='z'?1:0,0,w.axis==='x'?1:0),origin=new THREE.Vector3(x,finishedFloor+o.sill+.25,z).addScaledVector(dir,-.7);const ray=new THREE.Raycaster(origin,dir,0,1.4);assert.equal(ray.intersectObjects(exterior.root.children.filter(m=>m.name===`facade:${w.id}`),true).length,0,`${o.id} must remain open`);}
 const roof=scene.getObjectByName('house-roof');assert.ok(roof);const p=roof.geometry.attributes.position;let front=-Infinity,rear=Infinity;for(let i=0;i<p.count;i++){if(p.getZ(i)>0)front=Math.max(front,p.getY(i));else rear=Math.min(rear,p.getY(i));}assert.ok(front-rear>.7);assert.ok(scene.getObjectByName('roof-fascia:garden'));assert.ok(exterior.root.children.find(m=>m.name==='facade:garden').material.map);
});
test('Exterior closes door leaves, restores planned door swings and generates no floor swing diagrams',()=>{
 const scene=new THREE.Scene(),structure=buildStructure(scene),door=scene.getObjectByName('door-leaf:entrance-door'),angle=door.rotation.y;assert.notEqual(angle,0);structure.setExteriorMode(true);assert.equal(door.rotation.y,0);structure.setExteriorMode(false);assert.equal(door.rotation.y,angle);scene.traverse(node=>assert.ok(!node.name.startsWith('door-swing:')));
});
