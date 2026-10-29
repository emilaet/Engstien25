import {safeStorage} from './storage.js';
export const layoutKey='engstien-home-layout-v1';
export const widgetDefinitions=[
 {id:'house',name:'Husoversigt',selector:'#house-overview',width:8,height:5},
 {id:'lights',name:'Belysning',selector:'#lights-summary',width:3,height:2},
 {id:'climate',name:'Indeklima',selector:'#climate-summary',width:3,height:2},
 {id:'curtains',name:'Gardiner',selector:'#curtain-summary',width:3,height:2},
 {id:'car',name:'Billader',selector:'#car-summary',width:3,height:2},
 {id:'tasks',name:'Huskeliste',selector:'.tasks-card',width:4,height:7},
 {id:'shopping',name:'Handleliste',selector:'.shopping-card',width:4,height:7},
 {id:'waste',name:'Tømmekalender',selector:'.waste-card',width:4,height:7},
];
export const defaultLayout=()=>[['house',8,5],['waste',4,5],['tasks',4,5],['shopping',4,5],['car',4,5],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height}));
export function validLayout(value){return Array.isArray(value)&&value.length===widgetDefinitions.length&&new Set(value.map(w=>w?.id)).size===widgetDefinitions.length&&value.every(w=>w&&widgetDefinitions.some(d=>d.id===w.id)&&[3,4,6,8,12].includes(w.width)&&[2,3,4,5,7,9].includes(w.height));}
export function migrateLayout(value){if(validLayout(value))return value;if(Array.isArray(value)&&value.length===7&&!value.some(w=>w?.id==='house')){const next=[{id:'house',width:8,height:5},...value];if(validLayout(next))return next;}return defaultLayout();}
export function moveWidget(layout,id,target){const next=structuredClone(layout),from=next.findIndex(w=>w.id===id);if(from<0)return next;const [widget]=next.splice(from,1);next.splice(Math.max(0,Math.min(next.length,target)),0,widget);return next;}
export function setupDashboardLayout({notify=()=>{},storage}={}){
 const disk=safeStorage(storage);let saved=defaultLayout();try{saved=migrateLayout(JSON.parse(disk.getItem(layoutKey)));}catch{}
 let draft=structuredClone(saved),editing=false,home=false,gesture=null;
 const summary=document.querySelector('.summary'),stats=[...summary.children],house=document.querySelector('#house-overview'),parking=document.querySelector('#home-overview-parking');
 const area=document.createElement('div');area.className='home-layout-menu';area.hidden=true;area.innerHTML='<button id="home-options" aria-label="Tilpas Hjem" aria-expanded="false" aria-controls="home-options-menu">•••</button><div id="home-options-menu" hidden><button id="edit-home-layout">Rediger dashboard</button></div>';document.querySelector('.header-right').append(area);
 const toolbar=document.createElement('section');toolbar.className='layout-editor';toolbar.hidden=true;toolbar.setAttribute('aria-label','Rediger dashboard');toolbar.innerHTML='<div><b>Tilpas Hjem</b><p>Træk i håndtaget eller brug pilene. Vælg bredde og højde i det faste grid.</p></div><div class="layout-editor-actions"><button id="reset-home-layout">Gendan standard</button><button id="cancel-home-layout">Annuller</button><button id="save-home-layout" class="primary">Gem layout</button></div>';document.querySelector('#family-dashboard').before(toolbar);
 const status=document.createElement('p');status.className='layout-status';status.setAttribute('role','status');status.hidden=true;toolbar.after(status);
 function closeMenu(){area.querySelector('#home-options-menu').hidden=true;area.querySelector('#home-options').setAttribute('aria-expanded','false');}
 function controls(widget,index){const definition=widgetDefinitions.find(w=>w.id===widget.id);return `<div class="widget-editor" role="group" aria-label="Tilpas ${definition.name}"><button type="button" class="widget-drag" data-widget-drag="${widget.id}" aria-label="Træk ${definition.name} eller flyt med piletaster" title="Træk for at flytte">⠿</button><span class="widget-editor-name">${definition.name}</span><button type="button" data-widget-move="${widget.id}" data-direction="-1" aria-label="Flyt ${definition.name} tidligere" ${index===0?'disabled':''}>←</button><button type="button" data-widget-move="${widget.id}" data-direction="1" aria-label="Flyt ${definition.name} senere" ${index===draft.length-1?'disabled':''}>→</button><div class="widget-dimensions"><label>Bredde<select data-widget-width="${widget.id}" aria-label="Bredde for ${definition.name}">${[[3,'¼'],[4,'⅓'],[6,'½'],[8,'⅔'],[12,'Fuld']].map(([value,label])=>`<option value="${value}" ${widget.width===value?'selected':''}>${label}</option>`).join('')}</select></label><label>Højde<select data-widget-height="${widget.id}" aria-label="Højde for ${definition.name}">${[[2,'2 felter'],[3,'3 felter'],[4,'4 felter'],[5,'5 felter'],[7,'7 felter'],[9,'9 felter']].map(([value,label])=>`<option value="${value}" ${widget.height===value?'selected':''}>${label}</option>`).join('')}</select></label></div></div>`;}
 function refresh(){
  const grid=document.querySelector('.family-grid');summary.hidden=home&&!!grid;
  if(!home||!grid){for(const stat of stats)summary.append(stat);if(house)parking.append(house);if(grid){grid.classList.remove('dashboard-grid','is-editing');grid.querySelectorAll('.widget-editor,.summary-widget').forEach(el=>el.remove());grid.querySelectorAll('.dashboard-widget').forEach(el=>{el.classList.remove('dashboard-widget');el.style.removeProperty('order');});}return;}
  const active=document.activeElement,focus=active?.dataset,selection=focus&&Object.keys(focus).find(k=>k.startsWith('widget'));
  grid.classList.add('dashboard-grid');grid.classList.toggle('is-editing',editing);
  if(house)grid.append(house);
  for(const stat of stats){let wrapper=stat.closest('.summary-widget');if(!wrapper){wrapper=document.createElement('section');wrapper.className='summary-widget';wrapper.append(stat);}grid.append(wrapper);}
  const layout=editing?draft:saved;
  layout.forEach((widget,index)=>{
   const definition=widgetDefinitions.find(w=>w.id===widget.id),content=document.querySelector(definition.selector),card=content?.closest('.summary-widget')||content;if(!card)return;
   card.classList.add('dashboard-widget');card.dataset.widgetId=widget.id;card.style.setProperty('--widget-width',widget.width);card.style.setProperty('--widget-height',widget.height);card.style.order=index;
   card.querySelector('.widget-editor')?.remove();if(editing)card.insertAdjacentHTML('afterbegin',controls(widget,index));if(grid.children[index]!==card)grid.insertBefore(card,grid.children[index]||null);
   const body=card.matches('.summary-widget')?card.querySelector('.stat'):null;if(body)body.inert=editing;
   for(const child of card.children)if(!child.matches('.widget-editor'))child.inert=editing;
  });
  if(selection){const attr=selection.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),el=grid.querySelector(`[data-${attr}="${focus[selection]}"]${active?.dataset.direction?`[data-direction="${active.dataset.direction}"]`:''}`);el?.focus({preventScroll:true});}else if(active?.isConnected)active.focus?.({preventScroll:true});
 }
 function finish(save){if(save){saved=structuredClone(draft);disk.setItem(layoutKey,JSON.stringify(saved));status.hidden=false;status.textContent=disk.persistent?'Dit layout er gemt på denne enhed.':'Lagring er ikke tilgængelig. Layoutet bevares kun, mens siden er åben.';}editing=false;document.documentElement.classList.remove('home-layout-editing');toolbar.hidden=true;area.querySelector('#home-options').disabled=false;refresh();area.querySelector('#home-options').focus({preventScroll:true});}
 area.querySelector('#home-options').onclick=()=>{const menu=area.querySelector('#home-options-menu');menu.hidden=!menu.hidden;area.querySelector('#home-options').setAttribute('aria-expanded',String(!menu.hidden));};
 area.querySelector('#edit-home-layout').onclick=()=>{closeMenu();draft=structuredClone(saved);editing=true;area.querySelector('#home-options').disabled=true;status.hidden=true;toolbar.hidden=false;document.documentElement.classList.add('home-layout-editing');refresh();toolbar.querySelector('#save-home-layout').focus();};
 toolbar.querySelector('#save-home-layout').onclick=()=>finish(true);toolbar.querySelector('#cancel-home-layout').onclick=()=>finish(false);toolbar.querySelector('#reset-home-layout').onclick=()=>{draft=defaultLayout();refresh();};
 document.addEventListener('click',event=>{if(!area.contains(event.target))closeMenu();if(!editing)return;const button=event.target.closest('[data-widget-move]');if(button){const index=draft.findIndex(w=>w.id===button.dataset.widgetMove);draft=moveWidget(draft,button.dataset.widgetMove,index+Number(button.dataset.direction));refresh();}});
 document.addEventListener('change',event=>{if(!editing)return;const el=event.target,id=el.dataset.widgetWidth||el.dataset.widgetHeight;if(!id)return;draft.find(w=>w.id===id)[el.dataset.widgetWidth?'width':'height']=Number(el.value);refresh();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();return;}const handle=event.target.closest('[data-widget-drag]');if(editing&&handle&&['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.key)){event.preventDefault();const id=handle.dataset.widgetDrag,index=draft.findIndex(w=>w.id===id);draft=moveWidget(draft,id,index+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1));refresh();}});
 document.addEventListener('pointerdown',event=>{const handle=event.target.closest('[data-widget-drag]');if(!editing||!handle||event.button!==0)return;event.preventDefault();gesture={id:handle.dataset.widgetDrag,target:null,handle};handle.setPointerCapture(event.pointerId);handle.closest('.dashboard-widget').classList.add('is-dragging');});
 document.addEventListener('pointermove',event=>{if(!gesture)return;document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.dashboard-widget');gesture.target=target?.dataset.widgetId;if(target&&gesture.target!==gesture.id)target.classList.add('drop-target');if(event.clientY>innerHeight-40)window.scrollBy(0,15);else if(event.clientY<40)window.scrollBy(0,-15);});
 function drop(event,cancel=false){if(!gesture)return;const {id,target,handle}=gesture;gesture=null;if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);document.querySelectorAll('.is-dragging,.drop-target').forEach(el=>el.classList.remove('is-dragging','drop-target'));if(!cancel&&target&&target!==id){draft=moveWidget(draft,id,draft.findIndex(w=>w.id===target));refresh();notify('Komponenten er flyttet. Gem layout, når du er færdig.');}}
 document.addEventListener('pointerup',event=>drop(event));document.addEventListener('pointercancel',event=>drop(event,true));
 return {refresh,setHome(value){if(!value&&editing)finish(false);home=value;area.hidden=!home;status.hidden=!home||status.hidden;closeMenu();refresh();}};
}
