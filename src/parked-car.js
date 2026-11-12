import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {carportArea,outdoorY} from './outdoor-layout.js';
import {chargerPlacement} from './charger.js';
import {chargerEnvironment} from './visual-materials.js';

// Original Model Y generation, matching the 2023 exterior. The licensed source
// is named "Tesla Model Y 2021"; see assets/tesla-model-y.LICENSE.txt.
export const parkedCarPlacement={position:[carportArea.maxX-2.48,outdoorY,12.88],length:4.75,width:1.92,height:1.62,wheelbase:2.89};
export async function buildParkedCar(parent,data){
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const gltf=typeof data==='string'?await loader.loadAsync(data):await loader.parseAsync(data,'');
 const presentation=new THREE.Group();presentation.name='parked-car-presentation';parent.add(presentation);
 const root=new THREE.Group();root.name='tesla-model-y-2023';presentation.add(root);root.position.fromArray(parkedCarPlacement.position);
 const model=gltf.scene;model.rotation.y=Math.PI;root.add(model); // Front points towards the road (+X).
 const environment=chargerEnvironment();
 model.traverse(part=>{
  if(!part.isMesh)return;
  part.castShadow=true;part.receiveShadow=true;
  const material=part.material;part.name='model-y-'+material.name;material.envMap=environment;material.envMapIntensity=.8;
  if(material.name==='body'){material.color.set('#f5f5f2');material.roughness=.28;material.metalness=.16;if(material.isMeshPhysicalMaterial){material.clearcoat=1;material.clearcoatRoughness=.15;}}
  if(['wheels','metal','alum'].includes(material.name)){material.color.set('#171b1e');material.roughness=.30;material.metalness=.7;}
  if(material.name==='glass_body'){material.color.set('#0d1720');material.roughness=.13;material.metalness=.3;}
  if(material.name==='glass_lights'){material.color.set('#d7e5f1');material.transparent=true;material.opacity=.25;material.depthWrite=false;material.roughness=.15;material.envMapIntensity=.4;}
  if(material.name==='tires'){material.color.set('#121517');material.roughness=.93;material.metalness=0;}
 });
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root);root.position.y+=outdoorY-bounds.min.y;root.updateMatrixWorld(true);
 const black=new THREE.MeshStandardMaterial({color:'#111518',roughness:.63});
 const body=model.getObjectByName('model-y-body');
 const portRay=new THREE.Raycaster(new THREE.Vector3(root.position.x-1.91,root.position.y+.94,root.position.z-2),new THREE.Vector3(0,0,1),0,3);
 const portHit=body?portRay.intersectObject(body,true)[0]:null;
 const chargePort=portHit?portHit.point.clone().add(new THREE.Vector3(0,0,-.028)):root.position.clone().add(new THREE.Vector3(-1.91,.94,-.9));
 const plug=new THREE.Mesh(new RoundedBoxGeometry(.11,.055,.065,2,.012),black);plug.name='model-y-charging-plug';plug.position.copy(chargePort);plug.castShadow=true;presentation.add(plug);
 const placement=chargerPlacement(),start=new THREE.Vector3(-.16,-.064,.005).applyAxisAngle(new THREE.Vector3(0,1,0),placement.rotationY).add(new THREE.Vector3(...placement.position));
 const route=[start,new THREE.Vector3(start.x+.10,.85,start.z-.10),new THREE.Vector3(start.x+.22,.25,start.z-.20),new THREE.Vector3(chargePort.x+.14,.22,chargePort.z-.25),new THREE.Vector3(chargePort.x+.16,.58,chargePort.z-.16),chargePort];
 const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(route),56,.014,8,false),black);cable.name='tesla-connected-charge-cable';cable.castShadow=true;cable.receiveShadow=true;presentation.add(cable);
 cable.userData={connected:true,from:start.toArray(),to:chargePort.toArray()};
 root.userData={model:'Tesla Model Y',year:2023,sourceModelYear:2021,color:'white',reversed:true,chargePort:chargePort.toArray()};
 return {root,cable,presentation,setVisible(value){presentation.visible=!!value;}};
}
