import * as THREE from 'three';
import {walls,openings,wallSections,openingPosition,ceilingHeight,finishedFloor} from './architecture.js';

export function buildStructure(scene){
 const root=new THREE.Group();root.name='architecture';scene.add(root);
 const clip=new THREE.Plane(new THREE.Vector3(0,-1,0),finishedFloor+1.2);
 const wallMaterial=new THREE.MeshStandardMaterial({color:'#f5f2e8',roughness:.85,side:THREE.DoubleSide,clipShadows:true,clippingPlanes:[clip]});
 const leafMaterial=new THREE.MeshStandardMaterial({color:'#eeece3',roughness:.7,clipShadows:true,clippingPlanes:[clip]});
 const oakMaterial=new THREE.MeshStandardMaterial({color:'#c3ab84',roughness:.8,clipShadows:true,clippingPlanes:[clip]});
 const frameMaterial=new THREE.MeshStandardMaterial({color:'#666f68',roughness:.55,clipShadows:true,clippingPlanes:[clip]});
 const jambMaterial=new THREE.MeshStandardMaterial({color:'#d7d6ca',roughness:.6,clipShadows:true,clippingPlanes:[clip]});
 const capMaterial=new THREE.MeshStandardMaterial({color:'#a8b09c',roughness:.85});
 const cutCaps=[];
 const capFrameMaterial=new THREE.MeshStandardMaterial({color:'#666f68',roughness:.55});
 const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#bdd4d2',roughness:.12,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide,clippingPlanes:[clip]});
 function box(parent,x,y,z,w,h,d,material,name){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name||'';parent.add(mesh);return mesh;
 }
 for(const w of walls){
  const group=new THREE.Group();group.name=`wall:${w.id}`;group.userData={kind:'wall',id:w.id};root.add(group);
  for(const section of wallSections(w)){
   const along=section.end-section.start;
   const a=w.axis==='x'?[w.from[0]+section.start,w.from[1]]:[w.from[0],w.from[1]+section.start];
   const b=w.axis==='x'?[w.from[0]+section.end,w.from[1]]:[w.from[0],w.from[1]+section.end];
   const heightAt=p=>w.height||ceilingHeight(p[1]);
   const topA=section.top==='ceiling'?heightAt(a):Math.min(section.top,heightAt(a));
   const topB=section.top==='ceiling'?heightAt(b):Math.min(section.top,heightAt(b));
   if(Math.max(topA,topB)<=section.bottom+.001)continue;
   const shape=new THREE.Shape();shape.moveTo(0,section.bottom);shape.lineTo(along,section.bottom);shape.lineTo(along,topB);shape.lineTo(0,topA);shape.closePath();
   const geometry=new THREE.ExtrudeGeometry(shape,{depth:w.thickness,bevelEnabled:false});
   const mesh=new THREE.Mesh(geometry,wallMaterial);mesh.name=`solid:${w.id}`;mesh.userData={kind:'wall',wall:w.id,...section};
   mesh.castShadow=true;mesh.receiveShadow=true;
   if(w.axis==='x')mesh.position.set(a[0],finishedFloor,a[1]-w.thickness/2);
   else{mesh.rotation.y=-Math.PI/2;mesh.position.set(a[0]+w.thickness/2,finishedFloor,a[1]);}
   group.add(mesh);
   if(section.bottom<1.2&&Math.min(topA,topB)>1.2){
    const cap=box(group,(a[0]+b[0])/2,finishedFloor+1.2,(a[1]+b[1])/2,w.axis==='x'?along:w.thickness,.008,w.axis==='x'?w.thickness:along,capMaterial,`cut-cap:${w.id}`);cutCaps.push(cap);
   }
  }
 }
 function openingGroup(o){
  const w=walls.find(w=>w.id===o.wall),p=openingPosition(o,o.start),g=new THREE.Group();
  g.name=`opening:${o.id}`;g.userData={kind:o.kind,id:o.id,sill:o.sill,head:o.head,width:o.end-o.start};
  g.position.set(p[0],finishedFloor,p[1]);if(w.axis==='z')g.rotation.y=-Math.PI/2;root.add(g);return g;
 }
 function framedPane(parent,start,end,sill,head,name){
  const width=end-start,height=head-sill,t=.045;
  box(parent,(start+end)/2,(sill+head)/2,0,width-t,height-t,.024,glassMaterial,`glass:${name}`);
  for(const x of [start+t/2,end-t/2]){box(parent,x,(sill+head)/2,0,t,height,.08,frameMaterial);if(sill<1.2&&head>1.2)cutCaps.push(box(parent,x,1.2,.0,t,.008,.08,capFrameMaterial));}
  for(const y of [sill+t/2,head-t/2])box(parent,(start+end)/2,y,0,width,t,.08,frameMaterial);
 }
 function door(parent,width,head,o,{start=0,sill=0,glazed=false}={}){
  const pivot=new THREE.Group(),atEnd=o.hinge==='end';pivot.name=`door-leaf:${o.id}`;
  pivot.position.x=start+(atEnd?width:0);pivot.position.y=sill;
  const localSign=atEnd?-1:1;
  // A positive world-Y rotation takes +x towards -z.
  pivot.rotation.y=THREE.MathUtils.degToRad(o.swing);parent.add(pivot);
  if(glazed)framedPane(pivot,atEnd?-width:0,atEnd?0:width,0,head-sill,o.id);
  else box(pivot,localSign*width/2,(head-sill)/2,0,width-.025,head-sill-.025,.038,o.finish==='oak'?oakMaterial:leafMaterial,`leaf:${o.id}`);
  box(pivot,localSign*(width-.1),1, .04,.11,.025,.025,frameMaterial);
  if(!glazed&&head>1.2){const cap=box(pivot,localSign*width/2,1.2,0,width-.025,.008,.038,capMaterial);cutCaps.push(cap);}
  const points=[];const theta=THREE.MathUtils.degToRad(o.swing);
  for(let i=0;i<=32;i++){
   const angle=theta*i/32;points.push(new THREE.Vector3(start+(atEnd?width:0)+localSign*width*Math.cos(angle),.014,-localSign*width*Math.sin(angle)));
  }
  const arc=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#a29882',transparent:true,opacity:.65}));arc.name=`door-swing:${o.id}`;parent.add(arc);
 }
 for(const o of openings){
  const g=openingGroup(o),width=o.end-o.start;
  if(o.kind==='passage')continue;
  if(o.kind==='door'){
   for(const x of [.018,width-.018])box(g,x,o.head/2,0,.036,o.head,.12,jambMaterial);
   box(g,width/2,o.head,0,width,.04,.12,jambMaterial);door(g,width,o.head,o,{glazed:o.glazed});
  }else{
   const cuts=[0,...(o.columns||[]).map(t=>t*width),width];
   const levels=[o.sill,...(o.transoms||[]),o.head];
   for(let i=0;i<cuts.length-1;i++)for(let j=0;j<levels.length-1;j++){
    if(o.door&&i===o.door.panel&&j===0)door(g,cuts[i+1]-cuts[i],o.door.head,{...o,...o.door,id:'terrace-door'},{start:cuts[i],sill:o.sill,glazed:true});
    else framedPane(g,cuts[i],cuts[i+1],levels[j],levels[j+1],o.id);
   }
  }
 }
 return {root,setCutaway(enabled){for(const cap of cutCaps)cap.visible=enabled;for(const material of [wallMaterial,leafMaterial,oakMaterial,jambMaterial,frameMaterial,glassMaterial]){material.clippingPlanes=enabled?[clip]:[];material.needsUpdate=true;}}};
}
