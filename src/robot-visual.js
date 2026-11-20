import vacuumImage from './assets/robot-vacuum-closeup.webp?url&inline';
import mowerImage from './assets/robot-mower-closeup.webp?url&inline';

const portraits={
 vacuum:{src:vacuumImage,alt:'Visualisering af den sorte Roborock Qrevo 5AE med vaske- og tømningsstation ved stuevæggen'},
 mower:{src:mowerImage,alt:'Visualisering af den grå Mammotion Yuka Mini 2 i ladestationen på græsset ved det sorte skur'},
};

// The close-up is an illustration. The existing house canvas still makes the
// journey to the real docking location, and remains available in the 3D tab.
export function createRobotVisual(card,scene){
 const portrait=document.createElement('figure');portrait.className='robot-portrait';portrait.hidden=true;
 const img=document.createElement('img');img.width=1448;img.height=1086;img.decoding='async';portrait.append(img);card.append(portrait);
 const error=document.createElement('p');error.className='robot-visual-error';error.hidden=true;error.setAttribute('role','status');error.textContent='Nærbilledet kunne ikke indlæses. Stationen vises i 3D i stedet.';card.append(error);
 let active=null,mode='detail',animate=false,failed=false;
 const paint=()=>{
  const flying=animate&&scene.dataset.view===active&&scene.dataset.cameraMoving==='true';
  if(animate&&!flying)animate=false;
  const show=!!active&&mode==='detail'&&!failed;
  portrait.hidden=!show;portrait.classList.toggle('is-ready',show&&!flying);
  scene.style.visibility=active&&(mode==='map'||show&&!flying)?'hidden':'';
  card.dataset.robotPresentation=active?mode:'';
  card.dataset.robotImageError=String(failed);
  error.hidden=!active||mode!=='detail'||!failed;
 };
 const observer=new MutationObserver(paint);observer.observe(scene,{attributes:true,attributeFilter:['data-camera-moving','data-view','data-render-finish']});
 img.onload=()=>{failed=false;paint();};img.onerror=()=>{failed=true;paint();};
 return {
  show(kind,value='detail'){
   if(kind!==active){active=kind;failed=false;animate=!!kind&&scene.dataset.renderFinish==='native'&&scene.dataset.cameraMoving==='true';if(kind){img.alt=portraits[kind].alt;img.src=portraits[kind].src;}else img.removeAttribute('src');}
   mode=value;paint();
  },
 };
}
