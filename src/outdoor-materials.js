import * as THREE from 'three';

const hash=(x,z,seed=1)=>{let n=(Math.imul(x+seed,374761393)^Math.imul(z-seed,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967295;};
function pixels(size,sample,{color=true}={}){
 const bytes=new Uint8Array(size*size*4);
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const value=sample(x,z),rgb=Array.isArray(value)?value:[value,value,value],i=(z*size+x)*4;
  for(let c=0;c<3;c++)bytes[i+c]=Math.min(255,Math.max(0,Math.round(rgb[c])));bytes[i+3]=255;
 }
 const map=new THREE.DataTexture(bytes,size,size);map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;return map;
}
let paving;
// Four 60cm tiles per repeat. UVs are set in world metres, including the ramp.
export function outdoorPavingMaterial(){
 if(paving)return paving;
 const joint=(x,z)=>x%128<2||z%128<2;
 const map=pixels(512,(x,z)=>{
  const tint=(hash(x>>7,z>>7,53)-.5)*9,grain=(hash(x,z,97)-.5)*7;
  return joint(x,z)?[173,169,158]:[227+tint+grain,223+tint+grain,212+tint+grain];
 });
 const bumpMap=pixels(512,(x,z)=>joint(x,z)?72:170+(hash(x,z,97)-.5)*19,{color:false});
 paving=new THREE.MeshStandardMaterial({color:'#f1eee5',map,bumpMap,bumpScale:.004,roughness:.91});paving.name='warm-grey-outdoor-pavers';return paving;
}
export function outdoorGrassMaterial(bounds,outline){
 const {minX,maxX,minZ,maxZ}=bounds,w=maxX-minX,d=maxZ-minZ;
 const map=pixels(512,(ix,iz)=>{
  const x=minX+ix/511*w,z=minZ+iz/511*d;
  const broad=Math.sin(x*1.7+Math.sin(z*.9))*3+Math.cos(z*1.4+x*.2)*3;
  const fine=(hash(ix,iz,41)-.5)*20+Math.sin(x*74+z*43)*2;
  return [108+broad+fine,133+broad+fine,70+broad*.8+fine*.7];
 });
 // A short edge feather avoids a thick floating plinth around the finite plot.
 const alphaMap=pixels(512,(ix,iz)=>{
  const x=minX+ix/511*w,z=minZ+iz/511*d;let distance=Infinity;
  for(let i=0;i<outline.length;i++){
   const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
   distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
  }
  return 255*Math.min(1,distance/.65);
 },{color:false});
 for(const texture of [map,alphaMap])texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
 const material=new THREE.MeshStandardMaterial({color:'#fff',map,alphaMap,transparent:true,depthWrite:false,roughness:1});material.name='muted-finite-lawn';return material;
}
