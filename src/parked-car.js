import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {carportArea,outdoorY} from './outdoor-layout.js';
import {chargerPlacement} from './charger.js';
import {chargerEnvironment} from './visual-materials.js';

// 2023 Model Y proportions: 4.75 m long, 1.92 m wide, 1.62 m tall.
// +X faces the road. The rear and the left rear charge port face the shed.
export const parkedCarPlacement={position:[carportArea.maxX-2.48,outdoorY+.006,12.88],length:4.75,width:1.92,height:1.62,wheelbase:2.89};
export function buildParkedCar(parent){
 const root=new THREE.Group();root.name='tesla-model-y-2023';root.position.fromArray(parkedCarPlacement.position);parent.add(root);
 const environment=chargerEnvironment();
 const paint=new THREE.MeshPhysicalMaterial({color:'#f9f9f5',roughness:.25,metalness:.20,clearcoat:1,clearcoatRoughness:.14,envMap:environment,envMapIntensity:1});
 const glass=new THREE.MeshPhysicalMaterial({color:'#101b22',roughness:.15,metalness:.34,clearcoat:1,envMap:environment,envMapIntensity:.9});
 const trim=new THREE.MeshStandardMaterial({color:'#111518',roughness:.48,metalness:.3});
 const rubber=new THREE.MeshStandardMaterial({color:'#141617',roughness:.95});
 const rim=new THREE.MeshStandardMaterial({color:'#171b1e',roughness:.32,metalness:.75,envMap:environment,envMapIntensity:.65});
 const bright=new THREE.MeshStandardMaterial({color:'#d8e0e0',roughness:.22,metalness:.6});
 const red=new THREE.MeshStandardMaterial({color:'#991b1e',roughness:.22,emissive:'#b20e15',emissiveIntensity:.25});
 function mesh(geometry,material,name,position=[0,0,0],group=root){const item=new THREE.Mesh(geometry,material);item.name=name;item.position.fromArray(position);item.castShadow=true;item.receiveShadow=true;group.add(item);return item;}
 function tube(points,radius,material,name,group=root){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*8),radius,8,false),material,name,[0,0,0],group);}
 function rounded(w,h,d,material,name,position){return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(.035,h/3,d/3)),material,name,position);}
 const stations=[[-2.375,.68,.91],[-2.26,.86,1.0],[-1.85,.94,1.02],[-1.1,.96,1.0],[0,.96,.99],[1.1,.95,.95],[1.8,.88,.85],[2.2,.76,.72],[2.375,.65,.58]];
 // Continuous derivatives prevent ripples in reflections between profile stations.
 function sample(x,table){let i=1;while(i<table.length-1&&table[i][0]<x)i++;const a=table[i-1],b=table[i],prev=table[Math.max(0,i-2)],next=table[Math.min(table.length-1,i+1)],span=b[0]-a[0],t=THREE.MathUtils.clamp((x-a[0])/span,0,1);return a.slice(1).map((v,n)=>{const k=n+1,m0=(b[k]-prev[k])/(b[0]-prev[0]),m1=(next[k]-a[k])/(next[0]-a[0]);return (2*t**3-3*t*t+1)*v+(t**3-2*t*t+t)*span*m0+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*span*m1;});}
 function surface(name,rows,columns,point,material){
  const positions=[],indices=[];for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++)positions.push(...point(i/rows,j/columns));
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return mesh(geometry,material,name);
 }
 // A continuous smooth shell with genuine wheel-arch openings at both axles.
 function bodyProfile(x){const [w,top]=sample(x,stations);
  const arch=Math.max(...[-1.445,1.445].map(axle=>Math.abs(x-axle)<.395?.355+Math.sqrt(.395**2-(x-axle)**2):.22));
  return [[0,top],[w*.72,top-.025],[w*.96,top-.13],[w,Math.max(arch,top-.29)],[w*.94,arch],[0,arch],[-w*.94,arch],[-w,Math.max(arch,top-.29)],[-w*.96,top-.13],[-w*.72,top-.025],[0,top]];
 }
 surface('model-y-white-body',112,40,(u,v)=>{
  const x=-2.375+u*4.75,profile=bodyProfile(x);
  const t=v*(profile.length-1),i=Math.min(profile.length-2,Math.floor(t)),a=profile[i],b=profile[i+1],f=t-i;
  return [x,THREE.MathUtils.lerp(a[1],b[1],f),THREE.MathUtils.lerp(a[0],b[0],f)];
 },paint).material.side=THREE.DoubleSide;
 for(const x of [-2.375,2.375]){
  const outline=bodyProfile(x).slice(0,-1).map(([z,y])=>new THREE.Vector2(z,y)),triangles=THREE.ShapeUtils.triangulateShape(outline,[]),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(outline.flatMap(p=>[x,p.y,p.x]),3));geometry.setIndex(triangles.flat());geometry.computeVertexNormals();mesh(geometry,paint,'model-y-bumper');
 }
 const cabin=[[-2.12,.67,1.0,1.04],[-1.7,.78,1.0,1.35],[-1.12,.82,1.0,1.57],[-.55,.82,1.0,1.62],[.18,.80,.99,1.55],[.75,.77,.97,1.28],[1.16,.73,.95,.97]];
 function canopyY(x,z){const [width,base,top]=sample(x,cabin);return base+(top-base)*Math.pow(Math.sqrt(Math.max(0,1-(z/width)**2)),.18);}
 surface('model-y-panoramic-glazing',70,40,(u,v)=>{const x=-2.12+u*3.28,[width]=sample(x,cabin),z=-Math.cos(v*Math.PI)*width;return [x,canopyY(x,z),z];},glass).material.side=THREE.DoubleSide;
 // White A/C pillars outline the dark side glass and panoramic roof.
 for(const side of [-1,1]){
  const rail=Array.from({length:30},(_,i)=>{const x=-2.12+i*3.28/29,z=sample(x,cabin)[0]*.86*side;return [x,canopyY(x,z)+.008,z];});tube(rail,.022,paint,'model-y-roof-rail');
  for(const [x,radius,name]of [[-.65,.022,'b-pillar'],[-1.25,.013,'quarter-window-trim']]){const width=sample(x,cabin)[0];tube(Array.from({length:8},(_,i)=>{const z=width*side*(1-i*.14/7);return [x,canopyY(x,z)+.008,z];}),radius,trim,'model-y-'+name);}
  tube(Array.from({length:24},(_,i)=>{const x=-2.05+i*3.15/23,[width,base]=sample(x,cabin);return [x,base+.009,width*side];}),.014,trim,'model-y-window-sill');
  tube([[-2.1,.34,side*.86],[0,.24,side*.92],[1.98,.29,side*.80]],.026,trim,'model-y-side-sill');
  for(const x of [-.72,.93])tube([[x,.89,side*.958],[x-.04,.58,side*.96],[x-.06,.29,side*.91]],.0035,trim,'model-y-door-seam');
  for(const x of [-1.05,.57])rounded(.16,.019,.012,trim,'model-y-flush-door-handle',[x,.91,side*.955]);
  const mirror=rounded(.22,.12,.14,paint,'model-y-mirror',[.76,1.04,side*1.005]);mirror.rotation.y=side*.20;
  rounded(.17,.075,.012,glass,'model-y-mirror-glass',[.72,1.04,side*1.077]);
 }
 for(const x of [-1.445,1.445])for(const side of [-1,1]){
  const wheel=new THREE.Group();wheel.name='model-y-black-wheel';wheel.position.set(x,.355,side*.945);root.add(wheel);
  mesh(new THREE.TorusGeometry(.285,.07,14,40),rubber,'model-y-tyre',[0,0,0],wheel);
  mesh(new THREE.CylinderGeometry(.254,.254,.19,40).rotateX(Math.PI/2),rim,'model-y-black-rim',[0,0,0],wheel);
  mesh(new THREE.CylinderGeometry(.202,.202,.012,32).rotateX(Math.PI/2),bright,'model-y-brake-disc',[0,0,side*.098],wheel);
  const spokes=new THREE.InstancedMesh(new THREE.BoxGeometry(.031,.224,.028),rim,10),transform=new THREE.Object3D();spokes.name='model-y-black-spokes';spokes.castShadow=spokes.receiveShadow=true;wheel.add(spokes);
  for(let n=0;n<10;n++){const a=n*Math.PI/5;transform.position.set(Math.sin(a)*.126,Math.cos(a)*.126,side*.116);transform.rotation.z=-a+.12;transform.updateMatrix();spokes.setMatrixAt(n,transform.matrix);}
  mesh(new THREE.TorusGeometry(.242,.012,8,40),rim,'model-y-rim-lip',[0,0,side*.116],wheel);
  mesh(new THREE.CylinderGeometry(.058,.058,.025,24).rotateX(Math.PI/2),rim,'model-y-wheel-centre',[0,0,side*.128],wheel);
 }
 // Pre-refresh 2023 lights: separate swept headlamps, with no front light bar.
 for(const side of [-1,1]){
  const head=[[1.78,.86],[1.99,.82],[2.21,.72]].map(([x,r])=>{const [w,top]=sample(x,stations);return [x,top-.025-Math.max(0,r-.72)/.24*.105+.009,side*w*r];});
  tube(head,.021,trim,'model-y-headlamp-housing');tube(head.map(([x,y,z])=>[x,y+.015,z]),.008,bright,'model-y-headlamp');
  const tail=[[-2.10,.93],[-2.28,.80],[-2.375,.47]].map(([x,r])=>{const [w,top]=sample(x,stations);return [x-.004,top-.025-Math.max(0,r-.72)/.24*.105+.009,side*w*r];});tube(tail,.020,red,'model-y-taillight');
 }
 rounded(.035,.12,.51,trim,'model-y-front-intake',[2.29,.39,0]);
 rounded(.41,.095,.018,bright,'model-y-front-numberplate',[2.348,.53,0]).rotation.y=Math.PI/2;
 const badge=new THREE.Shape();badge.moveTo(-.032,.026);badge.quadraticCurveTo(0,.041,.032,.026);badge.lineTo(.027,.016);badge.quadraticCurveTo(0,.029,-.027,.016);badge.closePath();badge.moveTo(-.013,.014);badge.lineTo(.013,.014);badge.lineTo(.004,-.030);badge.lineTo(0,-.038);badge.lineTo(-.004,-.030);badge.closePath();
 const emblem=mesh(new THREE.ShapeGeometry(badge),bright,'model-y-tesla-badge',[2.04,.795,0]);emblem.rotation.set(-Math.PI/2,0,-Math.PI/2);
 // Small tailgate spoiler and an open charge flap on the left rear quarter.
 rounded(.095,.035,1.30,trim,'model-y-rear-spoiler',[-2.13,1.07,0]);
 const port=rounded(.16,.085,.015,trim,'model-y-charge-port',[-1.91,.93,-.877]);port.rotation.y=-.25;
 const flap=rounded(.15,.085,.012,paint,'model-y-open-charge-flap',[-1.90,.99,-.95]);flap.rotation.x=-.9;
 const chargePort=new THREE.Vector3(-1.91,.93,-.91).add(root.position);
 const plug=mesh(new RoundedBoxGeometry(.11,.06,.065,2,.012),trim,'model-y-charging-plug',chargePort.toArray(),parent);plug.rotation.y=-.35;
 const start=new THREE.Vector3(-.16,-.064,.005).applyAxisAngle(new THREE.Vector3(0,1,0),chargerPlacement().rotationY).add(new THREE.Vector3(...chargerPlacement().position));
 const cable=tube([start.toArray(),[start.x+.10,.85,start.z-.10],[start.x+.22,.25,start.z-.20],[chargePort.x+.14,.22,chargePort.z-.25],[chargePort.x+.16,.58,chargePort.z-.16],chargePort.toArray()],.014,trim,'tesla-connected-charge-cable',parent);
 cable.userData={connected:true,from:start.toArray(),to:chargePort.toArray()};
 root.userData={model:'Tesla Model Y',year:2023,color:'white',reversed:true,chargePort:chargePort.toArray()};
 return {root,cable};
}
