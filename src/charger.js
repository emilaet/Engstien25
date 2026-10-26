import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {doors,walls,openingPosition,finishedFloor} from './architecture.js';

// The two end posts remain; there is no post at the middle of the open side.
export const carportPostPixels=[[2247,745],[2247,1262]];
export function chargerPlacement(){
 const door=doors.find(o=>o.id==='shed-door'),wall=walls.find(w=>w.id===door.wall);
 const [x,z]=openingPosition(door,door.end);
 // Outside the east wall: standing in the carport and facing the shed, +z is left.
 return {position:[x+wall.thickness/2+.056,finishedFloor+1.25,z+.43],rotationY:Math.PI/2,doorId:door.id};
}
export function chargerPulse(seconds,charging=true,reducedMotion=false){return charging?(reducedMotion?1:.65+.35*Math.sin(seconds*Math.PI)):0;}
export function buildCharger(scene){
 const placement=chargerPlacement(),root=new THREE.Group();root.name='ok-charger';root.position.fromArray(placement.position);root.rotation.y=placement.rotationY;scene.add(root);
 const dark=new THREE.MeshStandardMaterial({color:'#171b1f',roughness:.72,metalness:.08});
 const face=new THREE.MeshStandardMaterial({color:'#30353a',roughness:.85,metalness:.12,emissive:'#171c21',emissiveIntensity:.22});
 function mesh(geometry,material,name,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 mesh(new RoundedBoxGeometry(.29,.49,.105,6,.035),dark,'charger-case');
 const plate=new THREE.Shape(),w=.278/2,h=.478/2,r=.03;
 plate.moveTo(-w+r,-h);plate.lineTo(w-r,-h);plate.quadraticCurveTo(w,-h,w,-h+r);plate.lineTo(w,h-r);plate.quadraticCurveTo(w,h,w-r,h);plate.lineTo(-w+r,h);plate.quadraticCurveTo(-w,h,-w,h-r);plate.lineTo(-w,-h+r);plate.quadraticCurveTo(-w,-h,-w+r,-h);
 mesh(new THREE.ExtrudeGeometry(plate,{depth:.014,bevelEnabled:false,curveSegments:12}),face,'charger-front',0,0,.043);
 const seam=new THREE.MeshStandardMaterial({color:'#111517',roughness:.85});
 for(const x of [-.093,.093])mesh(new THREE.BoxGeometry(.103,.0018,.002),seam,'charger-seam',x,-.055,.058);
 mesh(new THREE.CylinderGeometry(.009,.009,1.005,12),new THREE.MeshStandardMaterial({color:'#8c928e',metalness:.6,roughness:.4}),'charger-conduit',0,-.7475,-.015);
 mesh(new THREE.CylinderGeometry(.032,.032,.006,40).rotateX(Math.PI/2),dark,'charger-ring-center',0,-.055,.06);
 const ringMaterial=new THREE.MeshBasicMaterial({color:'#1cf08c',toneMapped:false});
 mesh(new THREE.TorusGeometry(.0355,.0019,12,80),ringMaterial,'charger-status-ring',0,-.055,.064);
 const haloMaterial=new THREE.MeshBasicMaterial({color:'#18f28d',transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 mesh(new THREE.TorusGeometry(.0355,.0055,12,80),haloMaterial,'charger-status-halo',0,-.055,.063);
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d');ctx.font='italic bold 44px sans-serif';ctx.fillStyle='#737d82';ctx.textAlign='center';ctx.fillText('OK',64,48);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(.037,.019),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),'charger-logo',.092,-.2,.059);
 }
 function update(seconds,charging,reducedMotion){
  const pulse=chargerPulse(seconds,charging,reducedMotion);
  ringMaterial.color.set(charging?'#1cf08c':'#748078');ringMaterial.color.multiplyScalar(charging?.35+.65*pulse:1);
  haloMaterial.opacity=charging?.08+.24*pulse:0;
  return pulse;
 }
 return {root,placement,update};
}
