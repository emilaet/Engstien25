import {weatherIcon} from './home-widgets.js';
export function createHeaderWeather({services,onOpen}={}){
 const button=document.createElement('button');button.type='button';button.className='header-weather';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','hw-weather-dialog');
 document.querySelector('.header-right .date').before(button);let previous='';
 function render(){const w=services.weather.snapshot(),valid=Number.isFinite(w.current),state=w.status==='cached'?' · sidst hentede vejr':w.status==='demo'?' · eksempel':'';
  const label=valid?`Vejret i Hørning: ${w.current} grader, ${w.condition}${state}. Åbn vejrudsigt.`:'Vejret i Hørning kunne ikke hentes. Åbn vejrudsigt.';
  const signature=JSON.stringify([w.kind,w.current,label]);if(signature===previous)return;previous=signature;button.innerHTML=weatherIcon(valid?w.kind:'cloud')+'<strong>'+(valid?w.current+'°':'—')+'</strong>';button.setAttribute('aria-label',label);button.title=label;button.dataset.status=w.status;
 }
 button.onclick=()=>onOpen(button);services.subscribe(render);render();
 return {refresh(){render();void services.weather.load().catch(()=>{});},button};
}
