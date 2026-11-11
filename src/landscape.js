import * as THREE from 'three';
import {gravelMaterial} from './visual-materials.js';
import {siteLights} from './site-lighting.js';
import {outdoorY,terracePolygons,plantingBeds,plotOutline,driveway as approach,approachHeight,lawnHeight,insidePolygon} from './outdoor-layout.js';
import {outdoorGrassMaterial,outdoorPavingMaterial} from './outdoor-materials.js';

function polygonMesh(polygon,height,material,name,{depth=0,uvScale=2.4}={}){
 const points=polygon.map(([x,z])=>new THREE.Vector2(x,z)),clockwise=THREE.ShapeUtils.isClockWise(points),triangles=THREE.ShapeUtils.triangulateShape(points,[]),positions=[],uv=[],indices=[];
 for(const [x,z] of polygon){positions.push(x,height(x,z),z);uv.push(x/uvScale,z/uvScale);}
 for(const tri of triangles){let [a,b,c]=tri;const pa=polygon[a],pb=polygon[b],pc=polygon[c];if((pb[0]-pa[0])*(pc[1]-pa[1])-(pb[1]-pa[1])*(pc[0]-pa[0])>0)[b,c]=[c,b];indices.push(a,b,c);}
 if(depth)for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],n=positions.length/3;
  positions.push(a[0],height(...a),a[1],b[0],height(...b),b[1],a[0],height(...a)-depth,a[1],b[0],height(...b)-depth,b[1]);uv.push(a[0]/uvScale,a[1]/uvScale,b[0]/uvScale,b[1]/uvScale,a[0]/uvScale,a[1]/uvScale,b[0]/uvScale,b[1]/uvScale);indices.push(n,n+1,n+2,n+1,n+3,n+2);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=true;return mesh;
}
function clipped(polygon,axis,value,keepGreater){
 const out=[];for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=keepGreater?a[axis]>=value:a[axis]<=value,insideB=keepGreater?b[axis]>=value:b[axis]<=value;
  if(insideA)out.push(a);
  if(insideA!==insideB){const t=(value-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }return out;
}
function lawnMesh(bounds){
 const {minX,maxX,minZ,maxZ}=bounds,xs=[minX,maxX,approach.startX];for(let x=minX+1;x<maxX;x++)xs.push(x);xs.sort((a,b)=>a-b);
 const positions=[],uv=[];
 for(let ix=0;ix<xs.length-1;ix++)for(let z=minZ;z<maxZ;z+=1){
  let cell=clipped(plotOutline,0,xs[ix],true);cell=clipped(cell,0,xs[ix+1],false);cell=clipped(cell,1,z,true);cell=clipped(cell,1,Math.min(maxZ,z+1),false);
  for(let i=1;i<cell.length-1;i++)for(const p of [cell[0],cell[i+1],cell[i]]){positions.push(p[0],lawnHeight(p[0]),p[1]);uv.push((p[0]-minX)/(maxX-minX),(p[1]-minZ)/(maxZ-minZ));}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,outdoorGrassMaterial(bounds,plotOutline));mesh.name='landscape-lawn';mesh.receiveShadow=true;return mesh;
}
function curvedBlade(){
 const positions=[],uv=[],indices=[];
 for(let i=0;i<=4;i++){const t=i/4,half=.026*(1-t)+.001,bend=t*t*.25;positions.push(-half,t*.7,bend,half,t*.7,bend);uv.push(0,t,1,t);if(i<4){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

// Finite plot, connected stone terraces and measured driveway grade. All geometry
// remains separate from the traced architecture and editable indoor furniture.
export function buildLandscape(scene){
 const root=new THREE.Group();root.name='landscape';scene.add(root);
 const outdoorRoot=new THREE.Group();outdoorRoot.name='landscape-outdoor';root.add(outdoorRoot);
 const bounds={minX:Math.min(...plotOutline.map(p=>p[0])),maxX:Math.max(...plotOutline.map(p=>p[0])),minZ:Math.min(...plotOutline.map(p=>p[1])),maxZ:Math.max(...plotOutline.map(p=>p[1]))};
 const terrain=lawnMesh(bounds);outdoorRoot.add(terrain);
 const stone=outdoorPavingMaterial();
 const terraces=terracePolygons.map((polygon,i)=>polygonMesh(polygon,()=>outdoorY,stone,['west-terrace','garden-walk','main-terrace'][i],{depth:.075}));root.add(...terraces);
 const driveway=polygonMesh([[approach.startX,approach.minZ],[approach.endX,approach.minZ],[approach.endX,approach.maxZ],[approach.startX,approach.maxZ]],approachHeight,stone,'driveway-slope',{depth:.075});root.add(driveway);
 const road=polygonMesh([[approach.endX,-1],[approach.endX+2.8,-1],[approach.endX+2.8,18.4],[approach.endX,18.4]],()=>outdoorY-approach.rise-.015,new THREE.MeshStandardMaterial({color:'#77766e',roughness:1}),'front-street');outdoorRoot.add(road);
 const planting=new THREE.Group();planting.name='landscape-planting';outdoorRoot.add(planting);
 const soil=gravelMaterial(),edge=new THREE.MeshStandardMaterial({color:'#363c35',roughness:.93});
 for(const bed of plantingBeds){
  const surface=polygonMesh(bed.polygon,()=>outdoorY+.055,soil,'planting-bed:'+bed.id,{depth:.11});planting.add(surface);
  for(let i=0;i<bed.polygon.length;i++){
   const [x,z]=bed.polygon[i],[bx,bz]=bed.polygon[(i+1)%bed.polygon.length],length=Math.hypot(bx-x,bz-z);
   const rim=new THREE.Mesh(new THREE.BoxGeometry(length,.18,.035),edge);rim.name='bed-edge:'+bed.id;rim.position.set((x+bx)/2,outdoorY+.05,(z+bz)/2);rim.rotation.y=-Math.atan2(bz-z,bx-x);rim.castShadow=true;rim.receiveShadow=true;planting.add(rim);
  }
 }
 let seed=713;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const clumps=[];
 for(const bed of plantingBeds){
  const minX=Math.min(...bed.polygon.map(p=>p[0])),maxX=Math.max(...bed.polygon.map(p=>p[0])),minZ=Math.min(...bed.polygon.map(p=>p[1])),maxZ=Math.max(...bed.polygon.map(p=>p[1]));
  for(let x=minX+.2;x<maxX-.08;x+=.43)for(let z=minZ+.2;z<maxZ-.08;z+=.43)if(insidePolygon(x,z,bed.polygon))clumps.push({x,z,y:outdoorY+.06});
 }
 // Low foundation planting in the grassy front garden, clear of all accesses.
 for(const [x,z] of [[20.45,.9],[20.65,2.0],[20.5,3.5],[20.9,4.7],[21.0,5.9],[-5.5,2.1],[-6.2,2.4]])clumps.push({x,z,y:lawnHeight(x)});
 const blades=new THREE.InstancedMesh(curvedBlade(),new THREE.MeshStandardMaterial({color:'#99a06a',roughness:1,side:THREE.DoubleSide}),Math.max(1,clumps.length*30));blades.name='ornamental-grasses';
 const foliage=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshStandardMaterial({color:'#798b55',roughness:1}),Math.max(1,clumps.length*22));foliage.name='perennial-foliage';
 const flowers=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshStandardMaterial({color:'#9a89aa',roughness:1}),Math.max(1,clumps.length*6));flowers.name='lavender-flowers';
 const dummy=new THREE.Object3D(),color=new THREE.Color();let blade=0,leaf=0,flower=0;
 for(const [n,clump] of clumps.entries()){
  for(let i=0;i<30;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*.13;dummy.position.set(clump.x+Math.cos(angle)*r,clump.y,clump.z+Math.sin(angle)*r);dummy.rotation.set((random()-.5)*.22,angle,(random()-.5)*.22);dummy.scale.set(.8+random()*.5,.52+random()*.4,.8+random()*.4);dummy.updateMatrix();blades.setMatrixAt(blade,dummy.matrix);color.setHSL(.15+random()*.07,.18+random()*.1,.39+random()*.13);blades.setColorAt(blade++,color);}
  for(let i=0;i<22;i++){const angle=random()*Math.PI*2,r=Math.sqrt(random())*.19;dummy.position.set(clump.x+Math.cos(angle)*r,clump.y+.08+random()*.16,clump.z+Math.sin(angle)*r);dummy.rotation.set(random()*2,angle,random()*2);dummy.scale.set(.045+random()*.045,.10+random()*.05,.028);dummy.updateMatrix();foliage.setMatrixAt(leaf++,dummy.matrix);}
  if(n%3!==0)for(let i=0;i<6;i++){const angle=random()*Math.PI*2,r=random()*.15;dummy.position.set(clump.x+Math.cos(angle)*r,clump.y+.26+random()*.13,clump.z+Math.sin(angle)*r);dummy.rotation.set((random()-.5)*.2,angle,(random()-.5)*.2);dummy.scale.set(.028,.075+random()*.035,.028);dummy.updateMatrix();flowers.setMatrixAt(flower++,dummy.matrix);}
 }
 for(const [mesh,count] of [[blades,blade],[foliage,leaf],[flowers,flower]]){mesh.count=count;mesh.castShadow=true;mesh.receiveShadow=true;planting.add(mesh);}
 const trees=new THREE.Group();trees.name='landscape-trees';outdoorRoot.add(trees);
 const treeSpecs=[{x:-6.4,z:2.7,height:4.0},{x:23.5,z:2.2,height:3.0}];
 const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,6),new THREE.MeshStandardMaterial({color:'#827d64',roughness:1}),90);stems.name='multistem-tree-branches';
 const crowns=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshStandardMaterial({color:'#76894d',roughness:1}),1800);crowns.name='multistem-tree-leaves';let stemCount=0,crownCount=0;
 const up=new THREE.Vector3(0,1,0);
 function branch(a,b,radius){const delta=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.rotation.set(0,0,0);dummy.quaternion.setFromUnitVectors(up,delta.clone().normalize());dummy.scale.set(radius,delta.length(),radius);dummy.updateMatrix();stems.setMatrixAt(stemCount++,dummy.matrix);}
 for(const spec of treeSpecs){
  const base=new THREE.Vector3(spec.x,lawnHeight(spec.x),spec.z),h=spec.height;
  for(let stem=0;stem<4;stem++){
   const angle=stem*Math.PI/2+.4,top=base.clone().add(new THREE.Vector3(Math.cos(angle)*.48,h*.70,Math.sin(angle)*.48));branch(base.clone().add(new THREE.Vector3(Math.cos(angle)*.07,0,Math.sin(angle)*.07)),top,.024);
   for(let tip=0;tip<4;tip++){
    const a=angle+(tip-1.5)*.65,end=top.clone().add(new THREE.Vector3(Math.cos(a)*(.55+random()*.4),h*(.12+random()*.13),Math.sin(a)*(.55+random()*.4)));branch(top.clone().lerp(base,.12+random()*.12),end,.011);
    for(let i=0;i<48;i++){
     const phi=random()*Math.PI*2,r=Math.sqrt(random())*.58,dy=(random()-.5)*.65;
     dummy.position.copy(end).add(new THREE.Vector3(Math.cos(phi)*r,dy,Math.sin(phi)*r));dummy.rotation.set(random()*Math.PI,random()*Math.PI*2,random()*Math.PI);dummy.scale.set(.07+random()*.045,.10+random()*.06,.027);dummy.updateMatrix();crowns.setMatrixAt(crownCount,dummy.matrix);color.setHSL(.19+random()*.07,.24+random()*.18,.24+random()*.18);crowns.setColorAt(crownCount++,color);
    }
   }
  }
 }
 stems.count=stemCount;crowns.count=crownCount;stems.castShadow=crowns.castShadow=true;stems.receiveShadow=crowns.receiveShadow=true;trees.add(stems,crowns);
 const fixtures=new THREE.Group();fixtures.name='landscape-light-fixtures';outdoorRoot.add(fixtures);
 const luminaires=[],lampBody=new THREE.MeshStandardMaterial({color:'#333a33',roughness:.8}),bodyGeometry=new THREE.CylinderGeometry(.025,.025,.18,8),bulbGeometry=new THREE.SphereGeometry(.035,8,6);
 for(const source of siteLights()){
  const [x,y,z]=source.position,body=new THREE.Mesh(bodyGeometry,lampBody);body.position.set(x,y-.13,z);body.name='bollard:'+source.id;body.castShadow=true;fixtures.add(body);
  const lamp=new THREE.Mesh(bulbGeometry,new THREE.MeshStandardMaterial({color:'#e3dac3',emissive:'#ffd3a2',emissiveIntensity:0,roughness:.3}));lamp.position.set(x,y-.025,z);lamp.name=source.id;fixtures.add(lamp);luminaires.push(lamp);
 }
 return {root,outdoorRoot,terraces,driveway,terrain,planting,trees,fixtures,pavingMaterial:stone,update(state){const room=state.entre,strength=room?.lights.ude?Math.max(0,(room.levels?.ude??100)/100)*(room.brightness??100)/100:0;for(const lamp of luminaires)lamp.material.emissiveIntensity=strength*3;}};
}
