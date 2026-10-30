import * as THREE from 'three';
import {walls,wallSections,ceilingHeight,finishedFloor} from './architecture.js';
import {cutawayHeight} from './structure.js';
import {facadeBrickMaterial} from './visual-materials.js';

// Outer skins reuse the traced wall sections: every window and door stays open.
export function buildExterior(scene){
 const root=new THREE.Group();root.name='full-exterior';scene.add(root);
 const roof=new THREE.Group();roof.name='exterior-roof';root.add(roof);
 const brick=facadeBrickMaterial(),clip=new THREE.Plane(new THREE.Vector3(0,-1,0),finishedFloor+cutawayHeight),metal=new THREE.MeshStandardMaterial({color:'#303330',roughness:.76,metalness:.18});
 const exterior=walls.filter(w=>w.exterior),west=exterior.find(w=>w.id==='west'),east=exterior.find(w=>w.id==='east'),rear=exterior.find(w=>w.id==='rear'),garden=exterior.find(w=>w.id==='garden');
 const outerRear=rear.from[1]-rear.thickness/2,outerGarden=garden.from[1]+garden.thickness/2;
 for(const w of exterior)for(const original of wallSections(w)){
  // End-wall masonry wraps over the full thickness of the long walls at corners.
  const section={...original};if(w.axis==='z'){if(section.start===0)section.start=outerRear-w.from[1]-.018;if(section.end===w.length)section.end=outerGarden-w.from[1]+.018;}
  const length=section.end-section.start,za=w.axis==='x'?w.from[1]:w.from[1]+section.start,zb=w.axis==='x'?za:za+length;
  const top=z=>section.top==='ceiling'?ceilingHeight(z):Math.min(section.top,ceilingHeight(z));
  if(Math.max(top(za),top(zb))<=section.bottom+.001)continue;
  const shape=new THREE.Shape();shape.moveTo(0,section.bottom);shape.lineTo(length,section.bottom);shape.lineTo(length,top(zb));shape.lineTo(0,top(za));shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:false}),p=geometry.attributes.position,uv=geometry.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+section.start)/.48,p.getY(i)/.24);
  const mesh=new THREE.Mesh(geometry,brick);mesh.name=`facade:${w.id}`;mesh.userData={wall:w.id,...section};mesh.castShadow=true;mesh.receiveShadow=true;
  if(w.axis==='x')mesh.position.set(w.from[0]+section.start,finishedFloor,w.from[1]+(w.id==='rear'?-w.thickness/2-.018:w.thickness/2));
  else{mesh.rotation.y=-Math.PI/2;mesh.position.set(w.from[0]+(w.id==='west'?-w.thickness/2:w.thickness/2+.018),finishedFloor,w.from[1]+section.start);}
  root.add(mesh);
 }
 const x0=west.from[0]-west.thickness/2-.065,x1=east.from[0]+east.thickness/2+.065,z0=rear.from[1]-rear.thickness/2-.065,z1=garden.from[1]+garden.thickness/2+.065;
 const slope=.7/(z1-z0),height=z=>finishedFloor+2.4+(z-z0)*slope;
 function roofBox(name,x,z,width,depth,thickness,yOffset,material){
  const geometry=new THREE.BoxGeometry(width,thickness,depth),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setY(i,positions.getY(i)+positions.getZ(i)*slope);
  geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,height(z)+yOffset,z);mesh.castShadow=true;mesh.receiveShadow=true;roof.add(mesh);return mesh;
 }
 const roofMaterial=new THREE.MeshStandardMaterial({color:'#474b48',roughness:.95});
 roofBox('house-roof',(x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,.13,.08,roofMaterial);
 for(const [name,x,z,w,d] of [['rear',(x0+x1)/2,z0,x1-x0,.055],['garden',(x0+x1)/2,z1,x1-x0,.055],['west',x0,(z0+z1)/2,.055,z1-z0],['east',x1,(z0+z1)/2,.055,z1-z0]])roofBox(`roof-fascia:${name}`,x,z,w,d,.18,.07,metal);
 function setView({full=false,cutaway=true}={}){roof.visible=full;brick.clippingPlanes=cutaway?[clip]:[];brick.needsUpdate=true;}
 setView();return {root,roof,setView};
}
