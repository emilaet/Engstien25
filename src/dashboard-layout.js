import {arrangeGrid,relocateGrid,reorderStack,snapGridRow,shiftStack} from './dashboard-grid.js';
import {safeStorage} from './storage.js';
export const layoutKey='engstien-home-layout-v3';
export const legacyLayoutKey='engstien-home-layout-v2';
export const previousLayoutKey='engstien-home-layout-v1';
export const widgetDefinitions=[
 {id:'weather',name:'Vejrudsigt',selector:'.weather-card',width:4,height:5},
 {id:'camera',name:'Hoveddørskamera',selector:'.camera-card',width:4,height:5},
 {id:'calendar',name:'Familiens kalender',selector:'.calendar-card',width:6,height:4},
 {id:'house',name:'Husoversigt',selector:'#house-overview',width:8,height:5},
 {id:'lights',name:'Belysning',selector:'#lights-summary',width:3,height:2},
 {id:'climate',name:'Indeklima',selector:'#climate-summary',width:3,height:2},
 {id:'curtains',name:'Gardiner',selector:'#curtain-summary',width:3,height:2},
 {id:'car',name:'Billader',selector:'#car-summary',width:3,height:2},
 {id:'tasks',name:'Huskeliste',selector:'.tasks-card',width:4,height:7},
 {id:'shopping',name:'Handleliste',selector:'.shopping-card',width:4,height:7},
 {id:'waste',name:'Tømmekalender',selector:'.waste-card',width:4,height:7},
];
const oldIds=['house','waste','tasks','shopping','car','lights','climate','curtains'];
const positioned=w=>(w.column===undefined&&w.row===undefined||Number.isInteger(w.column)&&w.column>=0&&w.column<=11&&Number.isInteger(w.row)&&w.row>=0&&w.row<=10000)&&(w.mobileOrder===undefined||Number.isInteger(w.mobileOrder)&&w.mobileOrder>=0&&w.mobileOrder<11);
const sizes=w=>w&&typeof w.id==='string'&&(w.visible===undefined||typeof w.visible==='boolean')&&Number.isInteger(w.width)&&w.width>=2&&w.width<=12&&[2,3,4,5,7,9].includes(w.height)&&(w.heightPx===undefined||Number.isInteger(w.heightPx)&&w.heightPx>=132&&w.heightPx<=1092)&&positioned(w);
const legacyDefault=()=>[['house',8,5],['waste',4,5],['tasks',4,5],['shopping',4,5],['car',4,5],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
export const defaultLayout=()=>[['house',4,5],['camera',4,5],['weather',4,5],['calendar',6,4],['waste',3,4],['car',3,4],['tasks',6,4],['shopping',6,4],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
export function validLayout(value){return Array.isArray(value)&&value.length===widgetDefinitions.length&&new Set(value.map(w=>w?.id)).size===widgetDefinitions.length&&value.every(w=>sizes(w)&&widgetDefinitions.some(d=>d.id===w.id));}
export function migrateLayout(value){
 if(validLayout(value))return value;
 if(!Array.isArray(value)||![7,8].includes(value.length)||!value.every(w=>sizes(w)&&oldIds.includes(w.id))||new Set(value.map(w=>w.id)).size!==value.length)return defaultLayout();
 const legacy=value.length===7&&!value.some(w=>w.id==='house')?[{id:'house',width:8,height:5},...value]:value;
 if(legacy.length!==8||!oldIds.every(id=>legacy.some(w=>w.id===id)))return defaultLayout();
 const original=legacyDefault(),untouched=legacy.every((w,i)=>w.id===original[i].id&&w.width===original[i].width&&w.height===original[i].height&&(w.visible===undefined||w.visible===original[i].visible));
 if(untouched)return defaultLayout();
 return [...structuredClone(legacy),...defaultLayout().filter(w=>['camera','weather','calendar'].includes(w.id))];
}
export function moveWidget(layout,id,target){const next=structuredClone(layout),from=next.findIndex(w=>w.id===id);if(from<0)return next;const [widget]=next.splice(from,1);next.splice(Math.max(0,Math.min(next.length,target)),0,widget);return next;}
const presetSize=(id,size)=>size==='compact'?(['weather','calendar'].includes(id)?{width:2,height:5}:id==='car'?{width:2,height:3}:['lights','climate','curtains'].includes(id)?{width:2,height:2}:{width:3,height:4}):size==='wide'?{width:6,height:3}:{width:4,height:4};
const defaultHeights={house:260,camera:260,weather:260,calendar:228,waste:228,car:228,tasks:196,shopping:196,lights:134,climate:134,curtains:134};
const heightSteps=[2,3,4,5,7,9];
const snapHeight=value=>Math.max(132,Math.min(1092,Math.round((value+12)/16)*16-12));
const sameDefault=layout=>layout.every((w,i)=>{const d=defaultLayout()[i];return w.id===d.id&&w.width===d.width&&w.height===d.height&&(w.visible!==false)===(d.visible!==false);});
const cardHeight=(widget,standard)=>widget.heightPx??(standard?defaultHeights[widget.id]:widget.height*74-14);

export function setupDashboardLayout({notify=()=>{},storage}={}){
 const disk=safeStorage(storage);
 let saved=defaultLayout();
 try{saved=migrateLayout(JSON.parse(disk.getItem(layoutKey)??disk.getItem(legacyLayoutKey)));}catch{}
 let previous=null;
 try{const value=JSON.parse(disk.getItem(previousLayoutKey));if(Array.isArray(value)&&[7,8,11].includes(value.length))previous=migrateLayout(value);}catch{}
 let draft=structuredClone(saved),editing=false,home=false,gesture=null,selectedWidget='weather',undoStack=[],redoStack=[],autoScroll=0,resizeFrame=0;
 const summary=document.querySelector('.summary'),stats=[...summary.children],house=document.querySelector('#house-overview'),parking=document.querySelector('#home-overview-parking');
 const area=document.createElement('div');area.className='home-layout-menu';
 area.innerHTML='<button id="quick-edit-home" aria-label="Rediger dashboard direkte" title="Rediger dashboard"><span aria-hidden="true">✎</span><span class="quick-edit-label">Rediger</span></button><button id="home-options" aria-label="Tilpas Hjem" aria-expanded="false" aria-controls="home-options-menu">•••</button><div id="home-options-menu" hidden><button id="edit-home-layout">Rediger dashboard</button></div>';
 document.querySelector('.header-right').append(area);
 const toolbar=document.createElement('section');toolbar.className='layout-editor';toolbar.hidden=true;toolbar.setAttribute('aria-label','Rediger dashboard');
 toolbar.innerHTML=`<div class="layout-bar"><div class="layout-bar-copy"><h2 tabindex="-1">Rediger dashboard</h2><p>Træk i ⠿ for at flytte. Kanter ændrer størrelsen.</p></div><button id="toggle-layout-details" aria-label="Widgets og størrelser" aria-expanded="false" aria-controls="layout-details"><span aria-hidden="true">⊞</span><span class="layout-widgets-text">Widgets</span></button><button id="undo-home-layout" aria-label="Fortryd layoutændring" title="Fortryd">↶</button><button id="redo-home-layout" aria-label="Gentag layoutændring" title="Gentag">↷</button><button id="cancel-home-layout">Annuller</button><button id="save-home-layout" class="primary">Gem dashboard</button></div><div class="layout-details" id="layout-details" hidden><div class="layout-details-head"><h3>Widgets og størrelser</h3><button id="close-layout-details" aria-label="Luk widgetindstillinger">×</button></div><div class="layout-selected"></div><div class="layout-list-heading"><b>Vis på dashboardet</b><span class="layout-visible-count"></span></div><div class="layout-widget-list"></div><div class="layout-reset-actions"><button id="restore-previous-home-layout" ${previous?'':'hidden'}>Tidligere layout</button><button id="reset-home-layout">Gendan standard</button></div></div>`;
 document.querySelector('#family-dashboard').before(toolbar);
 const status=document.createElement('p');status.className='layout-status';status.setAttribute('role','status');status.hidden=true;toolbar.after(status);
 const cardFor=id=>document.querySelector(`.family-grid [data-widget-id="${id}"]`);
 function announce(message){status.hidden=false;status.textContent=message;}
 function remember(before=draft){undoStack.push(structuredClone(before));if(undoStack.length>50)undoStack.shift();redoStack=[];}
 function history(redo=false){const from=redo?redoStack:undoStack,to=redo?undoStack:redoStack;if(!from.length)return;to.push(structuredClone(draft));draft=from.pop();refresh();}
 function details(open){toolbar.querySelector('.layout-details').hidden=!open;toolbar.querySelector('#toggle-layout-details').setAttribute('aria-expanded',String(open));}
 function closeMenu(){area.querySelector('#home-options-menu').hidden=true;area.querySelector('#home-options').setAttribute('aria-expanded','false');}
 function controls(widget){
  const name=widgetDefinitions.find(w=>w.id===widget.id).name;
  return `<div class="widget-editor"><button type="button" class="widget-drag" data-widget-drag="${widget.id}" aria-label="Træk ${name} eller flyt med piletaster" title="Flyt kort">⠿</button></div><button class="widget-resize widget-resize-width" data-widget-resize="${widget.id}" data-axis="width" role="slider" aria-label="Tilpas bredden på ${name}" aria-orientation="horizontal" aria-valuemin="2" aria-valuemax="12" aria-valuenow="${widget.width}"></button><button class="widget-resize widget-resize-height" data-widget-resize="${widget.id}" data-axis="height" role="slider" aria-label="Tilpas højden på ${name}" aria-orientation="vertical" aria-valuemin="132" aria-valuemax="1092" aria-valuenow="${Math.round(cardHeight(widget,sameDefault(draft)))}"></button><button class="widget-resize widget-resize-both" data-widget-resize="${widget.id}" data-axis="both" aria-label="Tilpas størrelse på ${name}" title="Træk for at ændre bredde og højde">⌟</button><span class="widget-size-label" aria-hidden="true"></span>`;
 }
 function renderEditor(){
  if(!editing)return;
  const widget=draft.find(w=>w.id===selectedWidget)||draft[0],definition=widgetDefinitions.find(w=>w.id===widget.id);selectedWidget=widget.id;
  toolbar.querySelector('.layout-selected').innerHTML=`<b>${definition.name}</b><p>Du kan også trække direkte i kortets kanter.</p><div class="layout-presets" role="group" aria-label="Størrelsesforslag">${[['compact','Kompakt'],['standard','Standard'],['wide','Bred']].map(([size,name])=>`<button data-widget-preset="${widget.id}" data-size="${size}">${name}</button>`).join('')}</div><div class="widget-dimensions"><label>Bredde<select data-widget-width="${widget.id}" aria-label="Bredde for ${definition.name}">${Array.from({length:11},(_,i)=>i+2).map(v=>`<option value="${v}" ${widget.width===v?'selected':''}>${({2:'⅙',3:'¼',4:'⅓',6:'½',8:'⅔',12:'Fuld bredde'})[v]||v+'/12'}${v===12?'':' af rækken'}</option>`).join('')}</select></label><label>Højde<select data-widget-height="${widget.id}" aria-label="Højde for ${definition.name}">${[[2,'Lav'],[3,'Kompakt'],[4,'Mellem'],[5,'Høj'],[7,'Ekstra høj'],[9,'Størst']].map(([v,l])=>`<option value="${v}" ${widget.height===v?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="layout-position" role="group" aria-label="Flyt i dashboardet"><button data-widget-nudge="${widget.id}" data-x="-1" data-y="0" aria-label="Flyt ${definition.name} til venstre">←</button><button data-widget-nudge="${widget.id}" data-x="0" data-y="-1" aria-label="Flyt ${definition.name} op">↑</button><button data-widget-nudge="${widget.id}" data-x="0" data-y="1" aria-label="Flyt ${definition.name} ned">↓</button><button data-widget-nudge="${widget.id}" data-x="1" data-y="0" aria-label="Flyt ${definition.name} til højre">→</button></div><div class="layout-move"><button data-widget-move="${widget.id}" data-direction="-1" aria-label="Flyt ${definition.name} tidligere" ${draft[0]===widget?'disabled':''}>← Tidligere</button><button data-widget-move="${widget.id}" data-direction="1" aria-label="Flyt ${definition.name} senere" ${draft.at(-1)===widget?'disabled':''}>Senere →</button></div>`;
  const list=toolbar.querySelector('.layout-widget-list'),top=list.scrollTop;
  list.innerHTML=draft.map(w=>{const def=widgetDefinitions.find(d=>d.id===w.id);return `<div class="layout-widget-option ${w.id===selectedWidget?'selected':''}"><button data-widget-select="${w.id}" aria-label="Tilpas ${def.name}" aria-pressed="${w.id===selectedWidget}">${def.name}</button><label class="widget-visibility"><input type="checkbox" data-widget-visible="${w.id}" aria-label="Vis ${def.name} på Hjem" ${w.visible!==false?'checked':''}><span aria-hidden="true"></span></label></div>`;}).join('');list.scrollTop=top;
  toolbar.querySelector('#undo-home-layout').disabled=!undoStack.length;toolbar.querySelector('#redo-home-layout').disabled=!redoStack.length;
  toolbar.querySelector('.layout-visible-count').textContent=`${draft.filter(w=>w.visible!==false).length} af ${draft.length}`;
 }
 function rectangles(layout,{minimum=innerWidth<=1000?3:2,stack=innerWidth<=760}={}){const standard=sameDefault(layout);return arrangeGrid(layout.map(w=>({...w,rows:Math.round((cardHeight(w,standard)+12)/16)})),{minimum,stack});}
 function writePositions(layout,rects,{mobileOrder=false}={}){
  const byId=new Map(rects.map(r=>[r.id,r])),reading=[...rects].sort((a,b)=>a.row-b.row||a.column-b.column);
  if(innerWidth<=760){if(mobileOrder||gesture?.kind==='move')for(const [index,r] of reading.entries())layout.find(w=>w.id===r.id).mobileOrder=index;}
  else {for(const w of layout){const r=byId.get(w.id);if(r){w.column=r.column;w.row=r.row;}}layout.sort((a,b)=>{const x=byId.get(a.id),y=byId.get(b.id);return x&&y?x.row-y.row||x.column-y.column:x?-1:y?1:0;});}
 }
 function applySizes(layout,rects=rectangles(layout)){
  const byId=new Map(rects.map(r=>[r.id,r])),profiles={desktop:rectangles(layout,{minimum:2,stack:false}),tablet:rectangles(layout,{minimum:3,stack:false}),mobile:rectangles(layout,{stack:true})};
  for(const widget of layout){
   const card=cardFor(widget.id),rect=byId.get(widget.id);if(!card||!rect)continue;
   card.style.setProperty('--widget-width',widget.width);card.style.setProperty('--widget-span',rect.width);card.style.setProperty('--widget-height',widget.height);card.style.setProperty('--widget-rows',rect.rows);card.style.setProperty('--widget-column',rect.column+1);card.style.setProperty('--widget-row',rect.row+1);
   for(const [name,rectangles] of Object.entries(profiles)){const projected=rectangles.find(r=>r.id===widget.id);card.style.setProperty(`--widget-${name}-column`,projected.column+1);card.style.setProperty(`--widget-${name}-row`,projected.row+1);card.style.setProperty(`--widget-${name}-span`,projected.width);}
   card.classList.toggle('widget-selected',editing&&widget.id===selectedWidget);
   const label=card.querySelector('.widget-size-label');if(label)label.textContent=gesture?.kind==='move'&&gesture.started?'Slip på den markerede plads':`${widget.width}/12 · ${rect.rows*16-12} px`;
   card.querySelector('[data-axis=width]')?.setAttribute('aria-valuenow',widget.width);
   card.querySelector('[data-axis=height]')?.setAttribute('aria-valuenow',rect.rows*16-12);
  }
  if(gesture?.placeholder){const r=byId.get(gesture.id);gesture.placeholder.style.gridColumn=`${r.column+1} / span ${r.width}`;gesture.placeholder.style.gridRow=`${r.row+1} / span ${r.rows}`;}
 }
 function nudge(id,x,y){
  const rects=rectangles(draft),r=rects.find(r=>r.id===id);if(!r)return;
  const next=innerWidth<=760?shiftStack(rects,id,y||x):relocateGrid(rects,id,{column:r.column+x,row:r.row+y});
  if(!next.some(v=>{const before=rects.find(b=>b.id===v.id);return v.column!==before.column||v.row!==before.row;}))return;
  remember();selectedWidget=id;writePositions(draft,next,{mobileOrder:true});refresh();announce('Kortet er flyttet. Ændringen er ikke gemt endnu.');
 }
 function refresh(){
  const grid=document.querySelector('.family-grid');summary.hidden=home&&!!grid;
  if(!home||!grid){for(const stat of stats)summary.append(stat);if(house)parking.append(house);if(grid){grid.classList.remove('dashboard-grid','is-editing','reference-layout');grid.querySelectorAll('.widget-editor,.widget-resize,.widget-size-label,.summary-widget').forEach(el=>el.remove());grid.querySelectorAll('.dashboard-widget').forEach(el=>{el.classList.remove('dashboard-widget');el.hidden=false;el.style.removeProperty('order');});}return;}
  const active=document.activeElement,inPanel=toolbar.contains(active),focus=active?.dataset,selection=focus&&Object.keys(focus).find(k=>k.startsWith('widget'));
  renderEditor();grid.classList.add('dashboard-grid');grid.classList.toggle('is-editing',editing);grid.classList.remove('reference-layout');
  if(house)grid.append(house);
  for(const stat of stats){let wrapper=stat.closest('.summary-widget');if(!wrapper){wrapper=document.createElement('section');wrapper.className='summary-widget';wrapper.append(stat);}grid.append(wrapper);}
  const layout=editing?draft:saved;
  const reading=rectangles(layout).sort((a,b)=>a.row-b.row||a.column-b.column).map(r=>r.id),ordered=[...layout].sort((a,b)=>(reading.includes(a.id)?reading.indexOf(a.id):99)-(reading.includes(b.id)?reading.indexOf(b.id):99));
  ordered.forEach((widget,index)=>{
   const content=document.querySelector(widgetDefinitions.find(w=>w.id===widget.id).selector),card=content?.closest('.summary-widget')||content;if(!card)return;
   card.classList.add('dashboard-widget');card.classList.remove('widget-is-hidden');card.hidden=widget.visible===false;card.dataset.widgetId=widget.id;card.style.order=index;
   card.querySelectorAll('.widget-editor,.widget-resize,.widget-size-label').forEach(el=>el.remove());if(editing&&widget.visible!==false)card.insertAdjacentHTML('afterbegin',controls(widget));
   if(grid.children[index]!==card)grid.insertBefore(card,grid.children[index]||null);
   for(const child of card.children)child.inert=editing&&!child.matches('.widget-editor,.widget-resize,.widget-size-label');
  });
  applySizes(layout);
  if(selection){const attr=selection.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),extra=active.dataset.direction?`[data-direction="${active.dataset.direction}"]`:active.dataset.size?`[data-size="${active.dataset.size}"]`:active.dataset.axis?`[data-axis="${active.dataset.axis}"]`:active.dataset.x!==undefined?`[data-x="${active.dataset.x}"][data-y="${active.dataset.y}"]`:'';(inPanel?toolbar:grid).querySelector(`[data-${attr}="${focus[selection]}"]${extra}`)?.focus({preventScroll:true});}
  else if(active?.isConnected)active.focus?.({preventScroll:true});
 }
 function endGesture(cancel=false){
  if(!gesture)return;
  const current=gesture;gesture=null;cancelAnimationFrame(autoScroll);autoScroll=0;
  if(current.handle.hasPointerCapture(current.pointerId))current.handle.releasePointerCapture(current.pointerId);
  current.placeholder?.remove();
  for(const [name,value,priority] of current.floatStyles||[])if(value)current.card.style.setProperty(name,value,priority);else current.card.style.removeProperty(name);
  document.documentElement.classList.remove('dashboard-moving');document.querySelectorAll('.is-dragging,.is-resizing').forEach(el=>el.classList.remove('is-dragging','is-resizing'));
  if(cancel||!current.changed||current.kind==='move'&&!current.inBounds){draft=current.before;refresh();return;}
  remember(current.before);refresh();
  announce(current.kind==='move'?'Kortet er flyttet til den markerede plads. Ændringen er ikke gemt endnu.':'Størrelsen er ændret. Ændringen er ikke gemt endnu.');
 }
 function finish(save){
  endGesture(true);
  if(save){saved=structuredClone(draft);disk.setItem(layoutKey,JSON.stringify(saved));announce(disk.persistent?'Dit layout er gemt på denne enhed.':'Lagring er ikke tilgængelig. Layoutet bevares kun, mens siden er åben.');}
  editing=false;area.querySelector('#quick-edit-home').hidden=!home;document.documentElement.classList.remove('home-layout-editing');details(false);toolbar.hidden=true;area.querySelector('#home-options').disabled=false;refresh();area.querySelector('#home-options').focus({preventScroll:true});
 }
 area.querySelector('#home-options').onclick=()=>{const menu=area.querySelector('#home-options-menu');menu.hidden=!menu.hidden;area.querySelector('#home-options').setAttribute('aria-expanded',String(!menu.hidden));};
 const startEditing=()=>{
  closeMenu();draft=structuredClone(saved);
  const standard=sameDefault(saved);
  for(const widget of draft){const card=cardFor(widget.id);widget.heightPx=snapHeight(card&&!card.hidden?card.getBoundingClientRect().height:cardHeight(widget,standard));}
  if(innerWidth>760)writePositions(draft,rectangles(draft));
  undoStack=[];redoStack=[];editing=true;area.querySelector('#quick-edit-home').hidden=true;details(false);area.querySelector('#home-options').disabled=true;status.hidden=true;toolbar.hidden=false;document.documentElement.classList.add('home-layout-editing');refresh();toolbar.querySelector('h2').focus({preventScroll:true});
 };
 area.querySelector('#edit-home-layout').onclick=startEditing;area.querySelector('#quick-edit-home').onclick=startEditing;
 toolbar.querySelector('#toggle-layout-details').onclick=()=>details(toolbar.querySelector('.layout-details').hidden);
 toolbar.querySelector('#close-layout-details').onclick=()=>{details(false);toolbar.querySelector('#toggle-layout-details').focus();};
 toolbar.querySelector('#restore-previous-home-layout').onclick=()=>{if(previous){remember();draft=structuredClone(previous);refresh();notify('Dit tidligere layout er indlæst som udkast. Gem, hvis du vil bruge det.');}};
 toolbar.querySelector('#undo-home-layout').onclick=()=>history();toolbar.querySelector('#redo-home-layout').onclick=()=>history(true);
 toolbar.querySelector('#save-home-layout').onclick=()=>finish(true);toolbar.querySelector('#cancel-home-layout').onclick=()=>finish(false);toolbar.querySelector('#reset-home-layout').onclick=()=>{remember();draft=defaultLayout();refresh();};
 document.addEventListener('click',event=>{
  if(!area.contains(event.target))closeMenu();if(!editing||gesture)return;
  const selected=event.target.closest('[data-widget-select]'),card=event.target.closest('.dashboard-widget');
  if(selected||card&&!event.target.closest('button')){selectedWidget=selected?.dataset.widgetSelect||card.dataset.widgetId;refresh();return;}
  const nudged=event.target.closest('[data-widget-nudge]');if(nudged){nudge(nudged.dataset.widgetNudge,Number(nudged.dataset.x),Number(nudged.dataset.y));return;}
  const preset=event.target.closest('[data-widget-preset]');
  if(preset){const before=rectangles(draft);remember();const widget=draft.find(w=>w.id===preset.dataset.widgetPreset);Object.assign(widget,presetSize(widget.id,preset.dataset.size));widget.heightPx=widget.height*74-14;if(innerWidth>760)writePositions(draft,relocateGrid(before,widget.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((widget.heightPx+12)/16)}));refresh();return;}
  const button=event.target.closest('[data-widget-move]');if(button){remember();draft=moveWidget(draft,button.dataset.widgetMove,draft.findIndex(w=>w.id===button.dataset.widgetMove)+Number(button.dataset.direction));for(const w of draft){delete w.column;delete w.row;delete w.mobileOrder;}refresh();}
 });
 document.addEventListener('change',event=>{
  if(!editing)return;const el=event.target,id=el.dataset.widgetWidth||el.dataset.widgetHeight||el.dataset.widgetVisible;if(!id)return;const before=rectangles(draft);remember();const widget=draft.find(w=>w.id===id);
  if(el.dataset.widgetVisible)widget.visible=el.checked;
  else if(el.dataset.widgetWidth)widget.width=Number(el.value);
  else {widget.height=Number(el.value);widget.heightPx=widget.height*74-14;}
  if(!el.dataset.widgetVisible&&innerWidth>760)writePositions(draft,relocateGrid(before,id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((cardHeight(widget,sameDefault(draft))+12)/16)}));
  refresh();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if(gesture){event.preventDefault();endGesture(true);}else if(editing&&!toolbar.querySelector('.layout-details').hidden){event.preventDefault();details(false);toolbar.querySelector('#toggle-layout-details').focus();}else if(editing){event.preventDefault();finish(false);}else closeMenu();return;}
  if(!editing||gesture)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.target.matches('input,textarea,select')){event.preventDefault();history(event.shiftKey);return;}
  const resize=event.target.closest('[data-widget-resize]');
  if(resize&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
   const axis=resize.dataset.axis,widget=draft.find(w=>w.id===resize.dataset.widgetResize),horizontal=['ArrowLeft','ArrowRight'].includes(event.key);
   if(axis==='width'&&!horizontal&&!['Home','End'].includes(event.key)||axis==='height'&&horizontal)return;
   event.preventDefault();const before=rectangles(draft);remember();selectedWidget=widget.id;
   if(axis==='width'||axis==='both'&&horizontal)widget.width=event.key==='Home'?2:event.key==='End'?12:Math.max(2,Math.min(12,widget.width+(event.key==='ArrowLeft'?-1:1)));
   else {widget.heightPx=snapHeight(event.key==='Home'?132:event.key==='End'?1092:cardHeight(widget,sameDefault(draft))+(event.key==='ArrowUp'?-16:16));widget.height=heightSteps.reduce((a,b)=>Math.abs(b*74-14-widget.heightPx)<Math.abs(a*74-14-widget.heightPx)?b:a);}
   if(innerWidth>760)writePositions(draft,relocateGrid(before,widget.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((cardHeight(widget,sameDefault(draft))+12)/16)}));refresh();return;
  }
  const handle=event.target.closest('[data-widget-drag]');
  if(handle&&['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.key)){event.preventDefault();const step=event.shiftKey?3:1;nudge(handle.dataset.widgetDrag,event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);}
 });
 function updateGesture(x,y){
  if(!gesture)return;const g=gesture;g.x=x;g.y=y;
  if(!g.started&&Math.hypot(x+scrollX-g.startX,y+scrollY-g.startY)<6)return;
  if(!g.started){
   g.started=true;g.card.classList.add(g.kind==='move'?'is-dragging':'is-resizing');
   if(g.kind==='move'){
    g.floatStyles=['left','top','width','height'].map(name=>[name,g.card.style.getPropertyValue(name),g.card.style.getPropertyPriority(name)]);
    g.card.style.setProperty('width',g.box.width+'px','important');g.card.style.setProperty('height',g.box.height+'px','important');
    g.placeholder=document.createElement('div');g.placeholder.className='widget-drop-preview';g.placeholder.setAttribute('aria-hidden','true');g.placeholder.textContent='';document.querySelector('.family-grid').append(g.placeholder);document.documentElement.classList.add('dashboard-moving');
   }
  }
  const widget=draft.find(w=>w.id===g.id),grid=document.querySelector('.family-grid').getBoundingClientRect();let next;
  if(g.kind==='resize'){
   const dx=x+scrollX-g.startX,dy=y+scrollY-g.startY;
   if(g.axis!=='height'&&innerWidth>760)widget.width=Math.max(innerWidth<=1000?3:2,Math.min(12,Math.round(g.width+dx/g.column)));
   if(g.axis!=='width'){widget.heightPx=snapHeight(g.height+dy);widget.height=heightSteps.reduce((a,b)=>Math.abs(b*74-14-widget.heightPx)<Math.abs(a*74-14-widget.heightPx)?b:a);}
   next=innerWidth<=760?rectangles(draft):relocateGrid(g.rects,g.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((cardHeight(widget,sameDefault(draft))+12)/16)});
  }else{
   const left=x-g.offsetX,top=y-g.offsetY;g.card.style.setProperty('left',left+'px');g.card.style.setProperty('top',top+'px');g.inBounds=x>=grid.left-24&&x<=grid.right+24&&y>=grid.top-64;
   const column=Math.round((left-grid.left)/g.column),row=snapGridRow((top-grid.top)/16,g.rects);next=innerWidth<=760?reorderStack(g.rects,g.id,(y-grid.top)/16):relocateGrid(g.rects,g.id,{column,row});g.placeholder.classList.toggle('drop-invalid',!g.inBounds);
  }
  g.changed=next.some(r=>{const old=g.rects.find(v=>v.id===r.id);return r.column!==old.column||r.row!==old.row||r.width!==old.width||r.rows!==old.rows;});writePositions(draft,next);applySizes(draft,next);
 }
 function scrollGesture(){
  if(!gesture)return;const top=24,bottom=Math.min(innerHeight-24,toolbar.querySelector('.layout-bar').getBoundingClientRect().top-12),speed=!gesture.started?0:gesture.y>bottom?12:gesture.y<top?-12:0;
  if(speed){const before=scrollY;window.scrollBy(0,speed);if(scrollY!==before)updateGesture(gesture.x,gesture.y);}
  autoScroll=requestAnimationFrame(scrollGesture);
 }
 document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-widget-resize],[data-widget-drag]');if(!editing||!handle||event.button!==0||gesture)return;
  event.preventDefault();details(false);const id=handle.dataset.widgetResize||handle.dataset.widgetDrag,widget=draft.find(w=>w.id===id),grid=document.querySelector('.family-grid'),card=cardFor(id),box=card.getBoundingClientRect();selectedWidget=id;
  gesture={id,handle,card,box,pointerId:event.pointerId,kind:handle.dataset.widgetResize?'resize':'move',axis:handle.dataset.axis,before:structuredClone(draft),rects:rectangles(draft),startX:event.clientX+scrollX,startY:event.clientY+scrollY,offsetX:event.clientX-box.left,offsetY:event.clientY-box.top,x:event.clientX,y:event.clientY,width:widget.width,height:box.height,column:(grid.getBoundingClientRect().width+12)/12,started:false,changed:false,inBounds:true};
  handle.setPointerCapture(event.pointerId);handle.focus({preventScroll:true});applySizes(draft);autoScroll=requestAnimationFrame(scrollGesture);
 });
 window.addEventListener('resize',()=>{if(gesture)endGesture(true);cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(home)refresh();});});
 document.addEventListener('pointermove',event=>{if(gesture&&gesture.pointerId===event.pointerId)updateGesture(event.clientX,event.clientY);});
 document.addEventListener('pointerup',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture();});
 document.addEventListener('pointercancel',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture(true);});
 document.addEventListener('lostpointercapture',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture(true);});
 return {refresh,setHome(value){if(!value&&editing)finish(false);home=value;area.hidden=false;area.querySelector('#quick-edit-home').hidden=!home||editing;area.querySelector('#home-options').setAttribute('aria-label',home?'Tilpas Hjem':'Flere muligheder');area.querySelector('#edit-home-layout').hidden=!home;status.hidden=!home||status.hidden;closeMenu();refresh();}};
}
