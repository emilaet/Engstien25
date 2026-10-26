import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {furnitureCatalog,initialFurnishing,validateFurniture,createFurnishingData,normalizeFurnishingImport,furnitureKey,footprint} from '../src/furnishing-data.js';
import {buildStructure} from '../src/structure.js';
import {buildFurnishings} from '../src/furniture.js';
import {doors,passages,openingPosition,walls,toPlan} from '../src/architecture.js';
const storage=()=>{const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('Furniture catalog has stable IDs and valid footprints in the correct room polygons',()=>{assert.equal(new Set(furnitureCatalog.map(i=>i.id)).size,furnitureCatalog.length);assert.ok(furnitureCatalog.every(validateFurniture));assert.ok(furnitureCatalog.some(i=>i.room==='v1'&&i.type==='childBed'));assert.ok(furnitureCatalog.some(i=>i.room==='v2'&&i.type==='childBed'));});
test('Furniture changes survive reload, reject invalid bounds and remain separate from other items',()=>{const disk=storage(),p=createFurnishingData(disk),before=p.load();p.edit('sove-bed',{color:'#cabba2',width:1.9,notes:'Gavlen skal være afrundet'});const next=createFurnishingData(disk).load();assert.equal(next.items.find(i=>i.id==='sove-bed').color,'#cabba2');assert.deepEqual(next.items.find(i=>i.id==='stue-sofa'),before.items.find(i=>i.id==='stue-sofa'));assert.throws(()=>p.edit('sove-bed',{x:999}));assert.throws(()=>p.edit('sove-bed',{width:NaN}));assert.throws(()=>p.edit('sove-bed',{reference:'javascript:alert(1)'}));assert.throws(()=>p.edit('sove-bed',{name:' '}));p.resetItem('sove-bed');assert.equal(p.load().items.find(i=>i.id==='sove-bed').color,furnitureCatalog[0].color);});
test('Later catalog updates reach existing browsers while explicit owner overrides remain',()=>{const disk=storage(),p=createFurnishingData(disk),bed=furnitureCatalog.find(i=>i.id==='sove-bed'),old=bed.color;p.edit(bed.id,{width:1.9});try{bed.color='#c1b191';const updated=createFurnishingData(disk).load().items.find(i=>i.id===bed.id);assert.equal(updated.color,'#c1b191');assert.equal(updated.width,1.9);}finally{bed.color=old;}});
test('Unavailable storage retains furniture edits in memory with honest persistence state',()=>{const p=createFurnishingData({getItem:()=>null,setItem(){throw new Error('quota');},length:0});p.edit('sove-bed',{color:'#cabba2'});assert.equal(p.persistent,false);assert.equal(p.load().items[0].color,'#cabba2');});
test('Rendered furniture keeps door and passage openings clear, including the HTH pantry door',()=>{const scene=new THREE.Scene(),model=buildFurnishings(scene,initialFurnishing());scene.updateMatrixWorld(true);for(const o of [...doors,...passages]){const w=walls.find(w=>w.id===o.wall),center=openingPosition(o,(o.start+o.end)/2),normal=w.axis==='x'?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0),start=new THREE.Vector3(center[0],1.12,center[1]).addScaledVector(normal,-.13),ray=new THREE.Raycaster(start,normal,0,.26);assert.equal(ray.intersectObject(model.root,true).length,0,o.id+' blocked by furniture');}model.dispose();});
test('Detailed meshes retain furniture IDs, selection and visibility without changing architecture',()=>{const scene=new THREE.Scene(),model=buildFurnishings(scene,initialFurnishing());assert.equal(model.root.children.length,furnitureCatalog.length);const sofa=model.get('stue-sofa');assert.ok(sofa.children.length>10);assert.ok(sofa.children.filter(c=>c.isMesh).every(c=>c.userData.furnitureId==='stue-sofa'));model.select('sove-bed');assert.equal(model.get('sove-bed').getObjectByName('selection').visible,true);model.select('stue-sofa');assert.equal(model.get('sove-bed').getObjectByName('selection').visible,false);model.setSnapshot({...initialFurnishing(),visible:false});assert.equal(model.root.visible,false);model.dispose();assert.equal(scene.children.length,0);});


test('HTH working fronts and faucets face the room and pour into actual basins',()=>{
 const model=buildFurnishings(new THREE.Scene(),initialFurnishing());model.root.updateMatrixWorld(true);
 const pos=(id,name)=>model.get(id).getObjectByName(name).getWorldPosition(new THREE.Vector3());
 const units=furnitureCatalog.find(i=>i.id==='bryggers-units'),dryer=pos(units.id,'dryer-front'),washer=pos(units.id,'washer-front'),bowl=pos(units.id,'sink-bowl');
 assert.ok(dryer.z<units.z&&washer.z<units.z,'machine fronts face north into aisle');assert.ok(dryer.x<washer.x&&washer.x<bowl.x,'west to east: dryer, washer, sink');
 for(const id of ['kokken-island','bryggers-units','bad1-vanity','bad2-vanity']){const base=pos(id,'tap-base'),outlet=pos(id,'tap-outlet'),basin=new THREE.Box3().setFromObject(model.get(id).getObjectByName('sink-bowl'));assert.ok(outlet.x>=basin.min.x&&outlet.x<=basin.max.x&&outlet.z>=basin.min.z&&outlet.z<=basin.max.z,id+' outlet is over basin');if(id.includes('vanity'))assert.ok(outlet.x>base.x);else assert.ok(outlet.z<base.z);}
 model.dispose();
});
test('Office desk is 180 cm wide with rear edge flush against carport wall',()=>{
 const model=buildFurnishings(new THREE.Scene(),initialFurnishing()),desk=furnitureCatalog.find(i=>i.id==='kontor-desk'),south=toPlan([1857,707])[1];model.root.updateMatrixWorld(true);const top=new THREE.Box3().setFromObject(model.get(desk.id).getObjectByName('desk-top'));
 assert.ok(Math.abs(top.max.z-south)<1e-6);assert.ok(Math.abs(top.max.x-top.min.x-1.8)<1e-6);assert.equal(desk.rotation,180);model.dispose();
});
test('HTH storage has low entrance seating, sliding technical doors and a white niche closet',()=>{
 const model=buildFurnishings(new THREE.Scene(),initialFurnishing()),seat=model.get('entre-closet').getObjectByName('bench-seat'),seatBox=new THREE.Box3().setFromObject(seat);
 assert.ok(seatBox.max.y<.65);assert.equal(model.get('entre-closet').children.filter(c=>c.name==='entry-wall-hook').length,5);assert.ok(model.get('entre-console').getObjectByName('round-entry-mirror'));
 for(const id of ['bad1-vanity','bad2-vanity']){assert.ok(model.get(id).getObjectByName('wall-mirror'));assert.ok(model.get(id).children.filter(c=>c.name==='vanity-horizontal-profile').length>=8);}
 const sliding=model.get('bryggers-technical');assert.ok(sliding.getObjectByName('sliding-left'));assert.ok(sliding.getObjectByName('sliding-right'));
 const closet=furnitureCatalog.find(i=>i.id==='v1-wardrobe'),corners=footprint(closet),nw=toPlan([1413,316]),se=toPlan([1459,412]);assert.equal(closet.material,'ceramic');assert.equal(closet.fixed,true);assert.ok(corners.every(([x,z])=>x>=nw[0]&&x<=se[0]&&z>=nw[1]&&z<=se[1]));
 for(const id of ['v1-bed','v2-bed'])assert.equal(furnitureCatalog.find(i=>i.id===id).rotation,270);model.dispose();
});
test('Old furniture exports and journal edits receive corrected layouts without losing reference notes',()=>{
 const disk=storage();disk.setItem(furnitureKey+':op:old',JSON.stringify({id:'old',at:1,kind:'edit',itemId:'kontor-desk',patch:{width:1.6,rotation:90,notes:'Mit referencebord'}}));const p=createFurnishingData(disk),desk=p.load().items.find(i=>i.id==='kontor-desk');assert.equal(desk.width,1.8);assert.equal(desk.rotation,180);assert.equal(desk.notes,'Mit referencebord');p.edit(desk.id,{color:'#aabbcc'});assert.equal(createFurnishingData(disk).load().items.find(i=>i.id===desk.id).color,'#aabbcc');
 const old=initialFurnishing();old.items=old.items.filter(i=>!['v1-wardrobe','v2-wardrobe','v1-bench','v2-bench','entre-console'].includes(i.id));for(const i of old.items)delete i.layoutRevision;const entry=old.items.find(i=>i.id==='entre-closet');entry.type='wardrobe';entry.height=2.1;entry.notes='Bevar min reference';const imported=normalizeFurnishingImport(old);assert.equal(imported.items.length,37);assert.equal(imported.items.find(i=>i.id===entry.id).type,'entryBench');assert.equal(imported.items.find(i=>i.id===entry.id).notes,entry.notes);assert.throws(()=>normalizeFurnishingImport({...old,items:[old.items[0],old.items[0]]}));
});

test('Furnished and empty views preserve every wall group in cutaway and full height',()=>{
 const scene=new THREE.Scene(),structure=buildStructure(scene),model=buildFurnishings(scene,initialFurnishing());
 for(const visible of [true,false]){model.setSnapshot({...initialFurnishing(),visible});for(const cut of [true,false]){structure.setCutaway(cut);for(const wall of walls){const group=structure.root.getObjectByName('wall:'+wall.id);assert.ok(group?.visible,wall.id);assert.ok(group.children.some(c=>c.name==='solid:'+wall.id),wall.id+' retains wall geometry');}}}model.dispose();
});
