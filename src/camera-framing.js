import * as THREE from 'three';
import {interior} from './architecture.js';
import {plotOutline,driveway} from './outdoor-layout.js';
const offset=new THREE.Vector3(12,24,24);
function houseBounds(height){
 const bounds=[];
 for(const x of [-.4,interior.width+.4])for(const y of [0,height])for(const z of [-.35,interior.depth+.4])bounds.push(new THREE.Vector3(x,y,z));
 return bounds;
}
const houseCorners=houseBounds(2.4),fullCorners=houseBounds(3.3);
export const environmentFrame={minX:Math.min(...plotOutline.map(p=>p[0])),maxX:driveway.endX+2.8,minZ:Math.min(...plotOutline.map(p=>p[1])),maxZ:Math.max(...plotOutline.map(p=>p[1]))};
const environmentCorners=[];for(const x of [environmentFrame.minX,environmentFrame.maxX])for(const y of [-1,4.2])for(const z of [environmentFrame.minZ,environmentFrame.maxZ])environmentCorners.push(new THREE.Vector3(x,y,z));
// Defaults focus on the house. The garden stays rendered beyond the frame.
// The complete-site fit remains available explicitly for overview tools.
export function framePlan(camera,aspect,{home=false,outdoors=false}={}){
 if(outdoors){const b=environmentFrame,halfH=Math.max((b.maxZ-b.minZ)/2+.5,((b.maxX-b.minX)/2+.5)/aspect);camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();return new THREE.Vector3((b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2);}
 const halfH=home?Math.max(interior.depth/2+1.2,(interior.width/2+.6)/aspect):Math.max(interior.depth/2+.35,(interior.width/2+.15)/aspect);
 camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;
 camera.updateProjectionMatrix();
 return new THREE.Vector3(interior.width/2,0,interior.depth/2+(home?.35:.05));
}
export function frameOverview(camera,viewOffset=offset,{full=false,outdoors=false}={}){
 const b=environmentFrame,target=outdoors?new THREE.Vector3((b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2):new THREE.Vector3(interior.width/2,0,interior.depth/2+(full?.6:0));
 const bounds=outdoors?environmentCorners:full?fullCorners:houseCorners;
 let low=.15,high=12;
 for(let pass=0;pass<22;pass++){
  const scale=(low+high)/2;camera.position.copy(target).addScaledVector(viewOffset,scale);camera.lookAt(target);camera.updateMatrixWorld(true);
  const fits=bounds.every(point=>{const p=point.clone().project(camera);return Math.abs(p.x)<=(full?.90:.98)&&Math.abs(p.y)<=(full?.88:.94);});
  if(fits)high=scale;else low=scale;
 }
 camera.position.copy(target).addScaledVector(viewOffset,high);camera.lookAt(target);camera.updateMatrixWorld(true);
 return {target:target.clone(),extent:bounds.map(p=>p.clone().project(camera)).reduce((m,p)=>Math.max(m,Math.abs(p.x),Math.abs(p.y)),0)};
}

// Outdoor presets frame the approved terraces/approach, while the existing
// indoor and orthographic views retain the same architecture coordinates.
export function frameExterior(camera,{side='garden',context=false}={}){
 const front=side==='driveway';
 const target=front?new THREE.Vector3(20.5,.2,7.0):new THREE.Vector3(8.5,.3,6.3);
 const view=front?new THREE.Vector3(30,10,3):new THREE.Vector3(-10,14,28);
 const points=[];
 if(front){for(const x of [15,28.2])for(const y of [-1.0,4.1])for(const z of [-.6,14.6])points.push(new THREE.Vector3(x,y,z));}
 else{
  for(const x of [-.4,19.8])for(const y of [0,3.3])for(const z of [-.4,7.25])points.push(new THREE.Vector3(x,y,z));
  if(context){
   for(const x of [15.2,22.4])for(const y of [0,2.6])for(const z of [7.2,14.3])points.push(new THREE.Vector3(x,y,z));
   for(const p of [[-4.6,.085,2.8],[-4.6,.085,7.3],[-3.2,.085,8.65]])points.push(new THREE.Vector3(...p));
  }
  for(const p of [[6.6,.085,12.7],[15.3,.085,12.7]])points.push(new THREE.Vector3(...p));
 }
 if(context&&!front)points.push(new THREE.Vector3(-6.4,4.2,2.7));
 let low=.15,high=8;
 for(let pass=0;pass<24;pass++){
  const scale=(low+high)/2;camera.position.copy(target).addScaledVector(view,scale);camera.lookAt(target);camera.updateMatrixWorld(true);
  if(points.every(p=>{const point=p.clone().project(camera);return Math.abs(point.x)<(context?.95:.97)&&Math.abs(point.y)<(context?.86:.92);}))high=scale;else low=scale;
 }
 camera.position.copy(target).addScaledVector(view,high);camera.lookAt(target);camera.updateMatrixWorld(true);
 return {target,extent:points.reduce((m,p)=>{const q=p.clone().project(camera);return Math.max(m,Math.abs(q.x),Math.abs(q.y));},0)};
}
