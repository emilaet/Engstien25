import {buildFurnishings} from './furniture.js';
import {initialFurnishing} from './furnishing-data.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {rooms} from './house.js';
import {interior,finishedFloor,toPlan} from './architecture.js';
import {buildStructure} from './structure.js';
import {buildCharger,carportPostPixels} from './charger.js';
import {buildRoomLighting} from './room-lighting.js';
import {buildCarportRoof} from './carport.js';
import {frameOverview} from './camera-framing.js';
import {floorMaterial,oakMaps} from './visual-materials.js';
import {buildLandscape} from './landscape.js';
export function createHouse(host,onTap,onHold,options={}){
 let dirty=true,lastDraw=0;const scene=new THREE.Scene();scene.background=new THREE.Color('#eeede7');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#eeede7');host.append(renderer.domElement);

 const perspective=new THREE.PerspectiveCamera(25,1,.1,150);
 const planCamera=new THREE.OrthographicCamera(-15,15,10,-10,.1,150);
 let camera=perspective,isPlan=false,activeView='rooms',transition=null,charging=true,overview=true;
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');motionPreference.addEventListener('change',()=>{dirty=true;});
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.08;controls.minDistance=6;controls.maxDistance=50;controls.maxZoom=8;controls.minZoom=.5;controls.enablePan=true;
 controls.addEventListener('change',()=>{dirty=true;});
 controls.addEventListener('start',()=>{overview=false;});
 const home=()=>{dirty=true;transition=null;overview=true;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=false;camera=perspective;controls.object=camera;controls.enableRotate=true;camera.position.set(22,27,29);controls.target.set(10,0,6.9);controls.minDistance=6;controls.maxDistance=90;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI/2-.08;controls.update();};home();
 const togglePlan=()=>{dirty=true;transition=null;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=!isPlan;if(!isPlan){home();return false;}camera=planCamera;controls.object=camera;controls.enableRotate=false;controls.target.set(10.7,0,6.8);camera.position.set(10.7,40,6.801);camera.zoom=1;camera.updateProjectionMatrix();controls.update();return true;};
 const ambient=new THREE.HemisphereLight(0xfffcf0,0x64717c,1.8);scene.add(ambient);let roofEnabled=true,daylight=1;
 const sun=new THREE.DirectionalLight(0xfff4df,2.2);sun.position.set(-6,22,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:25,bottom:-25});sun.shadow.bias=-.001;scene.add(sun);
 const mats={};function mat(color,roughness=.8){return mats[color]??=new THREE.MeshStandardMaterial({color,roughness});}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

 const ground=box(10,-.4,6.5,32,.2,23,'#e6e5dc');
 box(interior.width/2,-.14,interior.depth/2,interior.width+.82,.35,interior.depth+.82,'#d1c9b9');
 const floors={},selectionOutlines={};const targets=[],seams=[];
 for(const r of rooms){
  const shape=new THREE.Shape(r.polygon.map(([x,z])=>new THREE.Vector2(x,-z)));
  const f=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.1,bevelEnabled:false}),floorMaterial(r.tile));
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
  const outline=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(r.polygon.map(([x,z])=>new THREE.Vector3(x,finishedFloor+.025,z))),new THREE.LineBasicMaterial({color:'#d99e48',depthTest:false}));outline.visible=false;outline.renderOrder=5;scene.add(outline);selectionOutlines[r.id]=outline;

 }
 const seamGeometry=new THREE.BufferGeometry();seamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));const seamLines=new THREE.LineSegments(seamGeometry,new THREE.LineBasicMaterial({color:'#a9ab94',transparent:true,opacity:.28}));scene.add(seamLines);
 const structure=buildStructure(scene);let cutaway=true;
 const charger=buildCharger(scene);
 // A camera presentation light makes black-on-black detail readable in close-up.
 const chargerFill=new THREE.DirectionalLight('#ffdfbd',0);chargerFill.position.copy(charger.root.position).add(new THREE.Vector3(2,2,1));chargerFill.target=charger.root;scene.add(chargerFill);
 const furnishing=buildFurnishings(scene,options.furnishings||initialFurnishing());let furnitureEditing=false;
 const localLights=buildRoomLighting(scene,options.furnishings||initialFurnishing());localLights.bindArchitecture(structure,floors);localLights.bindFurniture(furnishing.root);
 const carport=buildCarportRoof(scene);
 function updateRoof(){carport.setView({plan:isPlan,charger:activeView==='charger',enabled:roofEnabled});host.dataset.carportRoof=String(carport.root.visible);}
 function setAppearance(value){const t=value.daylight;daylight=t;seamLines.material.opacity=0;seamLines.material.color.set(value.theme==='dark'?'#697268':'#a9ab94');scene.background.set(value.theme==='dark'?'#1b1e1c':'#e9e5dd');ground.material.color.set(value.theme==='dark'?'#232824':'#e6e1d7');ambient.intensity=activeView==='charger'?.5:.16+t*1.40;sun.intensity=.12+t*2.04;ground.visible=value.theme!=='dark';sun.color.set(t<.5?'#b4c8e1':'#fff0d8');renderer.toneMappingExposure=.95;host.dataset.appearance=value.theme;host.dataset.daylight=t.toFixed(3);dirty=true;renderer.shadowMap.needsUpdate=true;}
 function applyLimits(){
  const close=activeView==='charger';controls.minDistance=close?.6:furnitureEditing?.7:6;controls.maxDistance=close?5:50;
  controls.minAzimuthAngle=close?Math.PI*.25:-Infinity;controls.maxAzimuthAngle=close?Math.PI*.75:Infinity;
  controls.minPolarAngle=close?Math.PI/3:0;controls.maxPolarAngle=close?Math.PI/2+.15:Math.PI/2-.08;
 }
 function moveCamera(position,target){dirty=true;
  overview=false;
  controls.minDistance=.2;controls.maxDistance=150;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI-.001;
  if(isPlan){
   const direction=planCamera.position.clone().sub(controls.target).normalize();
   const distance=(planCamera.top-planCamera.bottom)/(2*planCamera.zoom*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2)));
   perspective.position.copy(controls.target).addScaledVector(direction,distance);camera=perspective;controls.object=camera;isPlan=false;
  }
  updateRoof();controls.enableDamping=false;controls.update();controls.enableDamping=true;controls.enabled=false;controls.enableRotate=true;
  transition={fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),toPosition:position,toTarget:target,frames:0,started:performance.now(),duration:motionPreference.matches?0:1450};
  host.dataset.cameraMoving='true';host.setAttribute('aria-busy','true');
 }
 function focusCharger(){
  const target=charger.root.position.clone().add(new THREE.Vector3(.05,-.035,-.25));
  moveCamera(target.clone().add(new THREE.Vector3(1.85,.18,.95)),target);
 }
 function setView(view){
  if(view===activeView)return;activeView=view;host.dataset.view=view;ambient.intensity=view==='charger'?.5:.16+daylight*1.4;chargerFill.intensity=view==='charger'?2.8:0;
  host.setAttribute('aria-label',view==='charger'?'3D-nærbillede af billader':'Interaktiv 3D-model af huset');
  structure.setCutaway(view==='charger'?false:cutaway);localLights.syncClipping();updateRoof();renderer.shadowMap.needsUpdate=true;
  if(view==='charger')focusCharger();else{const preview=perspective.clone(),framing=frameOverview(preview);moveCamera(preview.position,framing.target);}
 }
 // Empty carport/shed; no cars, furniture, cabinetry or bathroom fittings.
 const a=toPlan([1717,739]),b=toPlan([2247,1267]);
 box((a[0]+b[0])/2,.02,(a[1]+b[1])/2,b[0]-a[0],.13,b[1]-a[1],'#cbc9bc');
 for(const [i,p] of carportPostPixels.entries()){const [x,z]=toPlan(p);const post=box(x,1.15,z,.1,2.2,.1,'#697062');post.name=`carport-end-post-${i}`;}
 const terrace=toPlan([1050,895]);const terraceFloor=box(terrace[0],-.04,terrace[1],12.8,.08,3.4,'#ccb18a');const deck=oakMaps({floor:true,deck:true});for(const map of Object.values(deck))map.repeat.set(12.8/3.2,3.4/1.6);terraceFloor.material=new THREE.MeshStandardMaterial({color:'#c8ac83',...deck,bumpScale:.004,roughness:.82});localLights.bindExterior(terraceFloor);
 buildLandscape(scene);
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let gesture=null;
 function interrupt(){if(!transition)return;transition=null;controls.enabled=true;dirty=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 function choose(id,hold=false){if(id?.startsWith('@'))options.onFurnitureSelect?.(id.slice(1));else if(id)(hold?onHold:onTap)(id);}
 function pick(e){if(activeView==='charger'||transition)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);for(const hit of ray.intersectObjects([...targets,structure.root,charger.root,furnishing.root],true)){let hidden=false;for(let object=hit.object;object;object=object.parent)if(!object.visible)hidden=true;if(hidden)continue;const id=hit.object.userData.furnitureId;if(id)return furnitureEditing?'@'+id:hit.object.userData.room;if(hit.object.userData.room)return furnitureEditing?undefined:hit.object.userData.room;if(cutaway&&hit.point.y>finishedFloor+1.205)continue;if(hit.object.isMesh)return;}return undefined;}

 const activePointers=new Set();let interruptedPointer=null;
 renderer.domElement.addEventListener('pointerdown',e=>{if(transition){interruptedPointer=e.pointerId;interrupt();}},{capture:true});
 renderer.domElement.addEventListener('wheel',interrupt,{capture:true,passive:true});
 function cancel(){if(gesture)clearTimeout(gesture.timer);gesture=null;}
 renderer.domElement.addEventListener('pointerdown',e=>{if(interruptedPointer===e.pointerId)return;activePointers.add(e.pointerId);if(activePointers.size>1){cancel();return;}if(e.button!==0)return;const id=pick(e);if(!id)return;gesture={x:e.clientX,y:e.clientY,id,held:false};gesture.timer=setTimeout(()=>{if(gesture){gesture.held=true;choose(id,true);}},650);});
 renderer.domElement.addEventListener('pointermove',e=>{if(gesture&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>7)cancel();});
 renderer.domElement.addEventListener('pointerup',()=>{interruptedPointer=null;activePointers.clear();if(gesture&&!gesture.held)choose(gesture.id);cancel();});
 renderer.domElement.addEventListener('pointercancel',()=>{interruptedPointer=null;activePointers.clear();cancel();});
 renderer.domElement.addEventListener('contextmenu',e=>{e.preventDefault();const id=pick(e);if(id)choose(id,true);});
 let selectedRoom=null;
 const project=new THREE.Vector3();
 function fit(){if(isPlan||!overview)return;controls.maxDistance=90;const framing=frameOverview(perspective);controls.target.copy(framing.target);controls.update();host.dataset.overviewExtent=framing.extent.toFixed(3);}
 function resize(){dirty=true;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();const halfH=Math.max(8.5,12.7/(w/h));planCamera.left=-halfH*w/h;planCamera.right=halfH*w/h;planCamera.top=halfH;planCamera.bottom=-halfH;planCamera.updateProjectionMatrix();fit();}new ResizeObserver(resize).observe(host);resize();
 function animate(now=performance.now()){
 requestAnimationFrame(animate);if(host.closest('[hidden]')||document.hidden)return;
 if(transition){dirty=true;
  // Keep a visible flight without stretching a slow tablet's animation indefinitely.
  transition.frames++;
  const progress=transition.duration===0?1:Math.min(1,Math.max(0,now-transition.started)/transition.duration,transition.frames/8);
  const eased=progress*progress*(3-2*progress);
  camera.position.lerpVectors(transition.fromPosition,transition.toPosition,eased);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,eased);camera.lookAt(controls.target);
  if(progress===1){transition=null;controls.enabled=true;applyLimits();controls.update();host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 }else controls.update();
 const pulseFrame=activeView==='charger'&&charging&&!motionPreference.matches;
 if(!dirty&&(!pulseFrame||now-lastDraw<33))return;dirty=false;lastDraw=now;
 host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);
 host.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(3);
 host.dataset.chargerPulse=charger.update(now/1000,charging,motionPreference.matches).toFixed(3);
 renderer.render(scene,camera);
 const points={};for(const r of rooms){project.set(r.x+r.w/2,finishedFloor+.03,r.z+r.d/2).project(camera);points[r.id]=[(project.x+1)/2,(-project.y+1)/2];}host.dataset.roomPoints=JSON.stringify(points);
 }host.dataset.furnitureCount=String((options.furnishings||initialFurnishing()).items.filter(i=>i.visible).length);host.dataset.furnitureVisible=String(furnishing.visible);animate();
 updateRoof();
 return {home(){home();fit();updateRoof();},togglePlan(){const value=togglePlan();if(!value)fit();updateRoof();return value;},setAppearance,setView,focusCharger,toggleRoof(){roofEnabled=!roofEnabled;updateRoof();renderer.shadowMap.needsUpdate=true;dirty=true;return roofEnabled;},setFurnishings(value){furnishing.setSnapshot(value);localLights.setFurnishings(value,furnishing.root);renderer.shadowMap.needsUpdate=true;dirty=true;host.dataset.furnitureCount=String(value.items.filter(i=>i.visible).length);host.dataset.furnitureVisible=String(value.visible);},setFurnitureEditing(value){furnitureEditing=value;if(!value)furnishing.select(null);dirty=true;},selectFurniture(id,focus=false){furnishing.select(id);dirty=true;if(focus){const g=furnishing.get(id);if(g){const box=new THREE.Box3().setFromObject(g),target=box.getCenter(new THREE.Vector3());const bounds=box.getSize(new THREE.Vector3());const distance=Math.max(.65,Math.max(bounds.x,bounds.z)/2.6);const item=g.userData.furniture||(options.furnishings||initialFurnishing()).items.find(i=>i.id===id),front=new THREE.Vector3(0,0,['sofa','armchair','kitchenIsland'].includes(item?.type)?-1:1);if(item?.type==='wardrobe'&&item.depth>item.width)front.set(1,0,0);if(item?.type==='kitchenTowers')front.set(-1,0,0);front.applyAxisAngle(new THREE.Vector3(0,1,0),g.rotation.y);const side=new THREE.Vector3(front.z,0,-front.x),offset=front.multiplyScalar(3.6).addScaledVector(side,2.6).add(new THREE.Vector3(0,4.3,0));if(item?.type==='utility'){const cameraY=Math.max(3.35,bounds.x/(2*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect)+.7);moveCamera(new THREE.Vector3(g.position.x,cameraY,g.position.z-1.20),target);}else moveCamera(target.clone().addScaledVector(offset,distance),target);}}},setCharging(value){if(charging!==!!value)dirty=true;charging=!!value;},setQuality(value){renderer.setPixelRatio(value==='light'?1:value==='detailed'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=value!=='light';sun.shadow.mapSize.set(value==='detailed'?2048:1024,value==='detailed'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;renderer.shadowMap.needsUpdate=true;resize();dirty=true;},toggleWalls(){dirty=true;cutaway=!cutaway;structure.setCutaway(activeView==='charger'?false:cutaway);localLights.syncClipping();renderer.shadowMap.needsUpdate=true;return cutaway;},zoom(factor){overview=false;interrupt();dirty=true;if(isPlan){camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,.5,8);camera.updateProjectionMatrix();}else camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},update(state,selected){dirty=true;const active=localLights.update(state);host.dataset.activeLights=JSON.stringify(active);selectedRoom=selected;host.dataset.selectedRoom=selected||'';for(const r of rooms){const s=state[r.id],on=Object.values(s.lights).some(Boolean);floors[r.id].material.emissive.set('#000000');floors[r.id].material.emissiveIntensity=0;selectionOutlines[r.id].visible=r.id===selected;}}};
}
