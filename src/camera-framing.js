import * as THREE from 'three';
import {interior} from './architecture.js';
const offset=new THREE.Vector3(12,24,24);
function houseBounds(height){
 const bounds=[];
 for(const x of [-.4,interior.width+.4])for(const y of [0,height])for(const z of [-.35,interior.depth+.4])bounds.push(new THREE.Vector3(x,y,z));
 return bounds;
}
const houseCorners=houseBounds(2.4),fullCorners=houseBounds(3.3);
// Orthographic plan shows the living footprint; the carport remains outside the fit.
export function framePlan(camera,aspect,{home=false}={}){
 const halfH=home?Math.max(interior.depth/2+1.2,(interior.width/2+.6)/aspect):Math.max(interior.depth/2+.35,(interior.width/2+.15)/aspect);
 camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;
 camera.updateProjectionMatrix();
 return new THREE.Vector3(interior.width/2,0,interior.depth/2+(home?.35:.05));
}
export function frameOverview(camera,viewOffset=offset,{full=false}={}){
 const target=new THREE.Vector3(interior.width/2,0,interior.depth/2+(full?.6:0));
 const bounds=full?fullCorners:houseCorners;
 let low=.15,high=6;
 for(let pass=0;pass<22;pass++){
  const scale=(low+high)/2;camera.position.copy(target).addScaledVector(viewOffset,scale);camera.lookAt(target);camera.updateMatrixWorld(true);
  const fits=bounds.every(point=>{const p=point.clone().project(camera);return Math.abs(p.x)<=(full?.90:.98)&&Math.abs(p.y)<=(full?.88:.94);});
  if(fits)high=scale;else low=scale;
 }
 camera.position.copy(target).addScaledVector(viewOffset,high);camera.lookAt(target);camera.updateMatrixWorld(true);
 return {target:target.clone(),extent:bounds.map(p=>p.clone().project(camera)).reduce((m,p)=>Math.max(m,Math.abs(p.x),Math.abs(p.y)),0)};
}
