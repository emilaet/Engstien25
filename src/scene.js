import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {rooms} from './house.js';
export function createHouse(host,onTap,onHold){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#eeede7');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#eeede7');host.append(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(35,1,.1,150);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.08;controls.minDistance=6;controls.maxDistance=45;controls.enablePan=true;
 const home=()=>{camera.position.set(25,25,32);controls.target.set(10,0,4);controls.update();};home();
 scene.add(new THREE.HemisphereLight(0xfffcf0,0xada99b,1.8));
 const sun=new THREE.DirectionalLight(0xfff4df,2.2);sun.position.set(-6,22,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:25,bottom:-25});sun.shadow.bias=-.001;scene.add(sun);
 const mats={};function mat(color,roughness=.8){return mats[color]??=new THREE.MeshStandardMaterial({color,roughness});}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function cylinder(x,y,z,r,h,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 box(10,-.4,5,33,.2,23,'#e6e5dc');box(10,-.14,3.5,21.1,.35,7.55,'#d1c9b9');
 const floors={},labels={};const targets=[];const lights={};
 // Subtle timber planks; each room stays separately addressable.
 for(const r of rooms){
  const f=box(r.x+r.w/2,.065,r.z+r.d/2,r.w,.1,r.d,r.tile?'#d8d2c7':'#d6b98c');f.name=`floor_${r.id}`;f.userData.room=r.id;targets.push(f);floors[r.id]=f;
  if(!r.tile)for(let k=.18;k<r.w;k+=.2)box(r.x+k,.119,r.z+r.d/2,.009,.002,r.d,'#c3a77f');
  else {for(let k=.6;k<r.w;k+=.6)box(r.x+k,.119,r.z+r.d/2,.012,.002,r.d,'#bbb5ab');for(let k=.6;k<r.d;k+=.6)box(r.x+r.w/2,.119,r.z+k,r.w,.002,.012,'#bbb5ab');}
  const label=document.createElement('button');label.className='room-label';label.innerHTML=`<span>${r.short}</span><small></small>`;label.setAttribute('aria-label',`Åbn ${r.name}`);host.append(label);label.onclick=()=>onHold(r.id);labels[r.id]=label;
  lights[r.id]=box(r.x+r.w/2,.035,r.z+r.d/2,.2,.01,.2,'#d6b98c');
 }
 // Full-height rear wall, low front walls keep the interior visible.
 const wall='#f9f7ef',trim='#67675d';
 function wallX(x,z,w,h=1.25){box(x,h/2+.15,z,w,h,.13,wall);}
 function wallZ(x,z,d,h=1.25){box(x,h/2+.15,z,.13,h,d,wall);}
 wallX(10.17,-.12,20.7,2.3);wallX(10.17,7.08,20.7,.55);wallZ(-.12,3.48,7.3,1);wallZ(20.5,3.48,7.3,1.7);
 for(const x of [1.87,5.22,7.57,12.22,16.27])wallZ(x,1.45,2.9,1.5);
 // Rear rooms open towards the corridor/living space through door gaps.
 for(const r of rooms.filter(r=>r.z===0 && r.id!=='kokken'&&r.id!=='depot')){wallX(r.x+Math.max(.2,(r.w-.95)/2),2.98,Math.max(.4,r.w-.95),1.05);}
 wallZ(11.03,.77,1.7,1.6);wallX(11.62,1.65,1.15,1.4);
 wallX(14.1,4.42,6.2,1.05);
 for(const x of [12.97,15.62,17.27])wallZ(x,5.72,2.45,1.15);
 wallZ(17.27,3.45,.8,1.15);
 function windowAt(x,z,w,side=false){const g=new THREE.Group();scene.add(g);const glass=new THREE.MeshStandardMaterial({color:'#a6c5c4',transparent:true,opacity:.34,roughness:.15});const pane=new THREE.Mesh(new THREE.BoxGeometry(side?.04:w,1.2,side?w:.04),glass);pane.position.set(x,1.4,z);g.add(pane);if(side){box(x,1.4,z-w/2,.09,1.3,.06,trim);box(x,1.4,z+w/2,.09,1.3,.06,trim);box(x,.76,z,.09,.06,w,trim);box(x,2.04,z,.09,.06,w,trim);}else{box(x-w/2,1.4,z,.06,1.3,.09,trim);box(x+w/2,1.4,z,.06,1.3,.09,trim);box(x,.76,z,w,.06,.09,trim);box(x,2.04,z,w,.06,.09,trim);}}
 for(const [x,w] of [[1,.6],[3.5,1],[6.3,.7],[9.2,1.8],[14.2,1.8],[18.7,1.8]])windowAt(x,-.2,w);
 windowAt(8.1,7.11,3.4);windowAt(3,7.11,1.8);windowAt(-.15,4.6,1.8,true);windowAt(20.52,4.8,1.5,true);
 const curtains=[box(8.1,1.9,7.14,3.3,.3,.035,'#c9bc9f'),box(3,1.9,7.14,1.7,.3,.035,'#c9bc9f'),box(-.18,1.9,4.6,.035,.3,1.7,'#c9bc9f')];
 // Kitchen: natural oak island and cabinet runs from the HTH references.
 box(9.1,.58,.42,2.9,.9,.65,'#be9e6d');box(9.1,1.06,.42,3,.08,.72,'#eee5d4');box(9.1,.57,2.18,2.15,.9,.95,'#c6a775');box(9.1,1.07,2.18,2.23,.09,1.02,'#eee5d4');box(10.55,1.2,1.02,.6,2.1,1.15,'#ba996d');box(10.22,1.2,1.05,.015,.5,.45,'#363936');box(8.4,1.12,2.18,.5,.025,.4,'#424947');box(8.4,1.14,2.18,.39,.03,.29,'#a8b5af');box(9.2,1.11,.4,.7,.025,.4,'#343a36');
 for(let i=0;i<5;i++)box(7.8+i*.55,.58,.77,.012,.86,.01,'#997c54');
 // Living room: beige modular sofa, pale rug, steel coffee-table frame.
 box(3.05,.14,5.16,3.8,.035,2.7,'#e9e1d2');
 for(let i=0;i<3;i++){box(2.05+i*.72,.43,5.8,.7,.52,.93,'#bdb1a0');box(2.05+i*.72,.77,6.12,.7,.45,.23,'#c7bdad');}
 box(4.25,.43,5.5,.82,.52,1.55,'#bdb1a0');box(4.53,.7,5.5,.2,.4,1.5,'#c7bdad');
 box(2.9,.51,4.6,1.35,.07,.68,'#bca782');for(const x of [2.35,3.45])for(const z of [4.35,4.85])box(x,.31,z,.035,.4,.035,'#8c9290');
 box(.8,.46,3.95,.8,.5,.8,'#cbbca5');box(.8,.77,3.65,.8,.5,.2,'#cbbca5');
 // Dining table and six chairs.
 box(8.72,.88,5.1,1.2,.1,2.15,'#c7ac7c');for(const x of [8.25,9.2])for(const z of [4.3,5.9])box(x,.48,z,.07,.8,.07,'#a68d65');
 for(const x of [7.8,9.65])for(const z of [4.4,5.15,5.9]){box(x,.53,z,.43,.09,.43,'#d3c5ad');box(x,.8,z+.19,.43,.5,.055,'#bc9f70');}
 function bed(x,z,w=1.8,d=2){box(x,.32,z,w,.4,d,'#b6a38b');box(x,.57,z,w,.18,d,'#efebe2');box(x,.8,z-d/2,w+.1,.9,.15,'#cdbda8');box(x,.7,z-.55,w-.15,.08,.4,'#faf8f1');box(x,.7,z+.4,w,.08,.8,'#c9b9a1');}
 bed(3.55,1.5);bed(14.4,1.45,1.05);bed(18.8,1.45,1.05);
 for(const x of [5.6,7.2])box(x,1.04,1.1,.48,1.8,1.9,'#d2b992');
 box(19.9,.8,4.7,.65,.08,1.7,'#c8ad7d');box(19.9,1.12,4.7,.06,.55,.8,'#424a48');box(19.1,.48,4.7,.55,.08,.55,'#bfb29d');
 for(const r of rooms.filter(r=>r.tile)){
  box(r.x+.45,.6,r.z+.5,.7,.75,.5,'#c7b391');box(r.x+.45,1,r.z+.5,.74,.05,.55,'#f9f8f1');
  if(r.id.startsWith('bad')){cylinder(r.x+r.w-.45,.4,r.z+r.d-.5,.22,.45,'#f6f5ed');box(r.x+.45,.14,r.z+r.d-.55,.8,.05,.9,'#aaa597');}
 }
 // Carport, shed and a simplified Tesla; deliberately no roof in dashboard view.
 box(17.8,-.02,10.1,6.1,.13,5.5,'#cbc9bc');box(15.5,.85,11.1,1.5,1.7,2.9,'#636a5c');
 for(const x of [15,20.5])for(const z of [7.8,12.6])box(x,1.12,z,.12,2.2,.12,'#697062');
 box(18.55,.55,10.6,1.8,.6,3.5,'#e9e8df');box(18.55,.99,10.5,1.55,.45,1.8,'#758580');
 for(const x of [17.65,19.45])for(const z of [9.5,11.7])cylinder(x,.3,z,.28,.18,'#383d39').rotation.z=Math.PI/2;
 box(20.35,1.05,8.4,.15,.45,.3,'#454d45');
 // Terrace and soft landscape.
 box(7,-.04,9.1,11,.08,3,'#ddd9cb');
 for(const [x,z] of [[-2,1],[-2,6],[1,9],[11.9,10],[13,11.5],[21.7,2]]){cylinder(x,.25,z,.4,.45,'#aaa18b');cylinder(x,.8,z,.6,.9,'#8b9970');}
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let gesture=null;
 function pick(e){const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObjects(targets)[0]?.object.userData.room;}
 const activePointers=new Set();
 function cancel(){if(gesture)clearTimeout(gesture.timer);gesture=null;}
 renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1){cancel();return;}if(e.button!==0)return;const id=pick(e);if(!id)return;gesture={x:e.clientX,y:e.clientY,id,held:false};gesture.timer=setTimeout(()=>{if(gesture){gesture.held=true;onHold(id);}},650);});
 renderer.domElement.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7)cancel();});
 renderer.domElement.addEventListener('pointerup',()=>{activePointers.clear();if(gesture&&!gesture.held)onTap(gesture.id);cancel();});
 renderer.domElement.addEventListener('pointercancel',()=>{activePointers.clear();cancel();});
 renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();const id=pick(e);if(id)onHold(id);});
 const project=new THREE.Vector3();let showingLabels=true;
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
 function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);for(const r of rooms){project.set(r.x+r.w/2,.23,r.z+r.d/2).project(camera);const el=labels[r.id];el.style.left=`${(project.x+1)/2*host.clientWidth}px`;el.style.top=`${(-project.y+1)/2*host.clientHeight}px`;el.hidden=!showingLabels||project.z>1||camera.position.distanceTo(controls.target)<9;}}animate();
 return {home,zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},toggleLabels(){showingLabels=!showingLabels;for(const label of Object.values(labels))label.hidden=!showingLabels;},update(state,selected){curtains.forEach((mesh,i)=>{const height=Math.max(.04,1.25*(1-state.stue.curtains[i]/100));mesh.scale.y=height/.3;mesh.position.y=2.03-height/2;});for(const r of rooms){const s=state[r.id],on=Object.values(s.lights).some(Boolean);if(!floors[r.id].userData.ownMaterial){floors[r.id].material=floors[r.id].material.clone();floors[r.id].userData.ownMaterial=true;}floors[r.id].material.emissive.set(on?'#9d671d':'#000000');floors[r.id].material.emissiveIntensity=on?s.brightness/100*.19:0;labels[r.id].classList.toggle('is-on',on);labels[r.id].classList.toggle('selected',r.id===selected);labels[r.id].querySelector('small').textContent=`${s.current.toLocaleString('da-DK')}° · ${on?'Tændt':'Slukket'}`;}}};
}
