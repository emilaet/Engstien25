import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Real thin surfaces with a curled edge and a midrib. The same small geometry
// is instanced throughout the beds; no opaque ellipsoids stand in for leaves.
export function gardenLeafGeometry({width=.24,rows=12,cols=6,serration=0}={}){
 const p=[],uv=[],idx=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,w=width*Math.pow(Math.sin(Math.PI*t),.78)*(1+serration*Math.sin(t*Math.PI*16));
  p.push(u*w,t,.10*Math.abs(u)**1.7*Math.sin(Math.PI*t)-.13*t*t+.012*Math.sin(t*Math.PI));uv.push(i/cols,t);
  if(i<cols&&j<rows){const n=j*(cols+1)+i;idx.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function petalGeometry(){
 const p=[],uv=[],idx=[],rows=5,cols=4;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,w=.54*Math.sin(Math.PI*t*.94)**.55;p.push(u*w,t,.13*t*t+.10*u*u*Math.sin(Math.PI*t));uv.push(i/cols,t);
  if(i<cols&&j<rows){const n=j*(cols+1)+i;idx.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function merged(pieces){const out=mergeGeometries(pieces,false);for(const p of pieces)p.dispose();return out;}
function transformed(geometry,position,rotation,scale,color){
 const g=geometry.index?geometry.toNonIndexed():geometry.clone(),matrix=new THREE.Matrix4().compose(position,rotation,scale);g.applyMatrix4(matrix);
 if(color){const c=new Float32Array(g.attributes.position.count*3);for(let n=0;n<c.length;n+=3){c[n]=color.r;c[n+1]=color.g;c[n+2]=color.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));}return g;
}
function leafMaps(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1)*2-1,v=y/(size-1),vein=Math.exp(-Math.abs(u)*60)*42+Math.exp(-Math.abs(Math.sin((v-Math.abs(u)*.20)*Math.PI*9))*25)*17,h=100+vein+Math.sin(x*33+y*19)*3;data.set([h,h,h,255],(y*size+x)*4);
 }
 const t=new THREE.DataTexture(data,size,size);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;return t;
}
function ceramicGrain(){
 const size=128,data=new Uint8Array(size*size*4),random=seeded(91);
 for(let n=0;n<size*size;n++){const h=115+random()*30;data.set([h,h,h,255],n*4);}
 const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;return t;
}
export function gardenLeafMaterial(color='#64794a'){
 const m=new THREE.MeshStandardMaterial({color,roughness:.78,side:THREE.DoubleSide,bumpMap:leafMaps(),bumpScale:.0006});m.name='veined-garden-leaves';return m;
}
// One raceme is reused for every flowering stem. Each whorl is composed of
// individual cupped petals, leaving air between the florets.
export function lavenderHeadGeometry(){
 const pieces=[],petal=petalGeometry(),random=seeded(45);
 for(let level=0;level<11;level++)for(let n=0;n<5;n++){
  const a=n*Math.PI*.4+level*2.4,r=.012*(1-level/15),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(1.05,a,0));
  pieces.push(transformed(petal,new THREE.Vector3(Math.sin(a)*r,level*.009,Math.cos(a)*r),q,new THREE.Vector3(.012,.016+random()*.004,.012)));
 }
 petal.dispose();return merged(pieces);
}

// Five static material batches per planter, irrespective of flower count.
// Branches, leaves and flower heads all cast their own shadows.
export function buildGardenPot({kind='hydrangea',bouquet=false,seed=58}={}){
 const root=new THREE.Group();root.name=bouquet?'garden-table-bouquet':'garden-'+kind;const random=seeded(seed),leaf=gardenLeafGeometry({width:kind==='olive'?.12:.34,serration:kind==='olive'?0:.035}),petal=petalGeometry(),leafParts=[],stemParts=[],flowerParts=[],up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3(0,0,1);
 const leafMat=gardenLeafMaterial(kind==='olive'?'#7a8865':'#537348');leafMat.vertexColors=true;
 const stemMat=new THREE.MeshStandardMaterial({color:kind==='olive'?'#786950':'#667346',roughness:.9});stemMat.name='branching-garden-stems';
 const flowerMat=new THREE.MeshStandardMaterial({color:'#fff5d9',roughness:.72,side:THREE.DoubleSide,vertexColors:true});flowerMat.name='ivory-flower-petals';
 const grain=ceramicGrain(),potMat=new THREE.MeshStandardMaterial({color:'#b4a38a',roughness:.85,bumpMap:grain,bumpScale:.0015});potMat.name='textured-garden-ceramic';
 const profile=[[0,0],[.16,0],[.19,.012],[.23,.16],[.265,.32],[.261,.425],[.250,.455],[.238,.455],[.233,.431],[.224,.383]];
 const add=(geometry,material,name)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;};
 add(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),72),potMat,'hollow-turned-garden-pot');
 const soil=add(new THREE.CylinderGeometry(.226,.226,.010,40),new THREE.MeshStandardMaterial({color:'#493c2b',roughness:1,bumpMap:grain,bumpScale:.004}),'garden-pot-substrate');soil.position.y=.403;
 function branch(a,b,r=.003){stemParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,a.clone().lerp(b,.55).add(new THREE.Vector3(.012,.018,0)),b]),6,r,5,false));}
 function foliage(at,heading,size,tilt){const direction=new THREE.Vector3(Math.cos(heading),tilt,Math.sin(heading)).normalize(),across=new THREE.Vector3().crossVectors(direction,up).normalize(),n=new THREE.Vector3().crossVectors(across,direction).normalize(),q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,direction,n)),color=new THREE.Color().setRGB(.78+random()*.22,.82+random()*.18,.70+random()*.3);leafParts.push(transformed(leaf,at,q,new THREE.Vector3(size,size,size),color));}
 function flowerHead(center,radius){
  for(let n=0;n<48;n++){
   const a=n*2.399,y=1-2*(n+.5)/48,r=Math.sqrt(1-y*y),direction=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),at=center.clone().addScaledVector(direction,radius*(.8+random()*.2)),facing=new THREE.Quaternion().setFromUnitVectors(normal,direction),tint=new THREE.Color().setRGB(.82+random()*.18,.87+random()*.13,.65+random()*.24);
   for(let k=0;k<4;k++){const q=facing.clone().multiply(new THREE.Quaternion().setFromAxisAngle(normal,k*Math.PI/2+.08));flowerParts.push(transformed(petal,at,q,new THREE.Vector3(.015,.021,.015),tint));}
  }
 }
 if(kind==='olive'){
  const base=new THREE.Vector3(0,.405,0),top=new THREE.Vector3(.028,1.26,-.015);branch(base,top,.014);
  for(let n=0;n<24;n++){
   const t=.32+n*.026,a=n*2.399,end=base.clone().lerp(top,t).add(new THREE.Vector3(Math.cos(a)*(.15+random()*.14),.08,Math.sin(a)*(.15+random()*.14)));branch(base.clone().lerp(top,t-.12),end,.003);
   for(let k=0;k<9;k++){const at=base.clone().lerp(top,t-.12).lerp(end,.4+k*.07);for(const side of [-1,1])foliage(at,a+side*.72,.07+random()*.035,.1+random()*.7);}
  }
 }else{
  for(let n=0;n<7;n++){
   const a=n*2.399,r=n===0?0:.12+random()*.10,top=new THREE.Vector3(Math.cos(a)*r,.69+random()*.20,Math.sin(a)*r),base=new THREE.Vector3(Math.cos(a)*.04,.405,Math.sin(a)*.04);branch(base,top,.0035);
   for(let k=0;k<4;k++){const at=base.clone().lerp(top,.25+k*.16);foliage(at,a+k*2.4,.13+random()*.07,.25+random()*.50);}
   flowerHead(top,.065+random()*.015);
  }
 }
 if(stemParts.length)add(merged(stemParts),stemMat,'garden-branch-network');
 if(leafParts.length)add(merged(leafParts),leafMat,'curved-garden-leaves');
 if(flowerParts.length)add(merged(flowerParts),flowerMat,'hydrangea-florets');
 leaf.dispose();petal.dispose();if(bouquet)root.scale.setScalar(.34);root.userData={kind,botanical:true,bouquet};return root;
}
