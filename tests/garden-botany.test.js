import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {gardenLeafGeometry,lavenderHeadGeometry,buildGardenPot} from '../src/garden-botany.js';
import {buildOutdoorFurnishings} from '../src/outdoor-furniture.js';
import {outdoorPlacement,outdoorY} from '../src/outdoor-layout.js';

test('Garden leaves and lavender use thin curved surfaces and separated cupped florets',()=>{
 for(const g of [gardenLeafGeometry(),lavenderHeadGeometry()]){
  assert.equal(g.type,'BufferGeometry');g.computeBoundingBox();assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.02);for(const x of g.attributes.normal.array)assert.ok(Number.isFinite(x));
 }
 const leaf=gardenLeafGeometry();assert.ok(leaf.attributes.position.count<200,'A leaf is reused thousands of times on tablets');
 const lavender=lavenderHeadGeometry();assert.ok(lavender.attributes.position.count>1000&&lavender.attributes.position.count<10000);
});

test('Hydrangea and olive pots have hollow ceramic profiles, branches and veined leaves in bounded material batches',()=>{
 for(const kind of ['hydrangea','olive']){
  const root=buildGardenPot({kind});root.updateMatrixWorld(true);assert.equal(root.getObjectByName('hollow-turned-garden-pot').geometry.type,'LatheGeometry');const leaves=root.getObjectByName('curved-garden-leaves');assert.equal(leaves.material.side,THREE.DoubleSide);assert.ok(leaves.material.bumpMap);assert.ok(root.getObjectByName('garden-branch-network'));let triangles=0;root.traverse(o=>{if(o.isMesh){assert.ok(o.castShadow&&o.receiveShadow);triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});assert.ok(root.children.length<=5);assert.ok(triangles<90000,'Detailed flower petals must not create unbounded meshes');const bounds=new THREE.Box3().setFromObject(root);assert.ok(bounds.min.y>=0&&bounds.max.y<1.5);assert.equal(!!root.getObjectByName('hydrangea-florets'),kind==='hydrangea');
 }
});

test('Detailed garden styling retains the approved physical pot anchors and adds a small bouquet on the dining table',()=>{
 const decor=buildOutdoorFurnishings(new THREE.Scene());for(const [i,p]of outdoorPlacement.pots.entries()){const pot=decor.root.getObjectByName('outdoor-pot-'+i);assert.deepEqual(pot.position.toArray(),[p.x,outdoorY,p.z]);assert.equal(pot.userData.botanical,true);}const bouquet=decor.root.getObjectByName('garden-table-bouquet');assert.ok(bouquet);assert.equal(bouquet.position.y,outdoorY+.775);assert.ok(bouquet.scale.x<.4);assert.equal(decor.root.userData.editable,false);
});
