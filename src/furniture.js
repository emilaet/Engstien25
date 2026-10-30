import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {finishedFloor} from './architecture.js';
import {oakMaps,fabricMaps,softContactTexture} from './visual-materials.js';

function grain(kind){
 const n=64,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const seed=((x*73856093)^(y*19349663))>>>0;const noise=(seed%101)/100;const diamond=Math.abs(x%32-16)+Math.abs(y%32-16);const value=kind==='rug'?(Math.abs(diamond-16)<1.3?105:235+noise*15):kind==='wood'?224+Math.sin(x*.4+Math.sin(y*.09)*2)*8+noise*15:225+noise*30;const p=(y*n+x)*4;data[p]=data[p+1]=data[p+2]=value;data[p+3]=255;}
 const texture=new THREE.DataTexture(data,n,n);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==='rug'?1:kind==='wood'?3:10,kind==='rug'?1:kind==='wood'?1:10);texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function buildFurnishings(scene,snapshot){
 const root=new THREE.Group();root.name='home-furnishings';scene.add(root);let groups=new Map(),selected=null,visible=true;
 const wood=oakMaps(),fabric=fabricMaps(),contact=softContactTexture();const textures={wood:wood.map,fabric:fabric.map,rug:grain('rug')},materials=new Map(),geometries=new Map();
 const mat=(color,type='fabric')=>{const key=color+type;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:type==='steel'?.24:type==='mirror'?.07:type==='ceramic'?.22:type==='stone'?.62:.9,metalness:type==='steel'?.45:type==='mirror'?.15:0,emissive:type==='mirror'?'#b7c7bf':'#000000',emissiveIntensity:type==='mirror'?.12:0,map:textures[type]||null,bumpMap:type==='wood'?wood.bumpMap:type==='fabric'?fabric.bumpMap:null,bumpScale:type==='wood'?.003:.009,roughnessMap:type==='wood'?wood.roughnessMap:null}));return materials.get(key);};
 const oak=()=>mat('#c7ae84','wood'),cream=()=>mat('#eee9df'),steel=()=>mat('#a8aca7','steel'),dark=()=>mat('#343b37'),stone=()=>mat('#e2d8c2','stone'),white=()=>mat('#eeeee7','ceramic');
 function mesh(group,geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function rounded(g,w,h,d,x,y,z,m,r=.045){r=Math.min(r,w/2.1,h/2.1,d/2.1);const key=[w,h,d,r].join(',');if(!geometries.has(key))geometries.set(key,new RoundedBoxGeometry(w,h,d,r>=.035?4:1,r));return mesh(g,geometries.get(key),m,x,y,z);}
 function box(g,w,h,d,x,y,z,m){return rounded(g,w,h,d,x,y,z,m,.004);}
 function cylinder(g,r,h,x,y,z,m,rTop=r){const key=['c',r,rTop,h].join(',');if(!geometries.has(key))geometries.set(key,new THREE.CylinderGeometry(rTop,r,h,24));return mesh(g,geometries.get(key),m,x,y,z);}
 function tube(g,points,r,m){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const geometry=new THREE.TubeGeometry(curve,16,r,6,false);const key='tube-'+geometries.size;geometries.set(key,geometry);return mesh(g,geometry,m,0,0,0);}
 function legs(g,w,d,y,h,m){for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])cylinder(g,.025,h,x,y,z,m);}
 function cushion(g,w,h,d,x,y,z,color){const m=rounded(g,w,h,d,x,y,z,mat(color),.09);const shape=m.geometry.clone(),positions=shape.attributes.position;
  for(let n=0;n<positions.count;n++){const px=positions.getX(n)/(w/2),py=positions.getY(n)/(h/2),pz=positions.getZ(n);const bulge=.025*Math.max(0,1-px*px)*Math.max(0,1-py*py);positions.setZ(n,pz+Math.sign(pz)*bulge);}shape.computeVertexNormals();m.geometry=shape;geometries.set('pillow-'+geometries.size,shape);m.rotation.x=-.08;return m;}

 function sofa(g,i){const w=i.width,d=i.depth,h=i.height,m=mat(i.color,i.material),arm=Math.min(.24,w*.13);rounded(g,w,.21,d,0,.19,0,m,.08);rounded(g,w-2*arm,h*.42,.19,0,h*.77,d/2-.12,m,.075);for(const x of [-1,1])rounded(g,arm,h*.67,d,x*(w-arm)/2,h*.44,0,m,.075);const seats=i.type==='armchair'?1:2;for(let s=0;s<seats;s++){const x=(s-(seats-1)/2)*(w-2*arm)/seats;rounded(g,(w-2*arm)/seats-.025,.19,d-.25,x,.43,-.08,m,.09);const back=cushion(g,(w-2*arm)/seats-.035,h*.46,.18,x,h*.73,d/2-.23,i.color);back.rotation.x=.1;}legs(g,w-.24,d-.18,.05,.1,dark());for(const [x,color]of [[-w*.28,'#a4937b'],[w*.24,'#c2b198']]){const p=cushion(g,.37,.36,.12,x,.66,.10,color);p.rotation.z=x<0?.12:-.12;}}
 function bed(g,i,child=false){const w=i.width,d=i.depth,h=i.height,m=mat(i.color,i.material);rounded(g,w,.30,d-.1,0,.23,.04,m,.08);rounded(g,w,.04,d-.1,0,.09,.04,dark(),.015);rounded(g,w,h,.12,0,h/2,-d/2+.06,m,.09);rounded(g,w-.07,.17,d-.19,0,.46,.04,white(),.075);const cover=rounded(g,w-.045,.10,d*.62,0,.57,d*.16,mat(child?i.color:'#e7e0d1'),.075);cover.rotation.x=.008;const linenGeometry=new THREE.PlaneGeometry(w-.09,d*.60,16,20);linenGeometry.rotateX(-Math.PI/2);const linenPositions=linenGeometry.attributes.position;for(let n=0;n<linenPositions.count;n++){const lx=linenPositions.getX(n),lz=linenPositions.getZ(n),edge=Math.max(0,1-(lx/(w/2))**4);linenPositions.setY(n,.008+edge*(.009*Math.sin(lx*16+lz*7)+.008*Math.sin(lz*24)+.014*Math.exp(-(((lz+.35)/.12)**2))));}linenGeometry.computeVertexNormals();geometries.set('linen-'+i.id,linenGeometry);mesh(g,linenGeometry,mat(child?i.color:'#e7e0d1'),0,.625,d*.16);for(const x of child?[0]:[-w*.23,w*.23])cushion(g,child?w*.75:w*.43,.14,.45,x,.61,-d*.30,'#eee8dd');rounded(g,w-.07,.035,.28,0,.64,d*.07,mat(child?'#b3ad9f':'#c5b49b'),.015);if(child){for(const x of [-1,1])rounded(g,.055,.16,d*.45,x*(w/2-.02),.57,-d*.18,oak(),.018);}}
 function chair(g,x,z,angle=0,upholstered=false){const c=new THREE.Group();g.add(c);c.position.set(x,0,z);c.rotation.y=angle;rounded(c,.49,.055,.46,0,.45,0,upholstered?cream():oak(),.055);legs(c,.39,.36,.22,.44,oak());const points=[];for(let k=0;k<=8;k++){const a=-Math.PI*.35+k/8*Math.PI*.7;points.push([Math.sin(a)*.28,.77,.08+Math.cos(a)*.16]);}tube(c,points,.045,oak());for(const x of [-.22,.22])box(c,.025,.30,.025,x,.61,.14,oak());}
 function ribbedBase(g,w,d,h,z,m){rounded(g,w,h,d,0,h/2,z,m,.08);const count=12;for(let k=0;k<count;k++){const x=-w/2+.03+k*(w-.06)/(count-1);rounded(g,.018,h*.96,.015,x,h/2,z+d/2+.006,m,.005);rounded(g,.018,h*.96,.015,x,h/2,z-d/2-.006,m,.005);}}
 function dining(g,i){const w=i.width,d=i.depth,h=i.height,m=mat(i.color,i.material);rounded(g,w,.045,d,0,h-.022,0,mat('#dbc6a5','wood'),.11);for(const z of [-d*.28,d*.28])ribbedBase(g,w*.66,.34,h-.06,z,m);for(const x of [-1,1])for(let n=0;n<3;n++)chair(g,x*(w/2+.32),(n-1)*d*.31,x<0?-Math.PI/2:Math.PI/2);}
 function coffee(g,i){const m=mat(i.color,i.material);rounded(g,i.width,.055,i.depth,0,i.height-.027,0,m,.16);rounded(g,i.width*.62,i.height-.06,i.depth*.62,0,(i.height-.06)/2,0,m,.12);}
 function plant(g,i){cylinder(g,.17,.32,0,.16,0,mat(i.color,'stone'),.21);const green=mat('#748464');for(let k=0;k<9;k++){const angle=k*2.4,y=.4+(k%4)*.12,x=Math.sin(angle)*.17,z=Math.cos(angle)*.17;const leaf=mesh(g,new THREE.SphereGeometry(.16,7,5),green,x,y,z);geometries.set('leaf-'+geometries.size,leaf.geometry);leaf.scale.set(.7,1.5,.6);leaf.rotation.z=Math.sin(angle)*.5;}}
 function cabinet(g,i,columns=3,includeTop=true,front=1){
  const m=mat(i.color,i.material),w=i.width,d=i.depth,h=i.height,plinth=Math.min(.166,h*.19),top=h-.03,bodyH=top-plinth;
  box(g,w-.06,plinth,d-.05,0,plinth/2,0,mat('#9c8b72','wood'));
  for(const x of [-1,1])box(g,.025,bodyH,d,x*(w/2-.0125),plinth+bodyH/2,0,m);
  box(g,w,bodyH,.025,0,plinth+bodyH/2,-front*(d/2-.0125),m);box(g,w,.025,d,0,plinth+.0125,0,m);
  const widths=Array.isArray(columns)?columns:Array.from({length:columns},()=>w/columns),sum=widths.reduce((n,v)=>n+v,0);let left=-sum/2;
  for(const width of widths){const x=left+width/2;left+=width;for(let row=0;row<2;row++){const y=plinth+(row+.5)*bodyH/2;const panel=box(g,width-.015,bodyH/2-.012,.02,x,y,front*(d/2+.012),m);panel.name='cabinet-front';box(g,Math.min(.30,width-.08),.018,.035,x,y+bodyH/4-.06,front*(d/2+.035),steel());}}
  if(includeTop)box(g,w+.025,.03,d+.025,0,h-.015,0,stone());
 }
 function tap(g,x,y,z,direction=1,compact=false){
  const rise=compact?.19:.28,reach=compact?.10:.16;
  const base=cylinder(g,.023,.025,x,y+.0125,z,steel());base.name='tap-base';
  tube(g,[[x,y,z],[x,y+rise-.03,z],[x,y+rise+.035,z+direction*reach*.45],[x,y+rise,z+direction*reach]],.014,steel());
  const outlet=cylinder(g,.013,.012,x,y+rise-.006,z+direction*reach,steel());outlet.name='tap-outlet';
 }
 function sink(g,x,y,z,w=.4,d=.32,kind='steel',tapDirection=1){
  const bowlMaterial=kind==='ceramic'?mat('#d9ded5','ceramic'):kind==='black'?mat('#353e38','stone'):mat('#8b9894','steel');
  const bottom=rounded(g,w-.02,.015,d-.02,x,y-.095,z,bowlMaterial,.035);bottom.name='sink-bowl';
  for(const side of [-1,1]){box(g,.018,.10,d,x+side*(w/2-.009),y-.045,z,bowlMaterial);box(g,w,.10,.018,x,y-.045,z+side*(d/2-.009),bowlMaterial);}
  const drain=cylinder(g,.025,.005,x,y-.084,z,steel());drain.name='sink-drain';
  tap(g,x,y,z-tapDirection*(d/2+.045),tapDirection,kind==='ceramic');
 }
 function worktop(g,w,d,y,material,basin){
  if(!basin){box(g,w,.025,d,0,y-.0125,0,material);return;}
  const shape=new THREE.Shape();shape.moveTo(-w/2,-d/2);shape.lineTo(w/2,-d/2);shape.lineTo(w/2,d/2);shape.lineTo(-w/2,d/2);shape.closePath();
  const [x,z,bw,bd]=basin,path=new THREE.Path();path.moveTo(x-bw/2,-z-bd/2);path.lineTo(x-bw/2,-z+bd/2);path.lineTo(x+bw/2,-z+bd/2);path.lineTo(x+bw/2,-z-bd/2);path.closePath();shape.holes.push(path);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false});geometries.set('worktop-'+geometries.size,geometry);const top=mesh(g,geometry,material,0,y-.025,0);top.rotation.x=-Math.PI/2;top.name='worktop-with-basin-opening';
 }
 function kitchen(g,i){const h=i.height,w=i.width,d=i.depth,m=mat(i.color,'wood');
  if(i.type==='kitchenTowers'){box(g,w,h,d,0,h/2,0,m);for(const z of [-d*.25,d*.25]){box(g,.016,h-.1,d*.49,-w/2-.008,h/2,z,m);box(g,.025,.60,.02,-w/2-.025,h*.62,z,steel());}box(g,.025,.49,.49,-w/2-.028,1.15,-d*.25,steel());box(g,.03,.37,.40,-w/2-.045,1.15,-d*.25,dark());return;}
  cabinet(g,i,i.type==='kitchenRear'?[.4,.76,.8,.8,.4]:3,false,i.type==='kitchenRear'?1:-1);
  worktop(g,w+.025,d+.025,h,stone(),i.type==='kitchenRear'?null:[-w*.14,-d*.13,.42,.34]);
  if(i.type==='kitchenRear'){rounded(g,.68,.018,.46,-w*.24,h+.04,0,dark(),.02);for(const x of [-.17,.17])for(const z of [-.12,.12])cylinder(g,.075,.005,-w*.24+x,h+.052,z,mat('#626861','steel'));}
  else{sink(g,-w*.14,h,-d*.13,.42,.34,'black',-1);for(const x of [-.57,.1]){const c=new THREE.Group();c.position.set(x,0,d/2+.30);g.add(c);legs(c,.30,.30,.31,.62,dark());rounded(c,.40,.065,.36,0,.66,0,dark(),.065);rounded(c,.40,.15,.045,0,.76,.15,dark(),.04);}}
 }
 function wardrobe(g,i){const m=mat(i.color,i.material);box(g,i.width,i.height,i.depth,0,i.height/2,0,m);const side=i.depth>i.width;const count=Math.max(2,Math.round((side?i.depth:i.width)/.5));for(let k=0;k<count;k++){const t=(k-(count-1)/2)*(side?i.depth:i.width)/count;if(side){box(g,.015,i.height-.04,i.depth/count-.015,i.width/2+.012,i.height/2,t,m);box(g,.025,.22,.025,i.width/2+.03,1.02,t,steel());}else{box(g,i.width/count-.015,i.height-.04,.015,t,i.height/2,i.depth/2+.012,m);box(g,.025,.22,.025,t,1.02,i.depth/2+.03,steel());}}}
 function shelf(g,i,toys=false){const m=mat(i.color,i.material),w=i.width,h=i.height,d=i.depth;for(const x of [-1,1])box(g,.035,h,d,x*(w/2-.018),h/2,0,m);for(let k=0;k<4;k++)box(g,w,.035,d,0,.05+k*(h-.08)/3,0,m);box(g,w,h,.025,0,h/2,-d/2,m);for(let k=0;k<6;k++){const y=.12+Math.floor(k/3)*(h-.08)/3,x=(k%3-1)*w*.27;if(toys){rounded(g,.24,.16,d*.75,x,y+.045,0,mat(k%2?'#c5bb9b':'#c0cbb3'),.025);}else for(let n=0;n<3;n++)box(g,.035,.16,d*.65,x+n*.04,y+.04,0,mat(['#a7b29c','#b6a88e','#e5dfcf'][n]));}}
 function vanity(g,i){
  const w=i.width,d=i.depth,bottom=.279,bodyH=.576,top=bottom+bodyH,m=mat(i.color,'wood');
  for(const x of [-1,1])box(g,.025,bodyH,d,x*(w/2-.0125),bottom+bodyH/2,0,m);box(g,w,.025,d,0,bottom+.0125,0,m);box(g,w,bodyH,.02,0,bottom+bodyH/2,-d/2+.01,m);const columns=i.room==='bad1'?[.4,.6,.4]:[1.0],total=columns.reduce((a,b)=>a+b,0);let left=-total/2;
  for(const width of columns){const x=left+width/2;left+=width;for(let row=0;row<8;row++){const front=rounded(g,width-.008,bodyH/8-.012,.035,x,bottom+(row+.5)*bodyH/8,d/2+.01,m,.006);front.name='vanity-horizontal-profile';}}
  // Hollow top/basin; no dark stainless rectangle on top of a solid worktop.

  worktop(g,w,d,top,white(),[0,.015,Math.min(.52,w*.6),.30]);sink(g,0,top,.015,Math.min(.52,w*.6),.30,'ceramic');
  const mirror=box(g,i.room==='bad1'?1.50:1.0,.85,.018,0,1.525,-d/2+.005,mat('#dbe3dc','mirror'));mirror.name='wall-mirror';
  box(g,i.room==='bad1'?1.52:1.02,.87,.012,0,1.525,-d/2-.006,steel());
 }
 function slidingWardrobe(g,i){
  const w=i.width,d=i.depth,h=i.height,m=mat(i.color,'ceramic');box(g,w,h,d,0,h/2,0,m);
  for(const [index,x]of [[0,-w/4],[1,w/4]]){const panel=box(g,w/2+.025,h-.06,.025,x,h/2,d/2+.02+index*.025,m);panel.name=index?'sliding-right':'sliding-left';for(const side of [-1,1])box(g,.012,h-.045,.032,x+side*(w/4-.006),h/2,d/2+.038+index*.025,steel());}
  for(const y of [.02,h-.02])box(g,w,.025,.09,0,y,d/2+.025,steel());
 }
 function entryBench(g,i){
  const w=i.width,d=i.depth,m=mat(i.color,'wood'),bottom=.166,h=.320;box(g,w,h,d,0,bottom+h/2,0,m);for(let col=0;col<2;col++)for(let row=0;row<5;row++)rounded(g,w/2-.012,h/5-.012,.025,(col-.5)*w/2,bottom+(row+.5)*h/5,d/2+.01,m,.005);
  const seat=box(g,w+.012,.025,d+.012,0,bottom+h+.0125,0,m);seat.name='bench-seat';
  for(const [x,y,r]of [[-.40,1.55,.045],[-.26,1.35,.055],[.03,1.47,.04],[.20,1.33,.065],[.39,1.66,.04]]){const hook=cylinder(g,r,.035,x,y,-d/2+.025,m);hook.rotation.x=Math.PI/2;hook.name='entry-wall-hook';}
  box(g,w-.08,.025,.3,0,.09,0,m);
 }
 function entryConsole(g,i){
  const m=mat(i.color,'steel');box(g,i.width,.025,i.depth,0,.80,0,m);box(g,i.width,.02,i.depth,0,.18,0,m);for(const x of [-1,1])for(const z of [-1,1])box(g,.018,.80,.018,x*(i.width/2-.01),.40,z*(i.depth/2-.01),m);
  const frame=cylinder(g,.41,.018,0,1.50,-i.depth/2+.015,m);frame.rotation.x=Math.PI/2;const mirror=cylinder(g,.395,.019,0,1.50,-i.depth/2+.029,mat('#dbe3dc','mirror'));mirror.rotation.x=Math.PI/2;mirror.name='round-entry-mirror';
 }
 function childBench(g,i){const m=mat(i.color,'wood');box(g,i.width,.055,i.depth,0,.27,0,m);legs(g,i.width-.07,i.depth-.06,.12,.24,m);cushion(g,i.width-.04,.05,i.depth-.03,0,.32,0,'#ded4bd');for(let k=0;k<5;k++)box(g,.018,.22,.018,(k-2)*i.width/5,.43,i.depth/2-.02,m);box(g,i.width,.025,.025,0,.55,i.depth/2-.02,m);}
 function utility(g,i){
  const w=i.width,d=i.depth,h=i.height,m=mat(i.color,'ceramic'),bay=.60;
  const dryerX=w/2-.316,washerX=dryerX-bay,sinkX=washerX-bay,cabinetX=sinkX-bay;
  for(const [x,name]of [[dryerX,'dryer'],[washerX,'washer']]){rounded(g,.59,.845,.55,x,.427,0,m,.015);box(g,.57,.095,.022,x,.78,d/2+.012,m);const knob=cylinder(g,.026,.014,x+.15,.79,d/2+.03,steel());knob.rotation.x=Math.PI/2;
   const ring=cylinder(g,.205,.026,x,.43,d/2+.024,m);ring.rotation.x=Math.PI/2;const front=cylinder(g,.166,.029,x,.43,d/2+.043,name==='washer'?mat('#596562','ceramic'):mat('#e2e5dc','ceramic'));front.rotation.x=Math.PI/2;front.name=name+'-front';}
  for(const x of [sinkX,cabinetX]){box(g,.585,.70,.025,x,.51,d/2+.012,m);box(g,.025,.70,d,x-.297,.51,0,m);}
  box(g,1.20,.12,d-.05,(sinkX+cabinetX)/2,.06,0,mat('#a5a698','ceramic'));
  worktop(g,w+.025,d+.025,h,mat('#cfb996','wood'),[sinkX,0,.44,.35]);sink(g,sinkX,h,0,.44,.35,'steel');
 }
 function toilet(g,i){const m=white();rounded(g,i.width*.8,.28,i.depth*.8,0,.23,.015,m,.1);rounded(g,i.width,.075,i.depth,0,.41,0,m,.14);rounded(g,i.width*.66,.012,i.depth*.62,0,.455,.015,mat('#d3d5ce','ceramic'),.1);rounded(g,i.width*.72,.06,.17,0,.45,-i.depth*.33,m,.04);}
 function shower(g,i){box(g,i.width,.025,i.depth,0,.015,0,mat(i.color,'stone'));const glass=new THREE.MeshPhysicalMaterial({color:'#cbd8ce',transparent:true,opacity:.16,roughness:.15,depthWrite:false,side:THREE.DoubleSide});materials.set('glass-'+i.id,glass);box(g,.016,i.height,i.depth,(i.showerGlassSide||1)*i.width/2,i.height/2,0,glass);tube(g,[[0,.9,-i.depth/2+.07],[0,1.82,-i.depth/2+.07],[0,1.84,0]],.012,steel());cylinder(g,.10,.02,0,1.82,0,steel());}
 function desk(g,i){const m=mat(i.color,i.material);const top=rounded(g,i.width,.045,i.depth,0,i.height-.022,0,m,.04);top.name='desk-top';legs(g,i.width-.12,i.depth-.10,(i.height-.05)/2,i.height-.05,steel());chair(g,0,i.depth/2+.38,0,true);box(g,.5,.31,.03,0,i.height+.20,-.16,dark());box(g,.025,.14,.025,0,i.height+.05,-.16,steel());}
 function model(g,i){switch(i.type){case 'sofa':sofa(g,i);break;case 'armchair':sofa(g,{...i,width:i.width});break;case 'bed':bed(g,i);break;case 'childBed':bed(g,i,true);break;case 'coffee':coffee(g,i);break;case 'dining':dining(g,i);break;case 'plant':plant(g,i);break;case 'rug':rounded(g,i.width,i.height,i.depth,0,i.height/2,0,mat(i.color,['v1','v2'].includes(i.room)?'rug':'fabric'),.04);break;case 'bedside':cabinet(g,i,1);break;case 'wardrobe':wardrobe(g,i);break;case 'slidingWardrobe':slidingWardrobe(g,i);break;case 'entryBench':entryBench(g,i);break;case 'entryConsole':entryConsole(g,i);break;case 'childBench':childBench(g,i);break;case 'shelf':shelf(g,i);break;case 'toyStorage':shelf(g,i,true);break;case 'vanity':vanity(g,i);break;case 'toilet':toilet(g,i);break;case 'shower':shower(g,i);break;case 'desk':desk(g,i);break;case 'kitchenRear':case 'kitchenIsland':case 'kitchenTowers':kitchen(g,i);break;case 'console':cabinet(g,{...i,height:.46},4);box(g,i.width*.66,.69,.035,0,.90,-.12,dark());break;case 'utility':utility(g,i);break;}}
 function disposeGeometry(){for(const geometry of geometries.values())geometry.dispose();geometries.clear();}
 function setSnapshot(value){for(const [key,m]of materials)if(key.startsWith('outline-')||key.startsWith('glass-')){m.dispose();materials.delete(key);}root.clear();groups.clear();disposeGeometry();visible=value.visible;root.visible=visible;for(const i of value.items){const g=new THREE.Group();g.name=i.id;g.userData.furnitureId=i.id;g.userData.room=i.room;g.userData.furniture=i;g.position.set(i.x,finishedFloor,i.z);g.rotation.y=i.rotation*Math.PI/180;g.visible=i.visible;root.add(g);groups.set(i.id,g);model(g,i);if(!['rug','plant','shower','entryConsole'].includes(i.type)){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(i.width*1.12,i.depth*1.12),new THREE.MeshBasicMaterial({map:contact,transparent:true,opacity:.28,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.name='contact-shadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=.009;shadow.raycast=()=>{};materials.set('outline-shadow-'+i.id,shadow.material);geometries.set('contact-shadow-'+i.id,shadow.geometry);g.add(shadow);}g.traverse(child=>{child.userData.furnitureId=i.id;child.userData.room=i.room;});const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,z])=>new THREE.Vector3(x*i.width/2,.035,z*i.depth/2))),new THREE.LineBasicMaterial({color:'#966f35',depthTest:true}));geometries.set('outline-'+i.id,outline.geometry);materials.set('outline-'+i.id,outline.material);outline.name='selection';outline.visible=i.id===selected;outline.renderOrder=6;g.add(outline);}}
 function select(id){selected=id;for(const [key,g]of groups)g.getObjectByName('selection').visible=key===id;}
 setSnapshot(snapshot);
 return {root,setSnapshot,select,get(id){return groups.get(id);},get visible(){return visible;},setVisible(value){visible=value;root.visible=value;},dispose(){disposeGeometry();for(const material of materials.values())material.dispose();new Set([...Object.values(textures),...Object.values(wood),...Object.values(fabric),contact]).forEach(t=>t.dispose());root.removeFromParent();}};
}
