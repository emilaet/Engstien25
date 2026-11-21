import * as THREE from 'three';
import {insidePolygon,lawnHeight,terracePolygons,plotOutline,plantingBeds} from './outdoor-layout.js';

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
 roots.forEach(([x,y,z,scale,a,t],n)=>{transform.position.set(x,y,z);transform.rotation.set(0,a,0);transform.scale.setScalar(scale);transform.updateMatrix();mesh.setMatrixAt(n,transform.matrix);color.setRGB((65+t*39)/255,(99+t*41)/255,(35+t*25)/255,THREE.SRGBColorSpace);mesh.setColorAt(n,color);});mesh.computeBoundingSphere();parent.add(mesh);
 return {mesh,update(view,quality='standard',full=false){mesh.visible=view==='mower'||full;mesh.count=Math.floor(roots.length*(view==='mower'?(quality==='light'?.25:quality==='detailed'?1:.75):(quality==='light'?.04:.12)));}};
}
