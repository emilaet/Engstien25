import * as THREE from 'three';
import {gravelMaterial} from './visual-materials.js';

// Decorative planting stays outside the house, door routes and original carport.
// It has no fictitious light sources or smart-home state.
export function buildLandscape(scene){
 const root=new THREE.Group();root.name='landscape';scene.add(root);
 const beds=[{x:6,z:11.05,w:12.6,d:.72},{x:-.85,z:4.5,w:.7,d:6.4},{x:14.75,z:11.9,w:.65,d:4.1}];
 const soil=gravelMaterial(),edge=new THREE.MeshStandardMaterial({color:'#454b43',roughness:1});
 for(const b of beds){
  const bed=new THREE.Mesh(new THREE.BoxGeometry(b.w,.14,b.d),soil);bed.position.set(b.x,-.025,b.z);bed.receiveShadow=true;root.add(bed);
  for(const side of [-1,1]){const rim=new THREE.Mesh(new THREE.BoxGeometry(b.w,.08,.018),edge);rim.position.set(b.x,.04,b.z+side*b.d/2);root.add(rim);}
 }
 const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshStandardMaterial({color:'#727b50',roughness:.98}),1008);
 const grasses=new THREE.InstancedMesh(new THREE.ConeGeometry(.018,.43,3),new THREE.MeshStandardMaterial({color:'#a7976d',roughness:1,side:THREE.DoubleSide}),720);
 const dummy=new THREE.Object3D(),color=new THREE.Color();let leaf=0,grass=0,seed=713;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(const b of beds){const count=Math.round(Math.max(b.w,b.d)/.8);for(let n=0;n<count;n++){
  const x=b.x+(b.w>b.d?(n+.5)/count*b.w-b.w/2:0),z=b.z+(b.d>b.w?(n+.5)/count*b.d-b.d/2:0);
  for(let i=0;i<24;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.29,y=.12+random()*.32;dummy.position.set(x+Math.cos(a)*r,y,z+Math.sin(a)*r);dummy.rotation.set(random()*2,random()*6,random()*2);dummy.scale.set(.055+random()*.045,.11+random()*.10,.035);dummy.updateMatrix();leaves.setMatrixAt(leaf,dummy.matrix);color.setHSL(.19+random()*.065,.16+random()*.12,.19+random()*.10);leaves.setColorAt(leaf++,color);}
  for(let i=0;i<18;i++){const a=random()*Math.PI*2,r=random()*.2;dummy.position.set(x+Math.cos(a)*r,.20,z+Math.sin(a)*r);dummy.rotation.set(Math.sin(a)*.35,a,Math.cos(a)*.35);dummy.scale.set(1,.55+random(),1);dummy.updateMatrix();grasses.setMatrixAt(grass++,dummy.matrix);}
 }}
 leaves.count=leaf;grasses.count=grass;leaves.castShadow=grasses.castShadow=true;leaves.receiveShadow=grasses.receiveShadow=true;root.add(leaves,grasses);return {root};
}
