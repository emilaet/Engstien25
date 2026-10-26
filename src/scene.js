import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {rooms} from './house.js';
import {interior,finishedFloor,toPlan} from './architecture.js';
import {buildStructure} from './structure.js';
import {buildCharger,carportPostPixels} from './charger.js';
export function createHouse(host,onTap,onHold){
 let dirty=true,lastDraw=0;const scene=new THREE.Scene();scene.background=new THREE.Color('#eeede7');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#eeede7');host.append(renderer.domElement);
 const perspective=new THREE.PerspectiveCamera(35,1,.1,150);
 const planCamera=new THREE.OrthographicCamera(-15,15,10,-10,.1,150);
 let camera=perspective,isPlan=false,activeView='rooms',transition=null,charging=true;
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');motionPreference.addEventListener('change',()=>{dirty=true;});
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.08;controls.minDistance=6;controls.maxDistance=50;controls.maxZoom=8;controls.minZoom=.5;controls.enablePan=true;
 controls.addEventListener('change',()=>{dirty=true;});
 const home=()=>{dirty=true;transition=null;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=false;camera=perspective;controls.object=camera;controls.enableRotate=true;camera.position.set(19,23,21);controls.target.set(9.7,0,3.5);controls.minDistance=6;controls.maxDistance=50;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI/2-.08;controls.update();};home();
 const togglePlan=()=>{dirty=true;transition=null;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=!isPlan;if(!isPlan){home();return false;}camera=planCamera;controls.object=camera;controls.enableRotate=false;controls.target.set(10.7,0,6.8);camera.position.set(10.7,40,6.801);camera.zoom=1;camera.updateProjectionMatrix();controls.update();return true;};
 scene.add(new THREE.HemisphereLight(0xfffcf0,0xada99b,1.8));
 const sun=new THREE.DirectionalLight(0xfff4df,2.2);sun.position.set(-6,22,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:25,bottom:-25});sun.shadow.bias=-.001;scene.add(sun);
 const mats={};function mat(color,roughness=.8){return mats[color]??=new THREE.MeshStandardMaterial({color,roughness});}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

 box(10,-.4,6.5,32,.2,23,'#e6e5dc');
 box(interior.width/2,-.14,interior.depth/2,interior.width+.82,.35,interior.depth+.82,'#d1c9b9');
 const floors={},labels={},selectionOutlines={};const targets=[],seams=[];
 for(const r of rooms){
  const shape=new THREE.Shape(r.polygon.map(([x,z])=>new THREE.Vector2(x,-z)));
  const f=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false}),mat(r.tile?'#d8d2c7':'#d6b98c').clone());
  f.rotation.x=-Math.PI/2;f.position.y=.02;f.receiveShadow=true;f.name=`floor_${r.id}`;f.userData.room=r.id;scene.add(f);targets.push(f);floors[r.id]=f;
  // Clip floor seams to each polygon, including the office and bedroom notches.
  const spacing=r.tile?.6:.2;
  for(let x=r.x+spacing;x<r.x+r.w;x+=spacing){
   const crossings=[];for(let i=0;i<r.polygon.length;i++){
    const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length];
    if((a[0]>x)!==(b[0]>x))crossings.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));
   }
   crossings.sort((a,b)=>a-b);
   for(let i=0;i<crossings.length-1;i+=2)seams.push(x,.122,crossings[i],x,.122,crossings[i+1]);
  }
  const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(r.polygon.map(([x,z])=>new THREE.Vector3(x,finishedFloor+.025,z))),new THREE.LineBasicMaterial({color:'#315f4b',depthTest:false}));outline.visible=false;outline.renderOrder=5;scene.add(outline);selectionOutlines[r.id]=outline;
  const label=document.createElement('button');label.className='room-label';label.innerHTML=`<span>${r.short}</span><small></small>`;label.setAttribute('aria-label',`Åbn ${r.name}`);label.hidden=true;host.append(label);label.onclick=()=>onHold(r.id);labels[r.id]=label;
 }
 const seamGeometry=new THREE.BufferGeometry();seamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));scene.add(new THREE.LineSegments(seamGeometry,new THREE.LineBasicMaterial({color:'#a9ab94',transparent:true,opacity:.42})));
 const structure=buildStructure(scene);let cutaway=true;
 const charger=buildCharger(scene);
 function applyLimits(){
  const close=activeView==='charger';controls.minDistance=close?.6:6;controls.maxDistance=close?5:50;
  controls.minAzimuthAngle=close?Math.PI*.25:-Infinity;controls.maxAzimuthAngle=close?Math.PI*.75:Infinity;
  controls.minPolarAngle=close?Math.PI/3:0;controls.maxPolarAngle=close?Math.PI/2+.15:Math.PI/2-.08;
 }
 function moveCamera(position,target){dirty=true;
  controls.minDistance=.2;controls.maxDistance=150;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI-.001;
  if(isPlan){
   const direction=planCamera.position.clone().sub(controls.target).normalize();
   const distance=(planCamera.top-planCamera.bottom)/(2*planCamera.zoom*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2)));
   perspective.position.copy(controls.target).addScaledVector(direction,distance);camera=perspective;controls.object=camera;isPlan=false;
  }
  controls.enableDamping=false;controls.update();controls.enableDamping=true;controls.enabled=false;controls.enableRotate=true;
  transition={fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),toPosition:position,toTarget:target,elapsed:0,lastFrame:performance.now(),duration:motionPreference.matches?0:1450};
  host.dataset.cameraMoving='true';host.setAttribute('aria-busy','true');
 }
 function focusCharger(){
  const target=charger.root.position.clone().add(new THREE.Vector3(.05,-.035,0));
  moveCamera(target.clone().add(new THREE.Vector3(1.85,.22,.45)),target);
 }
 function setView(view){
  if(view===activeView)return;activeView=view;host.dataset.view=view;
  host.setAttribute('aria-label',view==='charger'?'3D-nærbillede af billader':'Interaktiv 3D-model af huset');
  structure.setCutaway(view==='charger'?false:cutaway);renderer.shadowMap.needsUpdate=true;
  if(view==='charger')focusCharger();else moveCamera(new THREE.Vector3(19,23,21),new THREE.Vector3(9.7,0,3.5));
 }
 // Empty carport/shed; no cars, furniture, cabinetry or bathroom fittings.
 const a=toPlan([1717,739]),b=toPlan([2247,1267]);
 box((a[0]+b[0])/2,.02,(a[1]+b[1])/2,b[0]-a[0],.13,b[1]-a[1],'#cbc9bc');
 for(const [i,p] of carportPostPixels.entries()){const [x,z]=toPlan(p);const post=box(x,1.15,z,.1,2.2,.1,'#697062');post.name=`carport-end-post-${i}`;}
 const terrace=toPlan([1050,895]);box(terrace[0],-.04,terrace[1],12.8,.08,3.4,'#ddd9cb');
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let gesture=null;
 function interrupt(){if(!transition)return;transition=null;controls.enabled=true;dirty=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 function pick(e){if(activeView==='charger'||transition)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);for(const hit of ray.intersectObjects([...targets,structure.root,charger.root],true)){if(hit.object.userData.room)return hit.object.userData.room;if(cutaway&&hit.point.y>finishedFloor+1.205)continue;if(hit.object.isMesh)return;}return undefined;}
 const activePointers=new Set();let interruptedPointer=null;
 renderer.domElement.addEventListener('pointerdown',e=>{if(transition){interruptedPointer=e.pointerId;interrupt();}},{capture:true});
 renderer.domElement.addEventListener('wheel',interrupt,{capture:true,passive:true});
 function cancel(){if(gesture)clearTimeout(gesture.timer);gesture=null;}
 renderer.domElement.addEventListener('pointerdown',e=>{if(interruptedPointer===e.pointerId)return;activePointers.add(e.pointerId);if(activePointers.size>1){cancel();return;}if(e.button!==0)return;const id=pick(e);if(!id)return;gesture={x:e.clientX,y:e.clientY,id,held:false};gesture.timer=setTimeout(()=>{if(gesture){gesture.held=true;onHold(id);}},650);});
 renderer.domElement.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7)cancel();});
 renderer.domElement.addEventListener('pointerup',()=>{interruptedPointer=null;activePointers.clear();if(gesture&&!gesture.held)onTap(gesture.id);cancel();});
 renderer.domElement.addEventListener('pointercancel',()=>{interruptedPointer=null;activePointers.clear();cancel();});
 renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();const id=pick(e);if(id)onHold(id);});
 const project=new THREE.Vector3();let showingLabels=false,selectedRoom=null,flashRoomId=null,flashTimer;
 function refreshLabels(){
  for(const r of rooms){
   const contextual=r.id===selectedRoom||r.id===flashRoomId;
   labels[r.id].classList.toggle('context-only',!showingLabels);
   labels[r.id].hidden=activeView==='charger'||!(contextual||showingLabels)||labels[r.id].dataset.offscreen==='true'||(!contextual&&camera.position.distanceTo(controls.target)<9);
  }
 }
 function flashRoom(id){flashRoomId=id;clearTimeout(flashTimer);refreshLabels();flashTimer=setTimeout(()=>{flashRoomId=null;refreshLabels();},1800);}
 function resize(){dirty=true;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();const halfH=Math.max(8.5,12.7/(w/h));planCamera.left=-halfH*w/h;planCamera.right=halfH*w/h;planCamera.top=halfH;planCamera.bottom=-halfH;planCamera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
 function animate(now=performance.now()){
 requestAnimationFrame(animate);if(host.closest('[hidden]')||document.hidden)return;
 if(transition){dirty=true;
  // Shader compilation or a slow first frame must not skip the whole flight.
  transition.elapsed+=Math.min(100,Math.max(0,now-transition.lastFrame));transition.lastFrame=now;
  const progress=transition.duration===0?1:THREE.MathUtils.clamp(transition.elapsed/transition.duration,0,1);
  const eased=progress*progress*(3-2*progress);
  camera.position.lerpVectors(transition.fromPosition,transition.toPosition,eased);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,eased);camera.lookAt(controls.target);
  if(progress===1){transition=null;controls.enabled=true;applyLimits();controls.update();host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 }else controls.update();
 const pulseFrame=activeView==='charger'&&charging&&!motionPreference.matches;
 if(!dirty&&(!pulseFrame||now-lastDraw<33))return;dirty=false;lastDraw=now;
 host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);
 host.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(3);
 host.dataset.chargerPulse=charger.update(now/1000,charging,motionPreference.matches).toFixed(3);
 renderer.render(scene,camera);for(const r of rooms){project.set(r.x+r.w/2,finishedFloor+.03,r.z+r.d/2).project(camera);const el=labels[r.id];el.style.left=`${(project.x+1)/2*host.clientWidth}px`;el.style.top=`${(-project.y+1)/2*host.clientHeight}px`;el.dataset.offscreen=String(project.z>1||project.z< -1);
 }refreshLabels();}animate();
 return {home,togglePlan,setView,focusCharger,setCharging(value){if(charging!==!!value)dirty=true;charging=!!value;},setQuality(value){renderer.setPixelRatio(value==='light'?1:value==='detailed'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=value!=='light';sun.shadow.mapSize.set(value==='detailed'?2048:1024,value==='detailed'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;renderer.shadowMap.needsUpdate=true;resize();dirty=true;},toggleWalls(){dirty=true;cutaway=!cutaway;structure.setCutaway(activeView==='charger'?false:cutaway);renderer.shadowMap.needsUpdate=true;return cutaway;},zoom(factor){interrupt();dirty=true;if(isPlan){camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,.5,8);camera.updateProjectionMatrix();}else camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},flashRoom,toggleLabels(){showingLabels=!showingLabels;refreshLabels();return showingLabels;},update(state,selected){dirty=true;selectedRoom=selected;host.dataset.selectedRoom=selected||'';for(const r of rooms){const s=state[r.id],on=Object.values(s.lights).some(Boolean);floors[r.id].material.color.set(on?(r.tile?'#e9d5a0':'#e4bd77'):(r.tile?'#b5bbb4':'#b6b6a6'));floors[r.id].material.emissive.set(on?'#e6a335':'#000000');floors[r.id].material.emissiveIntensity=on?.18+s.brightness/100*.35:0;selectionOutlines[r.id].visible=r.id===selected;if(r.id===selected){floors[r.id].material.color.set('#c5d9c2');floors[r.id].material.emissive.set('#8bb796');floors[r.id].material.emissiveIntensity=.25;}labels[r.id].classList.toggle('is-on',on);labels[r.id].classList.toggle('selected',r.id===selected);labels[r.id].querySelector('small').textContent=`${s.current.toLocaleString('da-DK')}° · ${on?'Lys tændt':'Lys slukket'}`;}refreshLabels();}};
}
