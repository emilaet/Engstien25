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
 const v=group('vacuum');
 // Qrevo 5AE: a continuous rounded tower, two open water tanks and a deep
 // recessed wash bay. Dimensions are in metres, independent of presentation.
 v.g.userData.model='Roborock Qrevo 5AE';
 v.box(.352,.022,.578,0,.011,.063,black,.010);
 v.box(.343,.012,.438,0,.028,.139,graphite,.006);
 v.box(.338,.128,.224,0,.087,-.128,graphite,.018);
 for(const side of [-1,1]){
  v.box(.026,.145,.283,side*.157,.099,-.080,graphite,.010);
  v.box(.018,.025,.285,side*.161,.028,-.072,black,.008);
 }
 v.box(.342,.157,.278,0,.220,-.108,graphite,.024);
 // Dustbag door sits flush under the water tanks, with an actual fine reveal.
 v.box(.322,.141,.009,0,.220,.034,black,.012);
 v.box(.317,.136,.008,0,.221,.040,graphite,.011);
 v.box(.325,.003,.257,0,.301,-.109,black,.001);
 for(const x of [-.087,.087])v.box(.170,.248,.281,x,.427,-.109,graphite,.023);
 // The top is hollow with two individually moulded tank rims and handles.
 for(const x of [-.085,.085]){
  v.part(rim(.162,.259,.027,.010),graphite,x,.551,-.109);
  v.box(.140,.018,.234,x,.533,-.109,black,.020);
  v.part(rim(.145,.237,.025,.006),graphite,x,.540,-.109);
  v.box(.103,.008,.015,x,.553,-.200,graphite,.005);
  for(const dx of [-.047,.047])v.box(.008,.014,.014,x+dx,.546,-.200,graphite,.003);
 }
 v.box(.0028,.019,.0012,-.142,.510,.042,indicator,.001);
 v.label('roborock',.060,.013,-.105,.280,.046,{color:'#9b9d9c'});
 for(const side of [-1,1])for(let n=0;n<8;n++)v.box(.001,.027,.003,side*.171,.213,-.198+n*.009,black,.001);
 // A low cylindrical robot with a convex lid, sprung bumper and glossy
 // front optical recess; it is not a flat disc or a box under the dock.
 v.setFloor(.023);
 const profile=[[0,.009],[.142,.009],[.161,.014],[.171,.023],[.175,.036],[.175,.055],[.173,.067],[.168,.079],[.158,.084],[.120,.086],[0,.087]];
 v.part(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),192),graphite,0,0,.183);
 // Separate curved bumper skin follows the circular body and its real seam.
 function band(radius,y0,y1,start,end){
  const pos=[],uv=[],idx=[],steps=100;
  for(let n=0;n<=steps;n++){const a=start+(end-start)*n/steps;for(const y of [y0,y1]){pos.push(Math.sin(a)*radius,y,Math.cos(a)*radius);uv.push(n/steps,y===y0?0:1);}if(n<steps){const k=n*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 v.part(band(.1753,.023,.060,-1.28,1.28),black,0,0,.183);
 v.part(band(.1759,.033,.056,-.32,.32),lens,0,0,.183);
 v.part(band(.1761,.029,.031,-1.1,1.1),satin,0,0,.183);
 v.part(new THREE.TorusGeometry(.165,.0007,8,160),black,0,.080,.183,1,1,1,Math.PI/2);
 v.cylinder(.043,.023,0,.098,.127,graphite);
 v.cylinder(.0395,.002,0,.110,.127,black);
 v.cylinder(.044,.0015,0,.0865,.127,metal);
 // Recessed lidar slots and the gold-coloured top emblem.
 for(const a of [-1.1,-.55,0,.55,1.1])v.box(.014,.007,.002,Math.sin(a)*.043,.099,.127+Math.cos(a)*.043,black,.001,0,a);
 v.label('Z',.025,.020,0,.112,.127,{rx:-Math.PI/2,color:'#a7a08c',italic:true});
 for(const x of [-.020,.020])v.cylinder(.007,.0008,x,.087,.225,black);
 v.label('⌂  ⏻',.055,.012,0,.088,.225,{rx:-Math.PI/2,color:'#777c7c'});
 v.box(.272,.0008,.001,0,.085,.169,black,.0003);
 for(const x of [-.139,.139])v.cylinder(.027,.026,x,.024,.183,rubber,0,0,Math.PI/2);
 for(const x of [-.072,.072])v.cylinder(.062,.013,x,.007,.128,rubber);
 for(let n=0;n<3;n++)v.box(.054,.002,.003,-.141,.009,.260,black,.001,0,n*Math.PI*2/3);
 v.setFloor(0);
 for(const x of [-.073,.073])v.cylinder(.061,.003,x,.033,-.020,black);
 for(let n=0;n<5;n++)v.box(.280,.0015,.002,0,.035,.264+n*.016,satin,.001);
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
