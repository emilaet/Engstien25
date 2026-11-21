import * as THREE from 'three';
import {finishedFloor} from './architecture.js';
import {lawnHeight} from './outdoor-layout.js';
// User's marked locations. Local +Z is the robot's forward direction.
export const robotPlacement={
 vacuum:{position:[5.85,finishedFloor,6.54],rotation:Math.PI,target:[5.85,finishedFloor+.25,6.43],view:[.48,.39,-1.65]},
 mower:{position:[15.18,lawnHeight(15.18),13.4],rotation:-Math.PI/2,target:[14.87,lawnHeight(15.18)+.20,13.4],view:[-1.6,.82,1.08]},
};
// Stay on the room/lawn side of the real wall rather than orbiting inside it.
export const robotOrbitLimits={
 vacuum:{minAzimuth:Math.PI-1.05,maxAzimuth:Math.PI+1.05,minDistance:.6,maxDistance:5.5},
 mower:{minAzimuth:-Math.PI+.30,maxAzimuth:-.30,minDistance:.7,maxDistance:4.5},
};
export function robotFieldOfView(kind,aspect){return kind==='vacuum'?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(19))*Math.max(1,1.2/aspect))):25;}
export function frameRobotCamera(camera,bounds,kind,{compositionTarget=null,samples=null}={}){
 const p=robotPlacement[kind],target=compositionTarget?.clone()||new THREE.Vector3(...p.target),direction=new THREE.Vector3(...p.view).normalize(),points=samples?.length?samples:[],probe=new THREE.Vector3();
 if(!points.length)for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new THREE.Vector3(x,y,z));
 let low=.35,high=12;
 for(let n=0;n<24;n++){const distance=(low+high)/2;camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld(true);if(points.every(point=>{const p=probe.copy(point).project(camera);return Math.abs(p.x)<.82&&Math.abs(p.y)<.82&&p.z>-1&&p.z<1;}))high=distance;else low=distance;}
 camera.position.copy(target).addScaledVector(direction,high);camera.lookAt(target);camera.updateMatrixWorld(true);
 return {target,extent:points.reduce((m,p)=>{const q=probe.copy(p).project(camera);return Math.max(m,Math.abs(q.x),Math.abs(q.y));},0)};
}
