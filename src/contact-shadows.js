import * as THREE from 'three';

// A small analytical ambient-contact footprint. It supplements the real sun
// shadows at floor contact, without an extra scene pass or an animation loop.
export function contactShadows(footprints,{opacity=.20,name='ambient-contact-shadows'}={}){
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),alpha=Math.max(0,Math.exp(-r*r*5)-Math.exp(-5));data.set([31,29,23,Math.round(alpha*255)],(y*size+x)*4);}
 const map=new THREE.DataTexture(data,size,size);map.colorSpace=THREE.SRGBColorSpace;map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.needsUpdate=true;
 const material=new THREE.MeshBasicMaterial({map,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});material.name='soft-ambient-contact';
 const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),material,footprints.length),transform=new THREE.Object3D();mesh.name=name;mesh.userData.ambientContact=true;
 footprints.forEach(({x,y,z,width,depth,angle=0},n)=>{transform.position.set(x,y+.001,z);transform.rotation.set(0,angle,0);transform.scale.set(width,1,depth);transform.updateMatrix();mesh.setMatrixAt(n,transform.matrix);});mesh.computeBoundingSphere();return mesh;
}
