import * as THREE from 'three';
import {toPlan} from './architecture.js';

export const carportRoof={from:toPlan([1717,739]),to:toPlan([2247,1267]),height:2.32,thickness:.16};
export function buildCarportRoof(scene){
 const root=new THREE.Group();root.name='carport-roof';scene.add(root);
 const {from,to,height,thickness}=carportRoof,w=to[0]-from[0],d=to[1]-from[1],x=(from[0]+to[0])/2,z=(from[1]+to[1])/2;
 const material=new THREE.MeshStandardMaterial({color:'#92968a',roughness:.86,side:THREE.DoubleSide});
 const slab=new THREE.Mesh(new THREE.BoxGeometry(w+.12,thickness,d+.12),material);slab.name='carport-roof-slab';slab.position.set(x,height,z);slab.castShadow=true;slab.receiveShadow=true;root.add(slab);
 // Edge fascia and rafters make the covered area recognisable without new walls/posts.
 const timber=new THREE.MeshStandardMaterial({color:'#bca682',roughness:.9});
 for(let n=0;n<7;n++){const beam=new THREE.Mesh(new THREE.BoxGeometry(w,.09,.055),timber);beam.position.set(x,height-thickness/2-.045,from[1]+.15+n*(d-.30)/6);beam.castShadow=true;root.add(beam);}
 return {root,setView({plan=false,charger=false,enabled=true}={}){root.visible=enabled&&!plan&&!charger;}};
}
