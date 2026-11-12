import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carportRoof} from '../src/carport.js';
import {interior} from '../src/architecture.js';
import {
 outdoorY,carportArea,driveway,westTerrace,mainTerrace,terracePolygons,
 approachHeight,lawnHeight,insidePolygon,outdoorPlacement,
} from '../src/outdoor-layout.js';

const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-7,message??`${actual} != ${expected}`);
const paved=(x,z)=>terracePolygons.some(polygon=>insidePolygon(x,z,polygon));

test('The approach loses one metre over five metres outside an entirely level covered parking area',()=>{
 // The graded approach begins at the open east edge of the real carport roof,
 // not on the closed garden wall and not inside the covered parking footprint.
 near(driveway.startX,carportRoof.to[0]);
 near(driveway.endX-driveway.startX,5);
 near(approachHeight(driveway.startX)-approachHeight(driveway.endX),1);
 near((approachHeight(driveway.startX)-approachHeight(driveway.endX))/(driveway.endX-driveway.startX),.2);
 for(const x of [carportArea.minX,(carportArea.minX+carportArea.maxX)/2,carportArea.maxX])near(approachHeight(x),outdoorY);
 for(const fraction of [0,.2,.5,.8,1])near(approachHeight(driveway.startX+fraction*5),outdoorY-fraction);
 near(approachHeight(driveway.endX+3),approachHeight(driveway.endX));
});

test('The front lawn follows the driveway grade without moving the level garden or house plateau',()=>{
 for(const x of [carportArea.minX,driveway.startX,driveway.startX+2.5,driveway.endX])near(approachHeight(x)-lawnHeight(x),.065);
 near(lawnHeight(-4),lawnHeight(interior.width/2));
 near(lawnHeight(driveway.startX)-lawnHeight(driveway.endX),1);
 assert.ok(driveway.startX>interior.width,'The ramp belongs east of the house, not on its garden terrace');
 assert.ok(driveway.minZ>=interior.depth,'The driveway aligns with the attached carport');
});

test('The west terrace has a real right-angle cut-out separate from the main patio recess',()=>{
 assert.equal(insidePolygon(-4,8,westTerrace),false,'The far-left garden-facing corner must remain unpaved');
 assert.equal(insidePolygon(-4,7,westTerrace),true,'The rest of the west dining terrace remains');
 assert.equal(insidePolygon(-2.8,8,westTerrace),true,'A narrower connection remains next to the gable');
 assert.equal(insidePolygon(7,11.5,mainTerrace),false,'The separate main patio planter recess remains');
 assert.equal(insidePolygon(8.4,11.5,mainTerrace),true,'The deep lounge paving remains beside that recess');
 for(const polygon of [westTerrace,mainTerrace])for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];
  assert.ok(a[0]===b[0]||a[1]===b[1],'A notch must have square edges, not a diagonal chamfer');
 }
});

test('Connected garden paving leaves a clear route along the facade and stays out of the house and driveway',()=>{
 // This route crosses the narrow west connector, garden strip and large patio.
 // Sampling the union also catches a gap between individually valid polygons.
 for(let x=-2.8;x<15;x+=.08)assert.ok(paved(x,8.25),`Paved route breaks at ${x}`);
 assert.equal(paved(interior.width/2,interior.depth/2),false,'Outdoor paving must not cover an indoor room');
 assert.equal(paved(driveway.startX+2,driveway.minZ+2),false,'The east driveway is a separate graded surface');
 assert.ok(paved(outdoorPlacement.dining.x,outdoorPlacement.dining.z));
 assert.ok(paved(outdoorPlacement.lounge.x,outdoorPlacement.lounge.z));
});

test('Rendered terrace and ramp surfaces preserve the approved openings and actual grade',async()=>{
 const THREE=await import('three');
 const {buildLandscape}=await import('../src/landscape.js');
 const scene=new THREE.Scene(),landscape=buildLandscape(scene);scene.updateMatrixWorld(true);
 const down=(objects,x,z)=>new THREE.Raycaster(new THREE.Vector3(x,5,z),new THREE.Vector3(0,-1,0),0,10).intersectObjects(objects,true)[0];
 const surfaceNear=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-5,`${actual} != ${expected}`);
 for(const point of [outdoorPlacement.dining,outdoorPlacement.lounge,{x:2,z:8.25}]){
  const hit=down(landscape.terraces,point.x,point.z);assert.ok(hit,'The connected level paving must really be rendered');surfaceNear(hit.point.y,outdoorY);
 }
 assert.equal(down(landscape.terraces,-4,8),undefined,'There must be a real mesh cut-out, not a planter over continuous paving');
 assert.equal(down(landscape.terraces,7,11.5),undefined,'The main L recess must also remain unpaved');
 for(const fraction of [.02,.5,.98])for(const z of [driveway.minZ+.5,driveway.maxZ-.5]){
  const x=driveway.startX+fraction*5,hit=down([landscape.driveway],x,z);
  assert.ok(hit,'The approach must have an upward-facing driveable surface');surfaceNear(hit.point.y,outdoorY-fraction);
 }
 for(const fraction of [.02,.5,.98]){
  const x=driveway.startX+fraction*5,hit=down([landscape.terrain],x,3);
  assert.ok(hit);surfaceNear(hit.point.y,lawnHeight(x));
 }
 let meshes=0;landscape.root.traverse(object=>{if(object.isMesh)meshes++;});
 assert.ok(meshes<120,'Plant leaves and grass must remain batched rather than hundreds of separate draw calls');
 assert.ok(landscape.planting.getObjectByName('ornamental-grasses').isInstancedMesh);
});

test('Paving side edges face outward so the real terrace thickness remains visible from the lawn',async()=>{
 const THREE=await import('three');const {buildLandscape}=await import('../src/landscape.js');
 const model=buildLandscape(new THREE.Scene());
 const ray=new THREE.Raycaster(new THREE.Vector3(-5,outdoorY-.03,5),new THREE.Vector3(1,0,0),0,1);
 assert.ok(ray.intersectObject(model.terraces[0]).length>0,'The west outer paving edge must face the lawn');
});

test('Existing outdoor light bindings still respond to on/off and dimmer values in the expanded garden',async()=>{
 const THREE=await import('three');
 const {buildLandscape}=await import('../src/landscape.js');
 const {siteLights}=await import('../src/site-lighting.js');
 const landscape=buildLandscape(new THREE.Scene());
 const state={entre:{lights:{ude:true},levels:{ude:100},brightness:100}};
 landscape.update(state);
 const lamps=siteLights().map(source=>landscape.fixtures.getObjectByName(source.id));
 assert.ok(lamps.length>0);assert.ok(lamps.every(Boolean),'Saved outdoor lamp ids must remain present');
 const full=lamps.map(lamp=>lamp.material.emissiveIntensity);assert.ok(full.every(value=>value>0));
 state.entre.levels.ude=50;landscape.update(state);
 lamps.forEach((lamp,index)=>near(lamp.material.emissiveIntensity,full[index]/2));
 state.entre.lights.ude=false;landscape.update(state);
 assert.ok(lamps.every(lamp=>lamp.material.emissiveIntensity===0));
});

test('Exterior camera presets fit the garden and graded approach on narrow and wide screens without clipping',async()=>{
 const THREE=await import('three');
 const {frameExterior}=await import('../src/camera-framing.js');
 const features={
  garden:[[-4.6,outdoorY,2.8],[-4.6,outdoorY,7.3],[-3.2,outdoorY,8.65],[15.3,outdoorY,12.7],[22.3,2.6,14.2],[-.4,3.3,-.4],[19.8,3.3,-.4],[-6.4,4,2.7]],
  driveway:[[driveway.startX,outdoorY,driveway.minZ],[driveway.endX,outdoorY-1,driveway.maxZ],[15.3,2.5,14.2],[19.8,3.3,0],[27.3,-1,2.2]],
 };
 for(const side of ['garden','driveway'])for(const aspect of [.6,.75,1,1.5,2.4]){
  const camera=new THREE.PerspectiveCamera(25,aspect,.1,500),framing=frameExterior(camera,{side});
  assert.ok(camera.position.distanceTo(framing.target)<300,`${side} must fit without hitting the exterior orbit limit at aspect ${aspect}`);
  assert.ok(framing.extent<.96,`${side} fit failed at aspect ${aspect}`);
  for(const position of features[side]){
   const projected=new THREE.Vector3(...position).project(camera);
   assert.ok(Math.abs(projected.x)<.98&&Math.abs(projected.y)<.94,`${side} feature ${position} clips at aspect ${aspect}`);
   assert.ok(projected.z>-1&&projected.z<1,`${side} feature lies beyond the camera's clipping range`);
  }
 }
});

test('Plan and 3D overview frame the garden, approach and street across tablet aspect ratios',async()=>{
 const THREE=await import('three'),{framePlan,frameOverview}=await import('../src/camera-framing.js'),{plotOutline}=await import('../src/outdoor-layout.js');
 const points=[...plotOutline,[driveway.endX+2.8,-1],[driveway.endX+2.8,18.4]];
 for(const aspect of [.4,.75,1,1.8,2.4]){
  const plan=new THREE.OrthographicCamera(-1,1,1,-1,.1,500),target=framePlan(plan,aspect);plan.position.copy(target).add(new THREE.Vector3(0,40,.001));plan.lookAt(target);plan.updateMatrixWorld(true);
  for(const [x,z]of points){const p=new THREE.Vector3(x,0,z).project(plan);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1,'cropped outdoor plan at '+aspect);}
  const camera=new THREE.PerspectiveCamera(25,aspect,.1,500),framing=frameOverview(camera,undefined,{outdoors:true});assert.ok(framing.extent<.99,'cropped outdoor overview at '+aspect);assert.ok(camera.position.distanceTo(framing.target)<300,'overview exceeds orbit range');
 }
});
