import * as THREE from 'three';
import {rooms} from './house.js';
import {walls,openings,finishedFloor} from './architecture.js';
import {lightLayout,sourceStrength} from './lighting-data.js';

const slots=6;
const openPlan=['stue','alrum','kokken'];
// A bounded room-local light pass. Unlike global PointLights it cannot illuminate
// a bedroom through the kitchen wall, and shader cost stays fixed on tablets.
// Materials retain their PBR daylight/shadows; local lights add diffuse falloff.
export function buildRoomLighting(scene,snapshot){
 const root=new THREE.Group();root.name='light-fixtures';scene.add(root);
 let sources=[],state={},bindings=[],furnitureBindings=[],fixtureMaterials=[],fixtureGeometries=[];
 const furnitureMaterials=new Map();
 const glowData=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const radius=Math.hypot(x-31.5,y-31.5)/31.5,p=(y*64+x)*4;glowData[p]=glowData[p+1]=glowData[p+2]=255;glowData[p+3]=Math.round(255*Math.max(0,Math.exp(-radius*radius*6)-Math.exp(-6)));}
 const glowTexture=new THREE.DataTexture(glowData,64,64);glowTexture.needsUpdate=true;
 const fixtureMap=new Map();
 function rebuildFixtures(value){
  for(const m of fixtureMaterials)m.dispose();for(const g of fixtureGeometries)g.dispose();fixtureMaterials=[];fixtureGeometries=[];root.clear();fixtureMap.clear();
  sources=lightLayout(value);root.visible=value.visible;
  for(const source of sources){
   const group=new THREE.Group();group.name='light:'+source.id;group.position.fromArray(source.position);group.userData={lightId:source.id,room:source.room};group.visible=!['ceiling','pendant'].includes(source.kind);root.add(group);
   const metal=new THREE.MeshStandardMaterial({color:'#b5b9af',roughness:.36,metalness:.45});
   const shade=new THREE.MeshStandardMaterial({color:'#e4d8be',roughness:.85,side:THREE.DoubleSide});
   const bulb=new THREE.MeshStandardMaterial({color:'#fff0d0',emissive:'#ffd49b',emissiveIntensity:0,roughness:.4});fixtureMaterials.push(metal,shade,bulb);
   function mesh(geometry,material,x=0,y=0,z=0){fixtureGeometries.push(geometry);const item=new THREE.Mesh(geometry,material);item.position.set(x,y,z);item.castShadow=true;group.add(item);return item;}
   if(['table','floor'].includes(source.kind)){
    const base=source.kind==='table'?-.21:finishedFloor+.018-source.position[1];
    mesh(new THREE.CylinderGeometry(.09,.10,.022,16),metal,0,base,0);
    mesh(new THREE.CylinderGeometry(.009,.009,-base-.05,8),metal,0,(base-.05)/2,0);
    mesh(new THREE.CylinderGeometry(.065,.12,.15,24,1,true),shade,0,.015,0);
    mesh(new THREE.SphereGeometry(.037,12,8),bulb);
   }else if(source.kind==='pendant'){
    mesh(new THREE.CylinderGeometry(.025,.23,.19,24,1,true),shade,0,.08,0);mesh(new THREE.SphereGeometry(.07,12,8),bulb);
    mesh(new THREE.CylinderGeometry(.005,.005,.8,6),metal,0,.50,0);
   }else if(source.kind==='ceiling'){
    mesh(new THREE.CylinderGeometry(.14,.14,.03,20),shade);mesh(new THREE.CylinderGeometry(.11,.11,.033,20),bulb,0,-.004,0);
   }else mesh(new THREE.BoxGeometry(.44,.035,.045),bulb);
   const glowMaterial=new THREE.SpriteMaterial({map:glowTexture,color:'#ffd09a',transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});fixtureMaterials.push(glowMaterial);
   const glow=new THREE.Sprite(glowMaterial);glow.name='glow:'+source.id;glow.scale.setScalar(source.kind==='ceiling'?.65:source.kind==='floor'?.9:.5);group.add(glow);
   fixtureMap.set(source.id,{group,bulb,glow});
  }
 }
 function bind(mesh,roomIds,collection=bindings,aperture=null){
  if(!mesh.isMesh||!roomIds.length)return;
  if(roomIds.some(id=>openPlan.includes(id)))roomIds=[...new Set([...roomIds,...openPlan])];
  const original=mesh.material;if(Array.isArray(original)||!original.isMeshStandardMaterial)return;
  const cacheKey=original.uuid+':'+[...roomIds].sort().join(',');
  if(collection===furnitureBindings&&furnitureMaterials.has(cacheKey)){mesh.material=furnitureMaterials.get(cacheKey);return;}
  const material=original.clone();material.clippingPlanes=original.clippingPlanes;mesh.material=material;
  if(collection===furnitureBindings)furnitureMaterials.set(cacheKey,material);
  const center=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
  const uniforms={roomLightPosition:{value:Array.from({length:slots},()=>new THREE.Vector3())},roomLightColor:{value:Array.from({length:slots},()=>new THREE.Color())},roomLightPower:{value:new Float32Array(slots)},roomLightRange:{value:new Float32Array(slots)}};
  material.customProgramCacheKey=()=> 'engstien-local-light-v2'+(aperture?'-exterior':'');
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRoomPosition; varying vec3 vRoomNormal;').replace('#include <project_vertex>','#include <project_vertex>\nvRoomPosition=(modelMatrix*vec4(transformed,1.0)).xyz;vRoomNormal=normalize(mat3(modelMatrix)*objectNormal);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vRoomPosition; varying vec3 vRoomNormal;
uniform vec3 roomLightPosition[${slots}];uniform vec3 roomLightColor[${slots}];
uniform float roomLightPower[${slots}];uniform float roomLightRange[${slots}];`)
    .replace('#include <opaque_fragment>',`vec3 localLight=vec3(0.0);vec3 roomNormal=normalize(vRoomNormal)*(gl_FrontFacing?1.0:-1.0);
for(int i=0;i<${slots};i++){
 if(roomLightPower[i]<=0.0)continue;
 ${aperture?`float planeZ=${aperture.z.toFixed(6)};float rayT=(planeZ-roomLightPosition[i].z)/(vRoomPosition.z-roomLightPosition[i].z);float glassX=mix(roomLightPosition[i].x,vRoomPosition.x,rayT);if(rayT<=0.0||rayT>=1.0||!(${aperture.ranges.map(([a,b])=>`(glassX>=${a.toFixed(6)}&&glassX<=${b.toFixed(6)})`).join('||')}))continue;`:''}
 vec3 delta=roomLightPosition[i]-vRoomPosition;float distanceToLight=length(delta);
 if(distanceToLight>=roomLightRange[i])continue;
 float falloff=pow(max(0.0,1.0-distanceToLight/max(.001,roomLightRange[i])),2.0)/(.35+distanceToLight*distanceToLight);
 float diffuse=max(0.0,dot(roomNormal,normalize(delta)));
 localLight+=roomLightColor[i]*roomLightPower[i]*falloff*(.04+.96*diffuse);
}
outgoingLight+=diffuseColor.rgb*localLight;
#include <opaque_fragment>`);
  };
  collection.push({mesh,original,material,roomIds,uniforms,center});
 }
 function bindFurniture(furnishings){
  for(const binding of furnitureBindings)binding.material.dispose();furnitureBindings=[];furnitureMaterials.clear();
  furnishings.updateMatrixWorld(true);
  furnishings.traverse(mesh=>{if(mesh.userData.room)bind(mesh,[mesh.userData.room],furnitureBindings);});
 }
 function bindArchitecture(structure,floors){
  for(const [id,floor]of Object.entries(floors))bind(floor,[id]);structure.root.updateMatrixWorld(true);
  for(const wall of walls){
   const group=structure.root.getObjectByName('wall:'+wall.id);if(!group)continue;
   group.traverse(mesh=>{if(!mesh.isMesh)return;const b=new THREE.Box3().setFromObject(mesh),axis=wall.axis==='x'?0:1,fixed=wall.from[1-axis];
    const ids=rooms.filter(r=>{const range=axis===0?[r.x,r.x+r.w]:[r.z,r.z+r.d],cross=axis===0?[r.z,r.z+r.d]:[r.x,r.x+r.w];return fixed>=cross[0]-.26&&fixed<=cross[1]+.26&&range[1]>(axis===0?b.min.x:b.min.z)+.01&&range[0]<(axis===0?b.max.x:b.max.z)-.01;}).map(r=>r.id);bind(mesh,ids);
   });
  }
  for(const opening of openings){const group=structure.root.getObjectByName('opening:'+opening.id),ids=opening.rooms?.filter(id=>rooms.some(r=>r.id===id))||(opening.room?[opening.room]:[]);group?.traverse(mesh=>bind(mesh,ids));}
 }
 function update(next){
  state=next;
  for(const source of sources){const strength=sourceStrength(source,state),fixture=fixtureMap.get(source.id);fixture.bulb.emissiveIntensity=strength>0?1.6+strength*.65:0;fixture.glow.material.opacity=strength>0?Math.min(.55,.16+strength*.13):0;fixture.glow.visible=strength>0;fixture.group.userData.strength=strength;}
  for(const binding of [...bindings,...furnitureBindings]){
   const candidates=sources.filter(s=>binding.roomIds.includes(s.room)&&sourceStrength(s,state)>0).sort((a,b)=>binding.center.distanceToSquared(new THREE.Vector3(...a.position))-binding.center.distanceToSquared(new THREE.Vector3(...b.position))).slice(0,slots);
   for(let i=0;i<slots;i++){const source=candidates[i];binding.uniforms.roomLightPower.value[i]=source?sourceStrength(source,state):0;binding.uniforms.roomLightRange.value[i]=source?.radius||1;if(source){binding.uniforms.roomLightPosition.value[i].fromArray(source.position);binding.uniforms.roomLightColor.value[i].set(source.kelvin===2700?'#ffd3a2':'#ffe1b8');}}
  }
  return sources.filter(s=>sourceStrength(s,state)>0).map(s=>s.id);
 }
 rebuildFixtures(snapshot);
 return {root,bindArchitecture,bindFurniture,syncClipping(){for(const b of bindings)if(b.material.clippingPlanes!==b.original.clippingPlanes){b.material.clippingPlanes=b.original.clippingPlanes;b.material.needsUpdate=true;}},bindExterior(mesh){const wall=walls.find(w=>w.id==='garden'),ranges=wall.openings.filter(o=>o.sill===0&&['window','glazed-assembly'].includes(o.kind)).map(o=>[wall.from[0]+o.start,wall.from[0]+o.end]);bind(mesh,openPlan,bindings,{z:wall.from[1],ranges});},update,setFurnishings(value,furnishings){rebuildFixtures(value);bindFurniture(furnishings);update(state);},get sources(){return sources;},get bindings(){return [...bindings,...furnitureBindings];}};
}
