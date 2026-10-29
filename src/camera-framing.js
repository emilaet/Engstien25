import * as THREE from 'three';
import {interior} from './architecture.js';
import {carportRoof} from './carport.js';

const target=new THREE.Vector3(10.2,0,6.6),offset=new THREE.Vector3(12,24,24);
const corners=[];
// Fit the two real footprints, rather than the large empty rectangle behind them.
for(const [minX,maxX,minZ,maxZ] of [[-.9,interior.width+.6,-.6,11.2],[carportRoof.from[0]-.4,carportRoof.to[0]+.3,carportRoof.from[1]-.2,carportRoof.to[1]+.3]])
 for(const x of [minX,maxX])for(const y of [0,2.45])for(const z of [minZ,maxZ])corners.push(new THREE.Vector3(x,y,z));
export function frameOverview(camera){
 let low=.15,high=6;
 for(let pass=0;pass<22;pass++){
  const scale=(low+high)/2;camera.position.copy(target).addScaledVector(offset,scale);camera.lookAt(target);camera.updateMatrixWorld(true);
  const fits=corners.every(point=>{const p=point.clone().project(camera);return Math.abs(p.x)<=.90&&Math.abs(p.y)<=.88;});
  if(fits)high=scale;else low=scale;
 }
 camera.position.copy(target).addScaledVector(offset,high);camera.lookAt(target);camera.updateMatrixWorld(true);
 return {target:target.clone(),extent:corners.map(p=>p.clone().project(camera)).reduce((m,p)=>Math.max(m,Math.abs(p.x),Math.abs(p.y)),0)};
}
