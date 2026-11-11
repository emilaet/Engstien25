import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {fabricMaps,oakMaps} from './visual-materials.js';
import {outdoorY,outdoorPlacement} from './outdoor-layout.js';

// Static garden furnishings, separate from the editable indoor inventory. Each
// assembly batches its repeated rails, slats, legs and leaves into instances.
export function buildOutdoorFurnishings(scene){
 const root=new THREE.Group();root.name='outdoor-furnishings';scene.add(root);
 const oak=oakMaps(),fabric=fabricMaps();
 const material=(name,color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.84,...extra});m.name=name;return m;};
 const wood=material('teak','#b79a70',{...oak,bumpScale:.003,roughness:.8});
 const cream=material('outdoor-linen','#e7dfd1',{...fabric,bumpScale:.003});
 const rug=material('woven-rug','#bdab8d',{...fabric,bumpScale:.002});
 const dark=material('charcoal','#303632',{roughness:.76});
 const metal=material('grill-metal','#6b706b',{metalness:.46,roughness:.36});
 const ceramic=material('sand-pot','#b8aa90',{roughness:.91});
 const soil=material('pot-soil','#514a39',{roughness:1});
 const green=material('pot-leaves','#65734b',{roughness:.96});
 const geometries=new Map(),unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,20),leafGeometry=new THREE.SphereGeometry(1,7,5);
 const transform=new THREE.Object3D();
 const rounded=(w,h,d,r=.035)=>{r=Math.min(r,w/2.2,h/2.2,d/2.2);const key=[w,h,d,r].join(':');if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,2,r));return geometries.get(key);};
 function assembly(name,x,z){const g=new THREE.Group();g.name=name;g.position.set(x,outdoorY,z);root.add(g);const batches=new Map();
  function part(geometry,m,x,y,z,sx=1,sy=1,sz=1,ry=0,frame=null){
   transform.position.set(x,y,z);transform.rotation.set(0,ry,0);transform.scale.set(sx,sy,sz);transform.updateMatrix();const matrix=transform.matrix.clone();if(frame)matrix.premultiply(frame);
   const key=geometry.uuid+':'+m.uuid;if(!batches.has(key))batches.set(key,{geometry,m,matrices:[]});batches.get(key).matrices.push(matrix);
  }
  const box=(w,h,d,x,y,z,m,ry=0,frame=null)=>part(unitBox,m,x,y,z,w,h,d,ry,frame);
  const soft=(w,h,d,x,y,z,m,r=.035,ry=0,frame=null)=>part(rounded(w,h,d,r),m,x,y,z,1,1,1,ry,frame);
  const cylinder=(rx,h,rz,x,y,z,m,frame=null)=>part(unitCylinder,m,x,y,z,rx,h,rz,0,frame);
  function finish(){let index=0;for(const {geometry,m,matrices}of batches.values()){const mesh=new THREE.InstancedMesh(geometry,m,matrices.length);mesh.name=name+':'+m.name+':'+index++;matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}return g;}
  return {g,box,soft,cylinder,part,finish};
 }
 function frame(x,z,angle){return new THREE.Matrix4().compose(new THREE.Vector3(x,0,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),new THREE.Vector3(1,1,1));}
 function diningChair(a,x,z,angle){const f=frame(x,z,angle);
  for(const px of [-.205,.205])for(const pz of [-.19,.19])a.box(.035,.44,.035,px,.22,pz,wood,0,f);
  for(let n=0;n<5;n++)a.box(.48,.035,.075,0,.46,(n-2)*.086,wood,0,f);
  a.soft(.44,.045,.40,0,.495,0,cream,.015,0,f);
  for(const side of [-1,1]){a.box(.032,.35,.032,side*.225,.62,-.23,wood,0,f);a.box(.035,.19,.035,side*.225,.56,.17,wood,0,f);a.soft(.043,.035,.49,side*.225,.66,0,wood,.012,0,f);}
  for(let n=0;n<3;n++)a.soft(.46,.055,.035,0,.71+n*.07,-.235,wood,.012,0,f);
 }
 const dining=assembly('outdoor-dining',outdoorPlacement.dining.x,outdoorPlacement.dining.z);
 for(const x of [-.36,.36])for(const z of [-.90,.90])dining.box(.065,.72,.065,x,.36,z,wood);
 for(let n=0;n<10;n++)dining.box(.86,.045,.196,0,.75,(n-4.5)*.207,wood);
 for(const x of [-.88,.88])for(const z of [-.60,.60])diningChair(dining,x,z,x<0?Math.PI/2:-Math.PI/2);
 diningChair(dining,0,-1.44,0);diningChair(dining,0,1.44,Math.PI);
 dining.cylinder(.08,.16,.08,0,.85,0,ceramic);dining.finish();

 const lounge=assembly('outdoor-lounge',outdoorPlacement.lounge.x,outdoorPlacement.lounge.z);
 lounge.soft(3.8,.012,3.4,0,.008,-.05,rug,.005);
 function loungeSeat(x,z,angle,width,sofa=false){const f=frame(x,z,angle),depth=.87;
  for(const px of [-width/2+.09,width/2-.09])for(const pz of [-.33,.33])lounge.box(.045,.33,.045,px,.165,pz,wood,0,f);
  for(let n=0;n<7;n++)lounge.box(width-.06,.055,.10,0,.30,(n-3)*.116,wood,0,f);
  for(const side of [-1,1]){lounge.box(.045,.52,.045,side*(width/2-.055),.42,-.35,wood,0,f);lounge.box(.045,.29,.045,side*(width/2-.055),.43,.32,wood,0,f);lounge.soft(.06,.055,depth,side*(width/2-.055),.59,0,wood,.016,0,f);}
  for(let n=0;n<3;n++)lounge.box(width,.065,.042,0,.57+n*.09,-.39,wood,0,f);
  const seats=sofa?3:1,w=(width-.18)/seats;
  for(let n=0;n<seats;n++){const cx=(n-(seats-1)/2)*w;lounge.soft(w-.025,.13,.71,cx,.40,.015,cream,.045,0,f);lounge.soft(w-.035,.40,.16,cx,.63,-.28,cream,.05,0,f);}
 }
 loungeSeat(0,-1.0,0,2.25,true);loungeSeat(-1.25,1.10,Math.PI-.25,.78);loungeSeat(1.25,1.10,Math.PI+.25,.78);
 lounge.cylinder(.63,.045,.37,0,.365,.16,wood);
 for(const x of [-.40,.40])for(const z of [-.17,.17])lounge.box(.045,.34,.045,x,.17,.16+z,wood);
 lounge.cylinder(.11,.04,.085,.10,.41,.16,ceramic);lounge.cylinder(.04,.09,.04,-.20,.43,.18,ceramic);lounge.finish();

 const grill=assembly('outdoor-grill',outdoorPlacement.grill.x,outdoorPlacement.grill.z);
 grill.box(.78,.65,.51,0,.43,0,dark);grill.soft(.82,.30,.53,0,.93,0,metal,.09);
 grill.box(.68,.07,.025,0,.76,.28,metal);grill.box(.47,.025,.035,0,.97,.29,dark);
 for(const x of [-.62,.62]){grill.box(.42,.035,.49,x,.80,0,dark);grill.box(.035,.77,.035,x,.385,.17,dark);}
 const knob=new THREE.CylinderGeometry(.025,.025,.018,12);knob.rotateX(Math.PI/2);
 for(const x of [-.25,0,.25])grill.part(knob,metal,x,.805,.282);
 for(const x of [-.33,.33])for(const z of [-.20,.20])grill.box(.045,.11,.045,x,.055,z,dark);
 grill.finish();

 const storage=assembly('outdoor-storage',outdoorPlacement.storage.x,outdoorPlacement.storage.z);
 storage.box(.62,.58,1.24,0,.31,0,dark);storage.soft(.65,.045,1.28,0,.62,0,dark,.012);
 for(let n=0;n<7;n++)storage.box(.018,.050,1.25,-.32,.09+n*.079,0,dark);
 storage.box(.028,.035,.22,-.335,.45,0,metal);storage.finish();

 for(const [index,p]of outdoorPlacement.pots.entries()){
  const pot=assembly('outdoor-pot-'+index,p.x,p.z),potGeometry=new THREE.CylinderGeometry(.27,.20,.46,20);
  pot.part(potGeometry,ceramic,0,.23,0);pot.cylinder(.245,.015,.245,0,.455,0,soil);
  for(let n=0;n<5;n++){const angle=n*Math.PI*.4,r=.10,stem=new THREE.Matrix4().makeRotationY(angle);pot.box(.016,.56,.016,Math.cos(angle)*r,.72,Math.sin(angle)*r,green);
   for(let k=0;k<9;k++){const a=angle+k*2.4,y=.52+k*.065,spread=.12+(k%3)*.05;pot.part(leafGeometry,green,Math.cos(a)*spread,y,Math.sin(a)*spread,.09,.035,.15,a,stem);}
  }pot.finish();
 }
 root.userData={kind:'outdoor-presentation',editable:false};
 return {root};
}
