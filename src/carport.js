import * as THREE from 'three';
import {toPlan} from './architecture.js';

export const carportRoof={from:toPlan([1717,739]),to:toPlan([2247,1267]),height:2.32,thickness:.16};
export function buildCarportRoof(scene){
 const root=new THREE.Group();root.name='carport-roof';scene.add(root);
 const {from,to,height,thickness}=carportRoof,w=to[0]-from[0],d=to[1]-from[1],x=(from[0]+to[0])/2,z=(from[1]+to[1])/2;
 const material=new THREE.MeshStandardMaterial({color:'#92968a',roughness:.86,side:THREE.DoubleSide,transparent:true,opacity:.14,depthWrite:false});
 const slab=new THREE.Mesh(new THREE.BoxGeometry(w+.12,thickness,d+.12),material);slab.name='carport-roof-slab';slab.position.set(x,height,z);slab.castShadow=false;slab.receiveShadow=true;root.add(slab);
 // An architectural cutaway roof keeps the original shed visible below the roof plane.
 for(const edge of [[x,from[1],w+.18,.10],[x,to[1],w+.18,.10],[from[0],z,.10,d],[to[0],z,.10,d]]){
  const fascia=new THREE.Mesh(new THREE.BoxGeometry(edge[2],thickness+.07,edge[3]),new THREE.MeshStandardMaterial({color:'#343936',roughness:.8}));fascia.position.set(edge[0],height,edge[1]);fascia.castShadow=true;root.add(fascia);
 }
 // Edge fascia and rafters make the covered area recognisable without new walls/posts.
 const timber=new THREE.MeshStandardMaterial({color:'#343936',roughness:.9});
 for(let n=0;n<7;n++){const beam=new THREE.Mesh(new THREE.BoxGeometry(w,.09,.055),timber);beam.position.set(x,height-thickness/2-.045,from[1]+.15+n*(d-.30)/6);beam.castShadow=true;root.add(beam);}
 return {root,setView({plan=false,charger=false,enabled=true,full=false}={}){root.visible=(full||enabled)&&!plan&&!charger;material.transparent=!full;material.opacity=full?1:.14;material.depthWrite=full;material.color.set(full?'#414642':'#92968a');material.needsUpdate=true;slab.castShadow=full;}};
}
