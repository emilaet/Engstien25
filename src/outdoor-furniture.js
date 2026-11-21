import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {fabricMaps,oakMaps} from './visual-materials.js';
import {contactShadows} from './contact-shadows.js';
import {buildGardenPot} from './garden-botany.js';
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
 const olive=material('olive-linen','#a2a083',{...fabric,bumpScale:.003});
 const throwFabric=material('woven-throw','#c4b69c',{...fabric,bumpScale:.004});
 const fruit=material('table-fruit','#c5a15e');
 const canopyCloth=material('ivory-parasol-cloth','#eee5d4',{...fabric,bumpScale:.002,side:THREE.DoubleSide});
 const lanternGlass=material('lantern-glass','#e9dfbd',{transparent:true,opacity:.18,depthWrite:false,roughness:.14});
 const candle=material('lantern-candle','#eee0ba',{emissive:'#ffb35a',emissiveIntensity:0});
 const flame=material('lantern-flame','#ffe5a1',{emissive:'#ffc16d',emissiveIntensity:0});
 const flames=[];
 const geometries=new Map(),unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,20),leafGeometry=new THREE.SphereGeometry(1,7,5);
 const transform=new THREE.Object3D();
 const rounded=(w,h,d,r=.035)=>{r=Math.min(r,w/2.2,h/2.2,d/2.2);const key=[w,h,d,r].join(':');if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,4,r));return geometries.get(key);};
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

 dining.cylinder(.16,.025,.16,0,.789,.45,ceramic);
 for(const [x,z]of [[-.07,.42],[.055,.40],[.01,.52]])dining.part(leafGeometry,fruit,x,.84,z,.055,.06,.055);
 for(const z of [-.70,.70])dining.cylinder(.035,.09,.035,.27,.82,z,ceramic);
 dining.finish();

 const spec=outdoorPlacement.parasol,canopy=spec.canopy;
 const parasol=assembly('outdoor-cantilever-parasol',spec.x,spec.z);
 parasol.soft(.84,.09,.84,0,.045,0,dark,.015);
 parasol.box(.10,2.94,.08,0,1.55,0,dark);
 const cx=canopy.x-spec.x,cz=canopy.z-spec.z;
 function strut(from,to,width){const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a),matrix=new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()),new THREE.Vector3(1,1,1));parasol.part(unitBox,dark,0,0,0,width,direction.length(),width,0,matrix);}
 strut([0,3.01,0],[cx,3.17,cz],.055);
 strut([0,2.05,0],[cx*.58,3.10,cz*.58],.035);
 strut([cx,3.17,cz],[cx,canopy.peak,cz],.035);
 // A curved square canopy with eight fabric panels, a stitched hem and
 // batched ribs. No imported asset or additional shadow-casting lights.
 const perimeter=[[-.5,-.5],[0,-.5],[.5,-.5],[.5,0],[.5,.5],[0,.5],[-.5,.5],[-.5,0]],clothPositions=[],hemPositions=[];
 const edgeY=i=>canopy.edge+(i%2===0?.055:0);
 const panelPoint=(i,t)=>[cx+perimeter[i][0]*canopy.width*t,canopy.peak-(canopy.peak-edgeY(i))*Math.pow(t,1.35),cz+perimeter[i][1]*canopy.depth*t];
 for(let i=0;i<8;i++){
  const next=(i+1)%8;
  for(let segment=0;segment<5;segment++){const t=segment/5,u=(segment+1)/5,a=panelPoint(i,t),b=panelPoint(next,t),c=panelPoint(i,u),d=panelPoint(next,u);clothPositions.push(...a,...c,...d,...a,...d,...b);}
  const a=panelPoint(i,1),b=panelPoint(next,1),c=[a[0],a[1]-.065,a[2]],d=[b[0],b[1]-.065,b[2]];hemPositions.push(...a,...c,...d,...a,...d,...b);
 }
 function clothGeometry(positions){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from({length:positions.length/3},(_,i)=>[(positions[i*3]-cx)/canopy.width+.5,(positions[i*3+2]-cz)/canopy.depth+.5]).flat(),2));geometry.computeVertexNormals();return geometry;}
 parasol.part(clothGeometry([...clothPositions,...hemPositions]),canopyCloth,0,0,0);
 for(const diagonal of [false,true]){const end=diagonal?Math.hypot(canopy.width,canopy.depth)/2:canopy.width/2,edge=canopy.edge+(diagonal?.055:0);const curve=new THREE.CatmullRomCurve3(Array.from({length:6},(_,i)=>new THREE.Vector3(i/5,canopy.peak-(canopy.peak-edge)*Math.pow(i/5,1.35)-.016,0)));const rib=new THREE.TubeGeometry(curve,12,.008,5,false);for(let i=0;i<4;i++)parasol.part(rib,dark,cx,0,cz,end,1,1,-i*Math.PI/2-(diagonal?Math.PI/4:0));}
 const parasolRoot=parasol.finish();parasolRoot.userData={kind:'cantilever-parasol',canopy:{...canopy},mast:{x:spec.x,z:spec.z}};

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
 for(const [x,m,angle]of [[-.66,olive,-.15],[.67,cream,.17]]){const pillowFrame=new THREE.Matrix4().compose(new THREE.Vector3(x,.66,-1.08),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.18,angle,0)),new THREE.Vector3(1,1,1));lounge.soft(.39,.36,.13,0,0,0,m,.045,0,pillowFrame);}
 lounge.soft(.52,.028,.65,-.52,.482,-.86,throwFabric,.01);
 lounge.soft(.52,.065,.12,-.52,.515,-.60,throwFabric,.02);
 lounge.cylinder(.63,.045,.37,0,.365,.16,wood);
 for(const x of [-.40,.40])for(const z of [-.17,.17])lounge.box(.045,.34,.045,x,.17,.16+z,wood);
 lounge.cylinder(.11,.04,.085,.10,.41,.16,ceramic);lounge.cylinder(.04,.09,.04,-.20,.43,.18,ceramic);lounge.finish();

 for(const [index,p]of outdoorPlacement.lanterns.entries()){
  const lantern=assembly('outdoor-lantern-'+index,p.x,p.z),w=.18,h=p.height;
  for(const y of [.02,h])lantern.soft(w+.025,.025,w+.025,0,y,0,dark,.006);
  for(const x of [-w/2,w/2])for(const z of [-w/2,w/2])lantern.box(.012,h,.012,x,h/2,z,dark);
  for(const x of [-w/2,w/2])lantern.box(.004,h-.04,w, x,h/2,0,lanternGlass);
  for(const z of [-w/2,w/2])lantern.box(w,h-.04,.004,0,h/2,z,lanternGlass);
  lantern.cylinder(.045,h*.47,.045,0,h*.265,0,candle);
  lantern.part(leafGeometry,flame,0,h*.54,0,.012,.026,.012);
  lantern.box(.065,.012,.012,0,h+.055,0,dark);
  for(const x of [-.032,.032])lantern.box(.009,.05,.009,x,h+.027,0,dark);
  const group=lantern.finish();group.traverse(mesh=>{if(mesh.material===flame)flames.push(mesh);});
 }

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
  const pot=buildGardenPot({kind:index===0?'hydrangea':'olive',seed:58+index});pot.name='outdoor-pot-'+index;pot.position.set(p.x,outdoorY,p.z);root.add(pot);
 }
 const bouquet=buildGardenPot({bouquet:true});bouquet.position.set(outdoorPlacement.dining.x,outdoorY+.775,outdoorPlacement.dining.z);root.add(bouquet);

 const footprints=[
  {x:outdoorPlacement.dining.x,z:outdoorPlacement.dining.z,width:1.3,depth:2.6},
  {x:outdoorPlacement.lounge.x,z:outdoorPlacement.lounge.z-1,width:2.7,depth:1.1},
  ...[-1.25,1.25].map(x=>({x:outdoorPlacement.lounge.x+x,z:outdoorPlacement.lounge.z+1.1,width:.95,depth:1.1})),
  {x:outdoorPlacement.lounge.x,z:outdoorPlacement.lounge.z+.16,width:1.3,depth:.9},
  ...outdoorPlacement.pots.map(p=>({...p,width:.65,depth:.65}))
 ].map(p=>({...p,y:outdoorY}));root.add(contactShadows(footprints));
 root.userData={kind:'outdoor-presentation',editable:false};
 return {root,setDaylight(value){const glow=1-THREE.MathUtils.clamp(value,0,1);candle.emissiveIntensity=glow*.55;flame.emissiveIntensity=glow*2.5;for(const mesh of flames)mesh.visible=glow>.3;}};
}
