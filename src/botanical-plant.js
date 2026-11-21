import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {chargerEnvironment} from './visual-materials.js';

function maps(albedo){
 const size=512,photographed=!!albedo&&typeof document!=='undefined',rgb=photographed?null:new Uint8Array(size*size*4),bump=new Uint8Array(size*size*4);
 if(!photographed)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1)*2-1,v=y/(size-1),rib=Math.exp(-Math.abs(u)*110),branch=Math.exp(-Math.abs(Math.sin((v-Math.abs(u)*.27)*Math.PI*12))*45),grain=Math.sin(x*127.1+y*311.7)*43758.5453%1;
  const variation=5*Math.sin(v*9)+grain*2,vein=rib*14+branch*4,p=(y*size+x)*4;
  rgb.set([57+variation+vein,104+variation*1.5+vein,32+variation*.4+vein*.45,255],p);
  const h=125+rib*65+branch*25+grain*3;bump.set([h,h,h,255],p);
 }
 const texture=(data,color)=>{const t=new THREE.DataTexture(data,size,size);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.needsUpdate=true;return t;};
 if(albedo&&typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.drawImage(albedo.image,0,0,size,size);const source=ctx.getImageData(0,0,size,size).data;for(let p=0;p<bump.length;p+=4){const h=source[p]*.25+source[p+1]*.65+source[p+2]*.1;bump.set([h,h,h,255],p);}}
 const map=albedo?.clone()||texture(rgb,true);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;map.needsUpdate=true;return {map,bumpMap:texture(bump,false)};
}

// A thin, smoothly cupped leaf with a tapered pointed silhouette. The midrib
// and lateral veins are shaded by a separate physical surface map.
export function broadLeafGeometry(){
 const positions=[],uv=[],indices=[],rows=28,cols=10;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,half=.29*Math.pow(Math.sin(Math.PI*t),.82)*(1-.16*t);
  positions.push(u*half,t,.065*Math.sin(Math.PI*t)*Math.pow(Math.abs(u),1.7)-.16*t*t+.012*Math.sin(Math.PI*t)*Math.exp(-Math.abs(u)*12));uv.push(i/cols,t);
  if(i<cols&&j<rows){const n=j*(cols+1)+i;indices.push(n,n+1,n+cols+1,n+1,n+cols+2,n+cols+1);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function buildBotanicalPlant(item,{leafAlbedo=null}={}){
 const root=new THREE.Group();root.name='botanical-plant';const leafMaps=maps(leafAlbedo),textures=Object.values(leafMaps);
 const leavesMaterial=new THREE.MeshPhysicalMaterial({color:'#fff',...leafMaps,bumpScale:.00022,roughness:.66,clearcoat:.06,clearcoatRoughness:.5,emissive:'#243b10',emissiveIntensity:.12,side:THREE.DoubleSide,vertexColors:true});leavesMaterial.name='ficus-living-leaf';
 const bark=new THREE.MeshStandardMaterial({color:'#76644a',roughness:.86});bark.name='ficus-branch';
 const ceramic=new THREE.MeshPhysicalMaterial({color:item.color,roughness:.73,clearcoat:.025});ceramic.name='plant-ceramic';
 const environment=chargerEnvironment();if(environment){textures.push(environment);leavesMaterial.envMap=ceramic.envMap=environment;leavesMaterial.envMapIntensity=.28;ceramic.envMapIntensity=.2;}
 const grain=new Uint8Array(128*128*4);for(let n=0;n<128*128;n++){const k=120+((Math.imul(n+1,16807)>>>0)%31);grain.set([k,k,k,255],n*4);}const grainMap=new THREE.DataTexture(grain,128,128);grainMap.wrapS=grainMap.wrapT=THREE.RepeatWrapping;grainMap.repeat.set(5,3);grainMap.needsUpdate=true;ceramic.bumpMap=grainMap;ceramic.bumpScale=.00065;textures.push(grainMap);
 const parts=(geometry,material,name)=>{const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=m.receiveShadow=true;root.add(m);return m;};
 const profile=[[0,0],[.15,0],[.158,.008],[.170,.06],[.188,.20],[.207,.307],[.207,.319],[.202,.324],[.192,.324],[.188,.310],[.172,.267]];
 parts(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),96),ceramic,'smooth-hollow-ceramic-pot');
 const soil=parts(new THREE.CylinderGeometry(.184,.184,.010,64),new THREE.MeshStandardMaterial({color:'#493a24',roughness:1,bumpMap:grainMap,bumpScale:.003}),'visible-pot-soil');soil.position.y=.294;
 const crumbs=[],crumb=new THREE.IcosahedronGeometry(1,0),crumbTransform=new THREE.Object3D();let soilSeed=28;const soilRandom=()=>{soilSeed=(Math.imul(soilSeed,1664525)+1013904223)>>>0;return soilSeed/4294967296;};
 for(let n=0;n<145;n++){const a=soilRandom()*Math.PI*2,r=Math.sqrt(soilRandom())*.172,size=.002+soilRandom()*.004;crumbTransform.position.set(Math.cos(a)*r,.300,Math.sin(a)*r);crumbTransform.rotation.set(soilRandom()*3,soilRandom()*3,0);crumbTransform.scale.set(size*1.5,size*.7,size);crumbTransform.updateMatrix();const g=crumb.clone();g.applyMatrix4(crumbTransform.matrix);crumbs.push(g);}const soilGeometry=mergeGeometries(crumbs,false);for(const g of crumbs)g.dispose();crumb.dispose();parts(soilGeometry,new THREE.MeshStandardMaterial({color:'#675034',roughness:1}),'dimensional-pot-substrate');
 const stemParts=[],leafParts=[],leaf=broadLeafGeometry(),dummy=new THREE.Object3D(),tint=new THREE.Color(),up=new THREE.Vector3(0,1,0),basis=new THREE.Matrix4();let seed=97;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const branch=(points,r)=>{stemParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,r,7,false));};
 for(let stem=0;stem<3;stem++){
  const angle=stem*2.4,base=new THREE.Vector3(Math.cos(angle)*.026,.295,Math.sin(angle)*.026),top=new THREE.Vector3(Math.cos(angle)*.08,[.88,.98,.94][stem],Math.sin(angle)*.08);
  branch([base,base.clone().lerp(top,.5).add(new THREE.Vector3(.012,0,-.01)),top],.0075-stem*.0006);
  for(let level=0;level<9;level++){
   const t=.22+level*.081+(random()-.5)*.05,at=base.clone().lerp(top,t),a=angle+level*2.399+(random()-.5)*.55,r=(.065+(1-t)*.04)*(.85+random()*.3),end=at.clone().add(new THREE.Vector3(Math.cos(a)*r,.055,Math.sin(a)*r));
   branch([at,at.clone().lerp(end,.5).add(new THREE.Vector3(0,.015,0)),end],.0025);
   const count=random()>.5?3:2;for(let n=0;n<count;n++){
    const size=.13+random()*.085,position=end.clone().add(new THREE.Vector3(Math.cos(a+n)*.008,n*.010,Math.sin(a+n)*.008));
    const heading=a+(n-(count-1)/2)*.75,direction=new THREE.Vector3(Math.cos(heading),-.2+random()*.85,Math.sin(heading)).normalize(),across=new THREE.Vector3().crossVectors(direction,up).normalize(),normal=new THREE.Vector3().crossVectors(across,direction).normalize();basis.makeBasis(across,direction,normal);
    dummy.position.copy(position);dummy.quaternion.setFromRotationMatrix(basis);dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up,(random()-.5)*2.1));dummy.scale.set(size*(.85+random()*.20),size,size);dummy.updateMatrix();
    const g=leaf.toNonIndexed();g.applyMatrix4(dummy.matrix);const colors=new Float32Array(g.attributes.position.count*3),v=.86+random()*.14;tint.setRGB(v,.94+random()*.06,v*.94);for(let k=0;k<colors.length;k+=3){colors[k]=tint.r;colors[k+1]=tint.g;colors[k+2]=tint.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));leafParts.push(g);
   }
  }
 }
 const merged=(pieces,material,name)=>{const geometry=mergeGeometries(pieces,false);for(const p of pieces)p.dispose();return parts(geometry,material,name);};
 merged(stemParts,bark,'branching-ficus-stems');merged(leafParts,leavesMaterial,'curved-veined-ficus-leaves');leaf.dispose();
 // Keep the saved furniture dimensions and placement authoritative.
 root.scale.set(item.width/.58,item.height,item.depth/.58);
 return {root,textures};
}
