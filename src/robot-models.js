import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {chargerSurfaceMaps,chargerEnvironment} from './visual-materials.js';
import {robotPlacement} from './robot-layout.js';

// Actual geometry in the house, not a picture plane. Parts are merged by
// material so curved mouldings and small details remain practical on an iPad.
export function buildRobotModels(scene){
 const root=new THREE.Group();root.name='house-robots';scene.add(root);
 const surface=chargerSurfaceMaps(),environment=chargerEnvironment(),materials=[];
 function material(name,color,roughness=.5,metalness=.03,coat=.12){
  const m=new THREE.MeshPhysicalMaterial({color,roughness,metalness,clearcoat:coat,clearcoatRoughness:.4,envMap:environment,envMapIntensity:.65,...surface,bumpScale:.00008});m.name=name;materials.push(m);return m;
 }
 const graphite=material('robot-graphite','#303336',.49,.05),black=material('robot-dark-trim','#17191c',.73,.02,.04),rubber=material('robot-rubber','#17191a',.92,0,0),satin=material('robot-satin','#54595c',.37,.20),metal=material('robot-metal','#9ba2a6',.27,.65),lens=material('robot-optical-glass','#102027',.12,.15,.8),mowerHood=material('mower-graphite-hood','#595c60',.49,.08),yellow=material('mower-yellow-trim','#c9ae25',.52),greenLens=material('mower-green-inset','#385f40',.25,.08,.65),stop=material('mower-stop','#8d2524',.60);
 const indicator=new THREE.MeshStandardMaterial({color:'#d5ddd9',roughness:.5});indicator.name='robot-indicator';
 const geometries=new Map(),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,96),dummy=new THREE.Object3D();
 function rounded(w,h,d,r){r=Math.min(r,w/2.1,h/2.1,d/2.1);const key=[w,h,d,r].join(':');if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,Math.min(w,h,d)<.035?2:5,r));return geometries.get(key);}
 function group(kind){
  const g=new THREE.Group(),p=robotPlacement[kind];g.name='robot-'+kind;g.position.set(...p.position);g.rotation.y=p.rotation;g.userData={kind,station:true,presentation:true,interactive:true};root.add(g);const batches=new Map();let lift=0;
  function part(geometry,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
   dummy.position.set(x,y+lift,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
   const copy=geometry.index?geometry.toNonIndexed():geometry.clone();copy.applyMatrix4(dummy.matrix);if(!batches.has(m))batches.set(m,[]);batches.get(m).push(copy);
  }
  const box=(w,h,d,x,y,z,m,r=.006,rx=0,ry=0,rz=0)=>part(rounded(w,h,d,r),m,x,y,z,1,1,1,rx,ry,rz);
  const cylinder=(radius,height,x,y,z,m,rx=0,ry=0,rz=0)=>part(cylinderGeometry,m,x,y,z,radius,height,radius,rx,ry,rz);
  function label(text,w,h,x,y,z,{rx=0,ry=0,color='#aeb4b3',italic=false}={}){
   if(typeof document==='undefined')return;
   const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font=(italic?'italic ':'')+'500 72px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
   const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false});m.name='robot-marking';part(new THREE.PlaneGeometry(w,h),m,x,y,z,1,1,1,rx,ry);
  }
  function finish(){for(const [m,parts]of batches){const geometry=mergeGeometries(parts,false);const mesh=new THREE.Mesh(geometry,m);mesh.name=g.name+':'+m.name;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);for(const part of parts)part.dispose();}return g;}
  return {g,part,box,cylinder,label,finish,setFloor(value){lift=value;}};
 }
 // Rounded rectangular rims with a real opening, used for the two water tanks.
 function rim(w,d,r,thickness){
  const shape=new THREE.Shape();
  const path=(p,a,b,c)=>{p.moveTo(-a/2+c,-b/2);p.lineTo(a/2-c,-b/2);p.quadraticCurveTo(a/2,-b/2,a/2,-b/2+c);p.lineTo(a/2,b/2-c);p.quadraticCurveTo(a/2,b/2,a/2-c,b/2);p.lineTo(-a/2+c,b/2);p.quadraticCurveTo(-a/2,b/2,-a/2,b/2-c);p.lineTo(-a/2,-b/2+c);p.quadraticCurveTo(-a/2,-b/2,-a/2+c,-b/2);};
  path(shape,w,d,r);const hole=new THREE.Path();path(hole,w-thickness*2,d-thickness*2,Math.max(.004,r-thickness));shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSegments:3,bevelSize:.0014,bevelThickness:.001,curveSegments:12}).rotateX(-Math.PI/2);
 }
 function flutedFront(w,h){
  const pos=[],uv=[],idx=[],cols=240,rows=4;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows,x=(u-.5)*w,fade=Math.min(1,Math.min(u,1-u)*16),z=.0014*Math.cos(u*Math.PI*20)*fade;pos.push(x,(v-.5)*h,z);uv.push(u,v);if(i<cols&&j<rows){const a=j*(cols+1)+i;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
 }
 const v=group('vacuum');
 v.box(.399,.018,.580,0,.009,.110,black,.013);
 v.box(.358,.006,.443,0,.020,.100,graphite,.009);
 for(const x of [-.151,.151])v.box(.025,.128,.205,x,.082,-.112,graphite,.008);
 v.box(.322,.130,.016,0,.082,-.208,black,.006);
 v.box(.340,.145,.260,0,.211,-.110,graphite,.018);
 v.box(.322,.130,.012,0,.211,.024,graphite,.008);
 v.box(.328,.003,.256,0,.285,-.110,black,.001);
 v.box(.344,.244,.274,0,.410,-.112,graphite,.021);
 v.part(flutedFront(.322,.231),graphite,0,.411,.0268);
 for(const x of [-.087,.087]){
  v.part(rim(.160,.254,.024,.013),graphite,x,.533,-.111);
  v.box(.133,.006,.220,x,.528,-.111,black,.018);
  v.box(.111,.006,.019,x,.538,-.202,satin,.006);
 }
 v.box(.0024,.020,.002,-.143,.492,.029,indicator,.001);
 v.label('roborock',.068,.016,-.104,.250,.032,{color:'#989e9d'});
 for(const side of [-1,1])for(let n=0;n<6;n++)v.box(.002,.040,.008,side*.172,.193,-.17+n*.014,black,.001);
 // The round robot is kept low, with a separate bumper, lidar, optical window,
 // actual underside wheels/mops and a shallow moulded washing tray.
 v.setFloor(.022);
 const body=new THREE.LatheGeometry([[0,.011],[.145,.011],[.162,.016],[.172,.029],[.174,.046],[.173,.058],[.168,.069],[.155,.075],[0,.075]].map(p=>new THREE.Vector2(...p)),160);
 v.part(body,graphite,0,0,.220);v.cylinder(.158,.003,0,.075,.220,black);
 v.part(new THREE.TorusGeometry(.1731,.0009,8,160),satin,0,.041,.220,1,1,1,Math.PI/2);
 v.part(new THREE.TorusGeometry(.158,.00065,6,160),graphite,0,.077,.220,1,1,1,Math.PI/2);
 v.cylinder(.043,.023,0,.086,.158,graphite);v.cylinder(.039,.002,0,.0985,.158,black);v.cylinder(.0435,.0015,0,.076,.158,metal);
 v.box(.112,.034,.006,0,.040,.388,black,.009);v.box(.091,.026,.003,0,.040,.393,lens,.007);
 for(const x of [-.024,.024])v.cylinder(.005,.001,x,.078,.263,satin);
 v.label('⌁',.036,.025,0,.101,.158,{rx:-Math.PI/2,color:'#a5a59a'});
 for(const x of [-.139,.139])v.cylinder(.026,.027,x,.026,.220,rubber,0,0,Math.PI/2);
 for(const x of [-.072,.072])v.cylinder(.063,.014,x,.008,.166,rubber);
 for(let n=0;n<3;n++)v.box(.062,.002,.003,-.134,.010,.312,black,.001,0,n*Math.PI*2/3);
 v.setFloor(0);for(let n=0;n<7;n++)v.box(.343,.0015,.003,0,.024,.270+n*.018,satin,.001);
 const vacuum=v.finish();

 const m=group('mower');
 m.box(.560,.018,.820,0,.009,.330,black,.014);
 for(let n=0;n<7;n++)m.box(.405,.002,.010,0,.020,.090+n*.078,graphite,.001);
 m.box(.285,.028,.128,0,.032,-.002,graphite,.009);
 m.box(.104,.212,.060,0,.132,-.015,black,.012);m.box(.145,.043,.085,0,.249,-.008,graphite,.014);
 for(const x of [-.047,.047])m.box(.016,.024,.007,x,.141,.020,metal,.002);
 m.box(.011,.003,.002,0,.258,.036,indicator,.001);
 const z0=.330;m.setFloor(.018);
 m.box(.399,.111,.444,0,.111,z0+.016,black,.046);
 m.box(.344,.063,.375,0,.070,z0+.031,graphite,.027);
 // A closed, smoothly lofted moulding: broad shoulders, curved sides and a
 // lowered nose, rather than a flat open sheet over a rectangular chassis.
 const hoodSection=t=>({w:.185+.030*Math.sin(t*Math.PI)-.004*Math.pow(t,6),edge:.140+.022*Math.sin(t*Math.PI),roof:.262+.014*Math.cos((t-.25)*Math.PI)-.100*Math.pow(t,3)});
 const hoodY=(x,z)=>{const t=(z-z0+.235)/.520,{w,edge,roof}=hoodSection(t);return edge+(roof-edge)*Math.pow(Math.sqrt(Math.max(0,1-(x/w)**2)),.48);};
 function inset(side,width,length,offset){const positions=[],uvs=[],indices=[],rows=20,cols=8,angle=side*.23;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const a=j/rows*2-1,b=(i/cols*2-1)*width*Math.sqrt(Math.max(.01,1-a**8)),along=a*length,x=side*.158+b*Math.cos(angle)+along*Math.sin(angle),z=z0+.066+along*Math.cos(angle)-b*Math.sin(angle);positions.push(x,hoodY(x,z)+offset,z);uvs.push(i/cols,j/rows);if(i<cols&&j<rows){const n=j*(cols+1)+i;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 const pos=[],uv=[],idx=[],rows=64,cols=80;
 for(let j=0;j<=rows;j++){
  const t=j/rows,z=z0-.235+t*.520,{w,edge,roof}=hoodSection(t);
  for(let i=0;i<=cols;i++){const a=i/cols*Math.PI*2,c=Math.cos(a),x=w*Math.sin(a),y=edge+(c>=0?(roof-edge)*Math.pow(c,.48):-.025*Math.pow(-c,.7));pos.push(x,y,z);uv.push(i/cols,t);if(i<cols&&j<rows){const n=j*(cols+1)+i;idx.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}}
 }
 for(const j of [0,rows]){const c=pos.length/3;pos.push(0,j===0?.18:.15,z0-.235+j/rows*.520);uv.push(.5,j/rows);for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1;idx.push(c,...(j===0?[a,b]:[b,a]));}}
 const hood=new THREE.BufferGeometry();hood.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));hood.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));hood.setIndex(idx);hood.computeVertexNormals();
 const normals=hood.attributes.normal;for(let j=0;j<=rows;j++){const a=j*(cols+1),b=a+cols,n=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}
 m.part(hood,mowerHood,0,0,0);
 m.box(.358,.060,.104,0,.133,z0+.250,black,.018);
 m.box(.295,.035,.070,0,.077,z0+.252,black,.016);
 for(let n=0;n<11;n++)m.box(.007,.023,.0015,(n-5)*.026,.115,z0+.304,graphite,.001);
 m.box(.139,.034,.248,0,.286,z0-.045,black,.011,-.18);
 m.box(.119,.026,.079,0,.266,z0+.100,graphite,.007);
 m.box(.158,.060,.082,0,.309,z0+.083,graphite,.015);
 m.box(.144,.047,.004,0,.310,z0+.126,lens,.009);
 for(const x of [-.047,0,.047]){m.cylinder(.015,.003,x,.310,z0+.130,satin,Math.PI/2);m.cylinder(.011,.0035,x,.310,z0+.133,lens,Math.PI/2);m.cylinder(.005,.004,x-.002,.313,z0+.135,black,Math.PI/2);}
 m.label('MAMMOTION',.059,.008,0,.291,z0+.129);
 m.box(.063,.012,.024,0,.313,z0-.094,stop,.005);
 m.cylinder(.026,.028,0,.293,z0-.185,black);m.cylinder(.029,.010,0,.312,z0-.185,graphite);
 for(let n=0;n<24;n++){const a=n*Math.PI/12;m.box(.002,.012,.003,Math.sin(a)*.029,.308,z0-.185+Math.cos(a)*.029,black,.001,0,a);}
 for(const side of [-1,1]){
  const x=side*.232,wheelZ=z0-.132;
  m.cylinder(.125,.067,x,.136,wheelZ,rubber,0,0,Math.PI/2);
  for(let n=0;n<20;n++){const a=n*Math.PI/10;m.box(.073,.022,.033,x,.136+Math.cos(a)*.125,wheelZ+Math.sin(a)*.125,rubber,.003,a);}
  m.cylinder(.101,.004,x+side*.0355,.136,wheelZ,satin,0,0,Math.PI/2);m.cylinder(.052,.006,x+side*.039,.136,wheelZ,graphite,0,0,Math.PI/2);
  m.part(new THREE.TorusGeometry(.104,.0016,6,96),graphite,x+side*.038,.136,wheelZ,1,1,1,0,Math.PI/2);
  for(let n=0;n<8;n++){const a=n*Math.PI/4;m.cylinder(.004,.002,x+side*.039,.136+Math.cos(a)*.077,wheelZ+Math.sin(a)*.077,black,0,0,Math.PI/2);}
  m.box(.010,.017,.131,side*.211,.148,z0+.060,yellow,.006,-.12);
  m.part(inset(side,.021,.062,.0008),black,0,0,0);
  m.part(inset(side,.014,.052,.0013),greenLens,0,0,0);
  m.box(.007,.023,.065,side*.207,.193,z0-.108,black,.008);
  for(let n=0;n<6;n++)m.box(.002,.023,.010,side*.207,.181,z0-.133+n*.018,black,.001);
 }
 for(const x of [-.101,.101])m.cylinder(.028,.023,x,.028,z0+.207,rubber,0,0,Math.PI/2);
 m.label('MAMMOTION',.091,.013,0,.153,z0+.278,{color:'#747b7e'});
 const mower=m.finish();root.updateMatrixWorld(true);
 return {root,vacuum,mower,setDaylight(value){for(const mat of materials)mat.envMapIntensity=.28+.45*value;}};
}
