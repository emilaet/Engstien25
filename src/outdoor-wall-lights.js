import * as THREE from 'three';
import {siteLights} from './site-lighting.js';
import {finishedFloor,ceilingHeight} from './architecture.js';
import {cutawayHeight} from './structure.js';

// Three small up/down sconces. The light footprints are surface decals, not
// extra shadow-casting lights: a stable, inexpensive facade effect on tablets.
export function buildOutdoorWallLights(parent){
 const root=new THREE.Group();root.name='landscape-light-fixtures';parent.add(root);
 const sources=siteLights(),materials=[],luminaires=[],beams=[],clip=new THREE.Plane(new THREE.Vector3(0,-1,0),finishedFloor+cutawayHeight),roofClip=new THREE.Plane(new THREE.Vector3(0,-1,0),finishedFloor+ceilingHeight(sources[0].position[2]));
 const metal=new THREE.MeshStandardMaterial({color:'#191d20',roughness:.64,metalness:.28});
 const reflector=new THREE.MeshStandardMaterial({color:'#b5a27f',roughness:.42,metalness:.45});materials.push(metal,reflector);
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const height=(y/(size-1)-.5)*3.2,lateral=Math.abs((x/(size-1)-.5)*1.8),dy=Math.abs(height),width=.04+dy*.38;
  const edge=1-THREE.MathUtils.smoothstep(lateral,width*.5,width),fade=(1-THREE.MathUtils.smoothstep(dy,.45,1.6))*THREE.MathUtils.smoothstep(dy,.05,.14);
  const i=(y*size+x)*4;data[i]=255;data[i+1]=184;data[i+2]=91;data[i+3]=Math.round(255*edge*fade*.65);
 }
 const footprint=new THREE.DataTexture(data,size,size);footprint.colorSpace=THREE.SRGBColorSpace;footprint.needsUpdate=true;
 for(const source of sources){
  const group=new THREE.Group();group.name='wall-sconce:'+source.id;group.position.fromArray(source.position);root.add(group);
  function box(w,h,d,x,y,z,material=metal,name='sconce-housing'){
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  // Open top/bottom, with a recessed reflector and a solid square front.
  box(.18,.18,.018,0,0,.074);box(.012,.18,.15,-.084,0,0);box(.012,.18,.15,.084,0,0);box(.17,.17,.014,0,0,-.072);
  box(.14,.012,.11,0,0,-.005,reflector,'sconce-reflector');
  const emitter=new THREE.MeshStandardMaterial({color:'#e6c694',emissive:'#ffc47e',emissiveIntensity:0,roughness:.3});materials.push(emitter);
  for(const y of [-.067,.067])box(.125,.008,.07,0,y,-.008,emitter,'sconce-emitter');
  // Preserve the exterior light id for existing device state and dimmer binding.
  const lamp=group.getObjectByName('sconce-emitter');lamp.name=source.id;luminaires.push(lamp);
  const glow=new THREE.MeshBasicMaterial({map:footprint,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});materials.push(glow);
  const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.8,3.2),glow);beam.name='wall-light-footprint:'+source.id;beam.position.set(source.position[0],source.position[1],source.position[2]-.080);root.add(beam);beams.push(beam);
 }
 return {root,setCutaway(enabled){for(const material of materials){material.clippingPlanes=[enabled?clip:roofClip];material.needsUpdate=true;}},update(state){
  const room=state?.entre,strength=room?.lights.ude?THREE.MathUtils.clamp((room.levels?.ude??100)/100,0,1)*THREE.MathUtils.clamp((room.brightness??100)/100,0,1):0;
  for(const lamp of luminaires)lamp.material.emissiveIntensity=strength*3;
  for(const beam of beams){beam.visible=strength>0;beam.material.opacity=strength;}
 }};
}
