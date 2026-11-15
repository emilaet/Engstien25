import {apiPath} from './api-path.js';
import {appVersion,appBuild} from './app-version.js';

export function createVersionNotice({fetchImpl=fetch,isEditing=()=>false,reload=()=>location.reload()}={}){
 let started=false,pending=null,checking=false;
 const bar=document.createElement('aside');bar.className='app-version-notice';bar.hidden=true;bar.setAttribute('aria-label','Appopdatering');bar.innerHTML='<div><strong>Ny version klar</strong><span>Gem dine ændringer, og genindlæs appen.</span></div><button type="button">Genindlæs</button>';document.body.append(bar);
 function paint(){if(!pending)return;bar.hidden=false;const editing=isEditing()||!!document.querySelector('dialog[open],[aria-busy=true]');bar.querySelector('button').disabled=editing;bar.querySelector('span').textContent=editing?'Afslut det, du er i gang med, før du genindlæser.':'Dine gemte indstillinger bliver bevaret.';}
 async function check(){if(checking||document.hidden)return;checking=true;try{const r=await fetchImpl(apiPath('/api/info'),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)return;const info=await r.json();if(info.service==='engstien-dashboard'&&info.version&&(info.version!==appVersion||info.build&&info.build!==appBuild)){pending=info;paint();}}catch{/* A restarting Green keeps the open dashboard intact. */}finally{checking=false;}}
 bar.querySelector('button').onclick=()=>{paint();if(!bar.querySelector('button').disabled)reload();};
 document.addEventListener('visibilitychange',()=>{if(started&&!document.hidden)void check();});
 document.addEventListener('focusout',()=>{if(pending)setTimeout(paint,0);});
 return {start(){if(started)return;started=true;void check();setInterval(()=>{paint();void check();},60000);},check};
}
