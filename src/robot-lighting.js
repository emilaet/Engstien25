import * as THREE from 'three';
import {robotPlacement} from './robot-layout.js';

// A finite, stationary close-up rig, like the charger fill. It lights the
// actual meshes and floor; it neither replaces nor follows the background.
export function buildRobotLighting(scene){
 const target=new THREE.Object3D();target.name='robot-light-target';
 const key=new THREE.SpotLight('#fff1dc',0,4,Math.PI/4,.85,2);key.name='robot-closeup-key';key.target=target;key.castShadow=true;
 key.shadow.mapSize.set(1024,1024);key.shadow.camera.near=.08;key.shadow.camera.far=4;key.shadow.bias=-.00004;key.shadow.normalBias=.001;key.shadow.autoUpdate=false;
 const fill=new THREE.SpotLight('#e2ecf4',0,3.2,Math.PI/3,.95,2);fill.name='robot-closeup-fill';fill.target=target;fill.castShadow=false;
 key.visible=fill.visible=false;scene.add(target,key,fill);
 return {key,fill,target,update(kind,daylight=1){
  const p=robotPlacement[kind];key.visible=fill.visible=!!p;key.intensity=p?9+daylight*21:0;fill.intensity=p?3+daylight*7:0;
  if(!p)return;
  target.position.fromArray(p.target);
  const front=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),p.rotation),side=new THREE.Vector3(front.z,0,-front.x);
  key.position.copy(target.position).addScaledVector(front,.95).addScaledVector(side,-.65).add(new THREE.Vector3(0,1.05,0));
  fill.position.copy(target.position).addScaledVector(front,p===robotPlacement.vacuum?1.3:.65).addScaledVector(side,p===robotPlacement.vacuum?1.0:.8).add(new THREE.Vector3(0,p===robotPlacement.vacuum?1.35:.50,0));
  key.shadow.needsUpdate=true;
 }};
}
