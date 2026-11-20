import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {robotPlacement} from './robot-layout.js';

// Procedural presentation models: shared geometries, fine bevels and batched
// repeated details. They show docking locations, never an invented live track.
export function buildRobotModels(scene){
 const root=new THREE.Group();root.name='house-robots';scene.add(root);
 const material=(name,color,roughness=.5,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});m.name=name;return m;};
 const graphite=material('robot-graphite','#35393b',.42,.12),black=material('robot-dark-trim','#171b1d',.57,.05),rubber=material('robot-rubber','#161919',.94),satin=material('robot-satin','#505658',.35,.27),silver=material('robot-metal','#9a9fa0',.28,.6),ivory=material('mower-ivory','#edeee7',.4,.05),yellow=material('mower-yellow','#d0b52c',.55),lens=material('robot-sensor-glass','#111f28',.18,.35);
 const light=material('robot-indicator','#d1ddd9',.35);light.emissive.set('#b9e7d6');light.emissiveIntensity=.12;
 const unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,64),sphere=new THREE.SphereGeometry(1,24,16),geometries=new Map(),dummy=new THREE.Object3D();
 function rounded(w,h,d,r){r=Math.min(r,w/2.2,h/2.2,d/2.2);const key=[w,h,d,r].join(':');if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,3,r));return geometries.get(key);}
 function group(kind){const g=new THREE.Group(),p=robotPlacement[kind];g.name='robot-'+kind;g.position.set(...p.position);g.rotation.y=p.rotation;g.userData={kind,station:true,presentation:true};root.add(g);const batches=new Map();let lift=0;
  function part(geometry,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){dummy.position.set(x,y+lift,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();const key=geometry.uuid+':'+m.uuid;if(!batches.has(key))batches.set(key,{geometry,m,matrices:[]});batches.get(key).matrices.push(dummy.matrix.clone());}
  const box=(w,h,d,x,y,z,m,r=.006,rx=0,ry=0,rz=0)=>part(rounded(w,h,d,r),m,x,y,z,1,1,1,rx,ry,rz);
  const cylinder=(radius,height,x,y,z,m,rx=0,ry=0,rz=0)=>part(unitCylinder,m,x,y,z,radius,height,radius,rx,ry,rz);
  function label(text,w,h,x,y,z,ry=0){let mat=new THREE.MeshBasicMaterial({color:'#aeb7b8'});if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#d1d4cf';ctx.font='500 72px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;mat=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false});}part(new THREE.PlaneGeometry(w,h),mat,x,y,z,1,1,1,0,ry,0);}
  function finish(){let n=0;for(const {geometry,m,matrices}of batches.values()){const mesh=new THREE.InstancedMesh(geometry,m,matrices.length);mesh.name=g.name+':'+m.name+':'+n++;matrices.forEach((v,i)=>mesh.setMatrixAt(i,v));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}return g;}
  return {g,part,box,cylinder,label,finish,setFloor(value){lift=value;}};
 }
 const v=group('vacuum');
 v.box(.397,.017,.54,0,.0085,.09,black,.008);
 for(const x of [-.155,.155])v.box(.025,.14,.22,x,.08,-.065,graphite,.008);
 v.box(.354,.17,.232,0,.222,-.061,graphite,.012);
 v.box(.356,.294,.248,0,.455,-.064,graphite,.017);
 // Fluted water tanks, a fine separating seam, and two inset carry handles.
 for(let n=0;n<12;n++)v.box(.027,.280,.0018,(n-5.5)*.0285,.455,.0608,n%3===0?satin:graphite,.0007);
 v.box(.344,.003,.237,0,.307,-.064,black,.001);
 for(const x of [-.089,.089]){v.box(.168,.009,.237,x,.607,-.064,satin,.018);v.box(.125,.006,.046,x,.612,-.071,black,.018);v.box(.108,.004,.024,x,.616,-.071,graphite,.009);}
 v.box(.0025,.022,.002,-.146,.568,.062,light,.001);
 v.label('roborock',.084,.019,-.10,.265,.056);
 for(let n=0;n<6;n++)v.box(.003,.060,.011,.18,.17,-.14+n*.023,black,.001);
 // Rounded circular body, bumper seam, lidar and the forward optical window.
 v.setFloor(.017);
 const body=new THREE.LatheGeometry([[0,.013],[.147,.013],[.164,.021],[.173,.038],[.174,.067],[.171,.083],[.161,.096],[0,.096]].map(p=>new THREE.Vector2(...p)),96);
 v.part(body,graphite,0,0,.18);v.cylinder(.162,.004,0,.097,.18,black);
 const ring=new THREE.TorusGeometry(.171,.0013,6,96);v.part(ring,satin,0,.055,.18,1,1,1,Math.PI/2);
 v.cylinder(.044,.022,0,.110,.119,graphite);v.cylinder(.039,.003,0,.123,.119,black);v.cylinder(.043,.0012,0,.098,.119,silver);
 v.box(.086,.031,.007,0,.051,.351,lens,.007);v.box(.108,.043,.004,0,.051,.347,black,.009);
 for(const x of [-.026,.026])v.cylinder(.006,.0015,x,.101,.228,satin);
 for(const x of [-.128,.128])v.cylinder(.030,.024,x,.030,.18,rubber,0,0,Math.PI/2);
 for(const x of [-.075,.075])v.cylinder(.064,.014,x,.009,.125,rubber);
 for(let n=0;n<3;n++)v.box(.066,.002,.004,-.128,.014,.279,black,.001,0,n*Math.PI*2/3,0);
 for(let n=0;n<6;n++)v.box(.34,.001,.003,0,.019,.225+n*.019,satin,.001);
 const vacuum=v.finish();

 const m=group('mower');
 m.box(.58,.018,.84,0,.009,.34,black,.009);
 for(let n=0;n<8;n++)m.box(.43,.003,.012,0,.020,.08+n*.075,graphite,.001);
 m.box(.30,.036,.13,0,.033,-.006,graphite,.01);
 m.box(.116,.238,.064,0,.142,-.015,black,.012);m.box(.16,.048,.087,0,.25,-.005,graphite,.014);
 for(const x of [-.048,.048])m.box(.018,.025,.008,x,.145,.032,silver,.003);
 m.box(.014,.004,.003,0,.251,.041,light,.001);
 const robotZ=.34;
 m.setFloor(.018);
 m.box(.425,.100,.45,0,.145,robotZ+.020,black,.044);
 m.box(.375,.065,.39,0,.092,robotZ+.035,graphite,.028);
 // Lofted hood: rounded front, rising shoulders and a separate dark chassis.
 const positions=[],uv=[],indices=[],rows=40,cols=32;
 for(let j=0;j<=rows;j++){const t=j/rows,z=-.25+t*.54,width=.19+.026*Math.sin(t*Math.PI)-.052*Math.pow(t,5),height=.305-.12*Math.pow(t,1.5),edge=.158-.018*t;
  for(let i=0;i<=cols;i++){const u=i/cols,x=(u-.5)*2*width,y=edge+(height-edge)*Math.pow(Math.sin(u*Math.PI),.48);positions.push(x,y,robotZ+z);uv.push(u,t);if(i<cols&&j<rows){const a=j*(cols+1)+i;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}
 }
 const hood=new THREE.BufferGeometry();hood.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));hood.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));hood.setIndex(indices);hood.computeVertexNormals();
 const hoodMaterial=ivory.clone();hoodMaterial.side=THREE.DoubleSide;m.part(hood,hoodMaterial,0,0,0);
 m.box(.135,.034,.252,0,.303,robotZ-.087,black,.012,-.09);
 m.box(.112,.035,.068,0,.313,robotZ+.034,graphite,.006);
 m.box(.093,.024,.004,0,.312,robotZ+.071,lens,.004);
 for(const x of [-.030,.030])m.cylinder(.009,.002,x,.311,robotZ+.074,lens,Math.PI/2);
 m.box(.071,.012,.025,0,.330,robotZ-.080,material('mower-stop','#a72424',.54),.006);
 m.cylinder(.024,.037,0,.332,robotZ-.19,black);m.cylinder(.028,.016,0,.358,robotZ-.19,graphite);
 for(let n=0;n<20;n++){const a=n*Math.PI/10;m.box(.003,.012,.003,Math.sin(a)*.028,.358,robotZ-.19+Math.cos(a)*.028,black,.001,0,a);}
 for(const side of [-1,1]){
  const x=side*.233,wheelZ=robotZ-.145;
  m.cylinder(.130,.065,x,.140,wheelZ,rubber,0,0,Math.PI/2);m.cylinder(.098,.004,x+side*.034,.140,wheelZ,satin,0,0,Math.PI/2);m.cylinder(.050,.006,x+side*.038,.140,wheelZ,graphite,0,0,Math.PI/2);
  for(let n=0;n<28;n++){const a=n*Math.PI/14;m.box(.073,.020,.026,x,.14+Math.cos(a)*.13,wheelZ+Math.sin(a)*.13,rubber,.003,a);}
  for(let n=0;n<6;n++){const a=n*Math.PI/3;m.cylinder(.005,.003,x+side*.039,.14+Math.cos(a)*.070,wheelZ+Math.sin(a)*.070,black,0,0,Math.PI/2);}
  m.box(.009,.018,.115,side*.209,.178,robotZ+.08,yellow,.007,-.15);
  for(let n=0;n<7;n++)m.box(.003,.025,.013,side*.21,.239-n*.0018,robotZ-.10+n*.019,black,.001);
 }
 for(const x of [-.10,.10])m.cylinder(.031,.023,x,.031,robotZ+.21,rubber,0,0,Math.PI/2);
 m.box(.345,.042,.045,0,.119,robotZ+.247,black,.018);
 for(let n=0;n<9;n++)m.box(.008,.021,.001,(n-4)*.030,.121,robotZ+.270,graphite,.001);
 m.label('MAMMOTION',.11,.018,0,.153,robotZ+.254);
 const mower=m.finish();
 root.updateMatrixWorld(true);
 return {root,vacuum,mower};
}
