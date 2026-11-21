import * as THREE from 'three';
import {insidePolygon,lawnHeight,terracePolygons,plotOutline,plantingBeds,carportArea} from './outdoor-layout.js';

function tuftGeometry(){
 const positions=[],uv=[],indices=[];
 for(let blade=0;blade<3;blade++){
  const a=blade*2.399,base=positions.length/3,rows=4;
  for(let j=0;j<=rows;j++){
   const t=j/rows,width=.0016*Math.pow(1-t,.7)+.00008,bend=[.026,.037,.021][blade]*t*t,side=.005*Math.sin(t*Math.PI+blade*.4),height=[.037,.029,.034][blade]*t;
   for(const sign of [-1,1]){const x=sign*width+side;positions.push(x*Math.cos(a)+bend*Math.sin(a),height,-x*Math.sin(a)+bend*Math.cos(a));uv.push((sign+1)/2,t);}
   if(j<rows){const n=base+j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function isLawnDetailPoint(x,z){
 return insidePolygon(x,z,plotOutline)&&x<15.285&&!terracePolygons.some(p=>insidePolygon(x,z,p))&&!plantingBeds.some(p=>insidePolygon(x,z,p.polygon))&&!(x>14.425&&z>13.105&&z<13.695);
}

export function isGardenGrassPoint(x,z){
 return isLawnDetailPoint(x,z)&&!(x>-.42&&x<19.8&&z>-.4&&z<7.25)&&!(x>carportArea.minX-.05&&z>carportArea.minZ-.05&&z<carportArea.maxZ+.05);
}

export function gardenEdgeFade(x,z){
 let distance=Infinity;
 for(let n=0;n<plotOutline.length;n++){
  const a=plotOutline[n],b=plotOutline[(n+1)%plotOutline.length],dx=b[0]-a[0],dz=b[1]-a[1],t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
  distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));
 }
 return THREE.MathUtils.clamp(distance/.65,0,1);
}

// Finite real geometry at the station. The photographed albedo supplies the
// distant lawn; curved tufts supply parallax, silhouettes and shadow reception.
export function buildLawnDetail(parent){
 let seed=583;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},roots=[];
 for(let n=0;n<100000;n++){
  const x=12.2+random()*3.085,z=12.65+random()*3.05,edge=Math.max(0,Math.min(1,(x-12.2)/.6,(15.7-z)/.6));
  if(!isLawnDetailPoint(x,z)||random()>edge)continue;
  roots.push([x,lawnHeight(x)-.001,z,(.66+random()*.50)*edge,random()*Math.PI*2,random()]);
 }
 const data=new Uint8Array(8*128*4);for(let y=0;y<128;y++)for(let x=0;x<8;x++){const v=150+y/127*100+(x===3?5:0);data.set([v,v,v,255],(y*8+x)*4);}const map=new THREE.DataTexture(data,8,128);map.colorSpace=THREE.SRGBColorSpace;map.needsUpdate=true;
 const material=new THREE.MeshStandardMaterial({color:'#fff',map,roughness:.9,side:THREE.DoubleSide});material.name='living-lawn-blades';
 const mesh=new THREE.InstancedMesh(tuftGeometry(),material,roots.length);mesh.name='living-lawn-tufts';mesh.castShadow=false;mesh.receiveShadow=true;mesh.visible=false;mesh.userData.roots=roots;
 const transform=new THREE.Object3D(),color=new THREE.Color();
 roots.forEach(([x,y,z,scale,a,t],n)=>{transform.position.set(x,y,z);transform.rotation.set(0,a,0);transform.scale.setScalar(scale);transform.updateMatrix();mesh.setMatrixAt(n,transform.matrix);color.setRGB((62+t*38+Math.sin(x*.8+z*.5)*5)/255,(91+t*42+Math.sin(x*.8+z*.5)*8)/255,(32+t*24)/255,THREE.SRGBColorSpace);mesh.setColorAt(n,color);});mesh.computeBoundingSphere();parent.add(mesh);
 // A second spatially shuffled field supplies grass silhouettes throughout the
 // actual garden instead of a dense square patch surrounded by a flat lawn.
 const gardenRoots=[];
 for(let n=0;n<150000;n++){
  const x=-9.5+random()*24.75,z=-3+random()*22;
  if(!isGardenGrassPoint(x,z))continue;
  const edge=gardenEdgeFade(x,z);if(random()>edge)continue;
  gardenRoots.push([x,lawnHeight(x)-.001,z,(.65+random()*.65)*edge,random()*Math.PI*2,random()]);
 }
 const garden=new THREE.InstancedMesh(mesh.geometry,material,gardenRoots.length);garden.name='garden-lawn-tufts';garden.receiveShadow=true;garden.visible=false;garden.userData.roots=gardenRoots;
 gardenRoots.forEach(([x,y,z,scale,a,t],n)=>{transform.position.set(x,y,z);transform.rotation.set(0,a,0);transform.scale.setScalar(scale);transform.updateMatrix();garden.setMatrixAt(n,transform.matrix);color.setRGB((62+t*38+Math.sin(x*.8+z*.5)*5)/255,(91+t*42+Math.sin(x*.8+z*.5)*8)/255,(32+t*24)/255,THREE.SRGBColorSpace);garden.setColorAt(n,color);});garden.computeBoundingSphere();parent.add(garden);
 return {mesh,garden,update(view,quality='standard',full=false){garden.visible=full;garden.count=Math.floor(gardenRoots.length*(quality==='light'?.15:quality==='detailed'?1:.70));mesh.visible=view==='mower'||full;mesh.count=Math.floor(roots.length*(view==='mower'?(quality==='light'?.25:quality==='detailed'?1:.75):(quality==='light'?.04:.12)));}};
}
