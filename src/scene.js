import {buildFurnishings} from './furniture.js';
import {initialFurnishing} from './furnishing-data.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {rooms} from './house.js';
import {interior,finishedFloor,toPlan} from './architecture.js';
import {buildExterior} from './exterior.js';
import {buildStructure,cutawayHeight} from './structure.js';
import {buildCharger,buildChargerFill,carportPostPixels} from './charger.js';
import {buildRoomLighting} from './room-lighting.js';
import {buildCarportRoof} from './carport.js';
import {frameOverview,framePlan,frameExterior} from './camera-framing.js';
import {floorMaterial} from './visual-materials.js';


import {outdoorY,driveway,terracePolygons,westTerrace} from './outdoor-layout.js';
const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
export async function createHouse(host,onTap,onHold,options={}){
 let dirty=true,lastDraw=0,frame=0,contextLost=false,sceneReady=false,recoveryTimer=null;
 function invalidate(){dirty=true;if(!frame&&!contextLost)frame=requestAnimationFrame(animate);}
const scene=new THREE.Scene();scene.background=null;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#e9e5dd',0);host.append(renderer.domElement);

 const perspective=new THREE.PerspectiveCamera(25,1,.1,500);
 const planCamera=new THREE.OrthographicCamera(-15,15,10,-10,.1,150);
 let isFull=false,exteriorSide='garden';
 let camera=perspective,isPlan=false,activeView='rooms',transition=null,charging=true,overview=true,quality='standard';
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');motionPreference.addEventListener('change',()=>{invalidate();});
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.08;controls.minDistance=6;controls.maxDistance=50;controls.maxZoom=8;controls.minZoom=.5;controls.enablePan=true;
 controls.addEventListener('change',()=>{invalidate();});
 controls.addEventListener('start',()=>{overview=false;});
 const home=()=>{invalidate();transition=null;overview=true;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=false;camera=perspective;controls.object=camera;controls.enableRotate=true;camera.position.set(22,27,29);controls.target.set(10,0,6.9);controls.minDistance=6;controls.maxDistance=180;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI/2-.08;controls.update();};home();
 const togglePlan=(force=false)=>{invalidate();transition=null;controls.enabled=true;host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');isPlan=force||!isPlan;if(!isPlan){home();return false;}camera=planCamera;controls.object=camera;controls.enableRotate=false;const target=framePlan(planCamera,perspective.aspect,{home:activeView==='home'});controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(0,40,.001));camera.zoom=1;camera.updateProjectionMatrix();controls.update();return true;};
 const ambient=new THREE.HemisphereLight(0xfffcf0,0x64717c,1.8);scene.add(ambient);let roofEnabled=true,daylight=1;
 const sun=new THREE.DirectionalLight(0xfff4df,2.2);sun.position.set(-6,22,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:25,bottom:-25});sun.shadow.bias=-.001;scene.add(sun);
 const mats={};function mat(color,roughness=.8){return mats[color]??=new THREE.MeshStandardMaterial({color,roughness});}
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#33372f',opacity:.14}));ground.rotation.x=-Math.PI/2;ground.position.set(10,-1.08,6.5);ground.receiveShadow=true;scene.add(ground);
 box(interior.width/2,-.14,interior.depth/2,interior.width+.82,.35,interior.depth+.82,'#d1c9b9');
 const floors={};const targets=[],seams=[];
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


 }
 const seamGeometry=new THREE.BufferGeometry();seamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));const seamLines=new THREE.LineSegments(seamGeometry,new THREE.LineBasicMaterial({color:'#a9ab94',transparent:true,opacity:.28}));scene.add(seamLines);
 await nextPaint();
 const structure=buildStructure(scene),exterior=buildExterior(scene);let cutaway=true;
 const charger=buildCharger(scene);
 // A camera presentation light makes black-on-black detail readable in close-up.
 const chargerFill=buildChargerFill(scene,charger.root);
 await nextPaint();
 const furnishing=buildFurnishings(scene,options.furnishings||initialFurnishing());let furnitureEditing=false;
 await nextPaint();
 const localLights=buildRoomLighting(scene,options.furnishings||initialFurnishing());localLights.bindArchitecture(structure,floors);localLights.bindFurniture(furnishing.root);
 const carport=buildCarportRoof(scene);
 function updateRoof(){carport.setView({plan:isPlan,charger:activeView==='charger',enabled:roofEnabled,full:isFull});host.dataset.carportRoof=String(carport.root.visible);}
 function setExterior(value){isFull=value;ground.position.y=-1.08;perspective.far=500;perspective.updateProjectionMatrix();controls.maxDistance=300;if(outdoorDecor)outdoorDecor.root.visible=true;if(landscape)landscape.root.visible=true;host.dataset.outdoorVisible=String(!!(landscape&&outdoorDecor));host.dataset.exteriorSide=value?exteriorSide:'';structure.setExteriorMode(value);structure.setCutaway(value?false:cutaway);exterior.setView({full:value,cutaway:value?false:cutaway});localLights.syncClipping();host.dataset.exterior=String(value);updateRoof();renderer.shadowMap.needsUpdate=true;invalidate();}
 function setAppearance(value){const t=value.daylight;daylight=t;seamLines.material.opacity=0;seamLines.material.color.set(value.theme==='dark'?'#697268':'#a9ab94');renderer.setClearColor(value.theme==='dark'?'#1b1e1c':'#e9e5dd',0);host.style.backgroundColor='transparent';ambient.intensity=.34+t*.90;sun.intensity=.14+t*1.65;ground.visible=value.theme!=='dark';sun.color.set(t<.5?'#b4c8e1':'#fff0d8');renderer.toneMappingExposure=1.04-t*.18;host.dataset.appearance=value.theme;host.dataset.daylight=t.toFixed(3);invalidate();renderer.shadowMap.needsUpdate=true;}
 function applyLimits(){
  const close=activeView==='charger';controls.minDistance=close?.6:furnitureEditing?.7:6;controls.maxDistance=close?5:300;
  controls.minAzimuthAngle=close?Math.PI*.25:-Infinity;controls.maxAzimuthAngle=close?Math.PI*.75:Infinity;
  controls.minPolarAngle=close?Math.PI/3:0;controls.maxPolarAngle=close?Math.PI/2+.15:Math.PI/2-.08;
 }
 function moveCamera(position,target){invalidate();
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
  const target=charger.root.position.clone().add(new THREE.Vector3(.03,-.035,-.10));
  moveCamera(target.clone().add(new THREE.Vector3(2.30,.18,.62)),target);
 }
 function setView(view){
  if(view===activeView)return;if(view!=='charger')setExterior(false);activeView=view;host.dataset.view=view;chargerFill.intensity=view==='charger'?20:0;chargerFill.castShadow=view==='charger';
  host.setAttribute('aria-label',view==='charger'?'3D-nærbillede af billader':'Interaktiv 3D-model af huset');
  structure.setChargerView(view==='charger');structure.setCutaway(isFull?false:cutaway);exterior.setView({full:isFull,cutaway:isFull?false:cutaway});localLights.syncClipping();updateRoof();renderer.shadowMap.needsUpdate=true;
  if(view==='home'){home();togglePlan();updateRoof();}else if(view==='charger')focusCharger();else{resize();const preview=perspective.clone(),framing=frameOverview(preview);moveCamera(preview.position,framing.target);overview=true;}
 }
 // Empty carport/shed; no cars, furniture, cabinetry or bathroom fittings.
 const a=toPlan([1717,739]),b=toPlan([2247,1267]);
 const carportFloor=box((a[0]+b[0])/2,.02,(a[1]+b[1])/2,b[0]-a[0],.13,b[1]-a[1],'#cbc9bc');localLights.bindOutdoor(carportFloor);
 for(const [i,p] of carportPostPixels.entries()){const [x,z]=toPlan(p);const post=box(x,1.15,z,.1,2.2,.1,'#343936');post.name=`carport-end-post-${i}`;}
 let landscape=null,outdoorDecor=null,outdoorPromise=null,outdoorRequest=0,latestState=null;
 async function ensureOutdoors(){
  if(outdoorPromise)return outdoorPromise;
  host.dataset.outdoorLoading='true';
  outdoorPromise=(async()=>{await nextPaint();const [{buildLandscape},{buildOutdoorFurnishings}]=await Promise.all([import('./landscape.js'),import('./outdoor-furniture.js')]);
 landscape=buildLandscape(scene);await nextPaint();outdoorDecor=buildOutdoorFurnishings(scene);
 landscape.root.visible=true;outdoorDecor.root.visible=true;host.dataset.outdoorVisible='true';
 const parkingGeometry=new THREE.PlaneGeometry(b[0]-a[0],b[1]-a[1]);
 const parkingUV=parkingGeometry.attributes.uv,parkingVertices=parkingGeometry.attributes.position;
 for(let i=0;i<parkingVertices.count;i++)parkingUV.setXY(i,(parkingVertices.getX(i)+(a[0]+b[0])/2)/2.4,(-parkingVertices.getY(i)+(a[1]+b[1])/2)/2.4);
 const parkingMaterial=landscape.pavingMaterial.clone();parkingMaterial.polygonOffset=true;parkingMaterial.polygonOffsetFactor=-1;parkingMaterial.polygonOffsetUnits=-1;const parkingPaving=new THREE.Mesh(parkingGeometry,parkingMaterial);parkingPaving.name='carport-level-paving';parkingPaving.rotation.x=-Math.PI/2;parkingPaving.position.set((a[0]+b[0])/2,outdoorY+.003,(a[1]+b[1])/2);parkingPaving.receiveShadow=true;landscape.root.add(parkingPaving);localLights.bindOutdoor(parkingPaving);

 for(const mesh of landscape.terraces)localLights.bindExterior(mesh);
 // Bind paving/fixtures, not every decorative leaf and chair, to keep the local
 // lighting pass bounded on tablets. Daylight/shadows still shade all meshes.
 localLights.bindOutdoor(landscape.driveway);
 if(landscape.fixtures)localLights.bindOutdoor(landscape.fixtures);
 host.dataset.outdoorLayout=JSON.stringify({terraces:terracePolygons,west:westTerrace,driveway:{rise:driveway.rise,run:driveway.run,slope:driveway.rise/driveway.run,coveredHeight:outdoorY}});

  if(latestState)landscape.update(latestState);await prepare();invalidate();
  })().catch(error=>{outdoorPromise=null;throw error;}).finally(()=>{host.dataset.outdoorLoading='false';});return outdoorPromise;
 }
 async function prepare(){if(renderer.compileAsync&&!contextLost)try{await renderer.compileAsync(scene,camera);}catch{/* The next render can compile synchronously on older drivers. */}}
 host.dataset.outdoorVisible='false';
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let gesture=null;
 function interrupt(){if(!transition)return;transition=null;controls.enabled=true;invalidate();host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 function choose(id,hold=false){if(id?.startsWith('@'))options.onFurnitureSelect?.(id.slice(1));else if(id)(hold?onHold:onTap)(id);}
 function pick(e){if(activeView==='charger'||isFull||transition)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);for(const hit of ray.intersectObjects([...targets,structure.root,charger.root,furnishing.root],true)){let hidden=false;for(let object=hit.object;object;object=object.parent)if(!object.visible)hidden=true;if(hidden)continue;const id=hit.object.userData.furnitureId;if(id)return furnitureEditing?'@'+id:hit.object.userData.room;if(hit.object.userData.room)return furnitureEditing?undefined:hit.object.userData.room;if(cutaway&&hit.point.y>finishedFloor+cutawayHeight+.005)continue;if(hit.object.isMesh)return;}return undefined;}

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
 function fit(){if(isPlan||!overview)return;controls.maxDistance=300;const framing=isFull?frameExterior(perspective,{side:exteriorSide}):frameOverview(perspective);if(host.closest('#home-model'))perspective.position.sub(framing.target).multiplyScalar(.8).add(framing.target);controls.target.copy(framing.target);controls.update();host.dataset.overviewExtent=framing.extent.toFixed(3);}
 function resize(){invalidate();const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);perspective.aspect=w/h;perspective.updateProjectionMatrix();framePlan(planCamera,w/h,{home:activeView==='home'});fit();}new ResizeObserver(resize).observe(host);resize();
 function animate(now=performance.now()){
 frame=0;if(!sceneReady||contextLost||host.closest('[hidden]')||document.hidden)return;
 if(transition){invalidate();
  // Keep a visible flight without stretching a slow tablet's animation indefinitely.
  transition.frames++;
  const progress=transition.duration===0?1:Math.min(1,Math.max(0,now-transition.started)/transition.duration,transition.frames/8);
  const eased=progress*progress*(3-2*progress);
  camera.position.lerpVectors(transition.fromPosition,transition.toPosition,eased);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,eased);camera.lookAt(controls.target);
  if(progress===1){transition=null;controls.enabled=true;applyLimits();controls.update();host.dataset.cameraMoving='false';host.removeAttribute('aria-busy');}
 }else controls.update();
 const pulseFrame=activeView==='charger'&&charging&&!motionPreference.matches;
 if(!frame&&(transition||pulseFrame))frame=requestAnimationFrame(animate);if(!dirty&&(!pulseFrame||now-lastDraw<33))return;dirty=false;lastDraw=now;
 host.dataset.renderCount=String(Number(host.dataset.renderCount||0)+1);
 host.dataset.houseLighting=JSON.stringify({ambient:ambient.intensity,sun:sun.intensity,sunColor:sun.color.getHex(),exposure:renderer.toneMappingExposure,cutaway:!isFull&&cutaway,full:isFull});
 host.dataset.cameraMode=isFull?'full':isPlan?'plan':'3d';host.dataset.cameraDistance=camera.position.distanceTo(controls.target).toFixed(3);
 host.dataset.chargerPulse=charger.update(now/1000,charging,motionPreference.matches).toFixed(3);
 renderer.render(scene,camera);host.dataset.renderFinish='native';document.querySelector('#scene .loading')?.remove();
 const points={};for(const r of rooms){project.set(r.x+r.w/2,finishedFloor+.03,r.z+r.d/2).project(camera);points[r.id]=[(project.x+1)/2,(-project.y+1)/2];}host.dataset.roomPoints=JSON.stringify(points);
 }host.dataset.furnitureCount=String((options.furnishings||initialFurnishing()).items.filter(i=>i.visible).length);host.dataset.furnitureVisible=String(furnishing.visible);
 renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;host.dataset.graphics='recovering';showRecovery('Gendanner 3D …');clearTimeout(recoveryTimer);recoveryTimer=setTimeout(()=>{if(!contextLost)return;showRecovery('Grafikken svarer ikke. Genindlæs for at starte 3D igen.');const retry=document.createElement('button');retry.textContent='Genindlæs 3D';retry.onclick=()=>location.reload();host.querySelector('.loading').append(retry);},5000);});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{clearTimeout(recoveryTimer);contextLost=false;host.dataset.graphics='ready';renderer.shadowMap.needsUpdate=true;resize();invalidate();});
 function showRecovery(text){let status=host.querySelector('.loading');if(!status){status=document.createElement('div');status.className='loading';status.setAttribute('role','status');host.append(status);}status.textContent=text;}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)invalidate();});
 await nextPaint();await ensureOutdoors();await prepare();sceneReady=true;invalidate();
 updateRoof();
 return {get viewMode(){return isFull?'full':isPlan?'plan':'3d';},get exteriorSide(){return exteriorSide;},async full(side='garden'){const request=++outdoorRequest;home();exteriorSide=side==='driveway'?'driveway':'garden';setExterior(true);fit();try{await ensureOutdoors();if(request===outdoorRequest&&isFull){setExterior(true);fit();}}catch{showRecovery('Udemiljøet kunne ikke indlæses. Vælg Ude igen for at prøve.');}},home(){outdoorRequest++;setExterior(false);home();fit();updateRoof();},plan(){setExterior(false);const value=togglePlan(true);updateRoof();return value;},togglePlan(){setExterior(false);const value=togglePlan();if(!value)fit();updateRoof();return value;},setAppearance,setView,focusCharger,toggleRoof(){roofEnabled=!roofEnabled;updateRoof();renderer.shadowMap.needsUpdate=true;invalidate();return roofEnabled;},setFurnishings(value){const changed=furnishing.setSnapshot(value);localLights.setFurnishings(value,furnishing.root,changed);renderer.shadowMap.needsUpdate=true;invalidate();host.dataset.furnitureCount=String(value.items.filter(i=>i.visible).length);host.dataset.furnitureVisible=String(value.visible);},setFurnitureEditing(value){if(value===furnitureEditing)return;if(value&&!furnitureEditing){setExterior(false);home();fit();}furnitureEditing=value;if(!value)furnishing.select(null);invalidate();},selectFurniture(id,focus=false){furnishing.select(id);invalidate();if(focus){const g=furnishing.get(id);if(g){const box=new THREE.Box3().setFromObject(g),target=box.getCenter(new THREE.Vector3());const bounds=box.getSize(new THREE.Vector3());const distance=Math.max(.65,Math.max(bounds.x,bounds.z)/2.6);const item=g.userData.furniture||(options.furnishings||initialFurnishing()).items.find(i=>i.id===id),front=new THREE.Vector3(0,0,['sofa','armchair','kitchenIsland'].includes(item?.type)?-1:1);if(item?.type==='wardrobe'&&item.depth>item.width)front.set(1,0,0);if(item?.type==='kitchenTowers')front.set(-1,0,0);front.applyAxisAngle(new THREE.Vector3(0,1,0),g.rotation.y);const side=new THREE.Vector3(front.z,0,-front.x),offset=front.multiplyScalar(3.6).addScaledVector(side,2.6).add(new THREE.Vector3(0,4.3,0));if(item?.type==='utility'){const cameraY=Math.max(3.35,bounds.x/(2*Math.tan(THREE.MathUtils.degToRad(perspective.fov/2))*perspective.aspect)+.7);moveCamera(new THREE.Vector3(g.position.x,cameraY,g.position.z-1.20),target);}else moveCamera(target.clone().addScaledVector(offset,distance),target);}}},setCharging(value){if(charging!==!!value)invalidate();charging=!!value;},setQuality(value){quality=value;renderer.setPixelRatio(value==='light'?1:value==='detailed'?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=value!=='light';sun.shadow.mapSize.set(value==='detailed'?2048:1024,value==='detailed'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;renderer.shadowMap.needsUpdate=true;resize();invalidate();},toggleWalls(){invalidate();cutaway=!cutaway;structure.setCutaway(isFull?false:cutaway);exterior.setView({full:isFull,cutaway:isFull?false:cutaway});localLights.syncClipping();renderer.shadowMap.needsUpdate=true;return cutaway;},zoom(factor){overview=false;interrupt();invalidate();if(isPlan){camera.zoom=THREE.MathUtils.clamp(camera.zoom/factor,.5,8);camera.updateProjectionMatrix();}else camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},update(state,selected){invalidate();latestState=state;landscape?.update(state);const active=localLights.update(state);host.dataset.activeLights=JSON.stringify(active);selectedRoom=selected;host.dataset.selectedRoom=selected||'';for(const r of rooms){const s=state[r.id],on=Object.values(s.lights).some(Boolean);floors[r.id].material.emissive.set('#000000');floors[r.id].material.emissiveIntensity=0;}}};
}
