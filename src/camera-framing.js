import * as THREE from 'three';
import {interior} from './architecture.js';
import {carportRoof} from './carport.js';

const target=new THREE.Vector3(10,0,6.9),offset=new THREE.Vector3(12,27,22.1);
const corners=[];
for(const x of [-.6,Math.max(interior.width+.6,carportRoof.to[0]+.2)])for(const y of [0,3.4])for(const z of [-.6,carportRoof.to[1]+.2])corners.push(new THREE.Vector3(x,y,z));
// Fit the actual house AND carport. Re-run only for overview, not user zooms.
export function frameOverview(camera){
 camera.position.copy(target).add(offset);camera.lookAt(target);camera.updateMatrixWorld(true);
 for(let pass=0;pass<3;pass++){
  const projected=corners.map(p=>p.clone().project(camera));
  const ratio=Math.max(1,...projected.map(p=>Math.max(Math.abs(p.x)/.90,Math.abs(p.y)/.88)));
  if(ratio<=1.001)break;
  camera.position.sub(target).multiplyScalar(ratio*1.02).add(target);camera.lookAt(target);camera.updateMatrixWorld(true);
 }
 return {target:target.clone(),extent:corners.map(p=>p.clone().project(camera)).reduce((m,p)=>Math.max(m,Math.abs(p.x),Math.abs(p.y)),0)};
}
