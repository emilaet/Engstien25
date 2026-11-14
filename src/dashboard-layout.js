import {menuIcon} from './menu-icon.js';
import {arrangeGrid,relocateGrid,reorderStack,snapGridRow,shiftStack} from './dashboard-grid.js';
import {widgetPreferences} from './widget-preferences.js';
import {safeStorage} from './storage.js';
import {isPhoneUI} from './mobile-app.js';
export const draftLayoutKey='engstien-home-layout-draft-v1';
export const layoutKey='engstien-home-layout-v3';
export const legacyLayoutKey='engstien-home-layout-v2';
export const previousLayoutKey='engstien-home-layout-v1';
export const widgetDefinitions=[
 {id:'electricity',name:'Elpriser',selector:'.electricity-card',width:4,height:5},
 {id:'music',name:'Musik',selector:'.music-card',width:3,height:3},
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
const positioned=w=>(w.column===undefined&&w.row===undefined||Number.isInteger(w.column)&&w.column>=0&&w.column<=11&&Number.isInteger(w.row)&&w.row>=0&&w.row<=10000)&&(w.mobileOrder===undefined||Number.isInteger(w.mobileOrder)&&w.mobileOrder>=0&&w.mobileOrder<widgetDefinitions.length)&&(w.mobileWidth===undefined||[6,12].includes(w.mobileWidth))&&(w.mobileVisible===undefined||typeof w.mobileVisible==='boolean')&&(w.mobileView===undefined||['list','compact'].includes(w.mobileView));
const sizes=w=>w&&typeof w.id==='string'&&(w.visible===undefined||typeof w.visible==='boolean')&&Number.isInteger(w.width)&&w.width>=2&&w.width<=12&&[2,3,4,5,7,9].includes(w.height)&&(w.heightPx===undefined||Number.isInteger(w.heightPx)&&w.heightPx>=132&&w.heightPx<=1092)&&(w.mobileHeightPx===undefined||Number.isInteger(w.mobileHeightPx)&&w.mobileHeightPx>=132&&w.mobileHeightPx<=1092)&&positioned(w);
const legacyDefault=()=>[['house',8,5],['waste',4,5],['tasks',4,5],['shopping',4,5],['car',4,5],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
const classicLayout=()=>[['house',4,5],['camera',4,5],['weather',4,5],['calendar',6,4],['waste',3,4],['car',3,4],['tasks',6,4],['shopping',6,4],['music',3,3],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
const previousDefaultLayout=()=>[['house',4,5],['calendar',4,5],['weather',4,5],['camera',4,3],['car',4,3],['waste',4,3],['tasks',4,4],['shopping',4,4],['music',4,4],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
export const defaultLayout=()=>[...previousDefaultLayout().map(w=>w.id==='car'?{...w,visible:false}:w),{id:'electricity',width:4,height:5,visible:true}];
const validPreviousWidgets=value=>Array.isArray(value)&&value.length===11&&new Set(value.map(w=>w?.id)).size===11&&value.every(w=>sizes(w)&&widgetDefinitions.some(d=>d.id===w.id&&d.id!=='music'&&d.id!=='electricity'));
export function validLayout(value){return Array.isArray(value)&&[12,widgetDefinitions.length].includes(value.length)&&new Set(value.map(w=>w?.id)).size===value.length&&value.every(w=>sizes(w)&&widgetDefinitions.some(d=>d.id===w.id))&&(value.length===13||!value.some(w=>w.id==='electricity'));}
export function migrateLayout(value){
 if(validLayout(value)&&value.length===13)return value;
 if(validLayout(value)&&value.length===12){const standard=matchesDefault(value,previousDefaultLayout())?'current':matchesDefault(value,classicLayout())?'classic':false;const existing=structuredClone(value);const rows=homeRectangles(existing);return [...existing,{id:'electricity',width:4,height:5,heightPx:244,visible:true,...(value.some(w=>w.row!==undefined)?{column:0,row:Math.max(...rows.filter(r=>r.visible!==false).map(r=>r.row+r.rows))}:{})}];}
 if(validPreviousWidgets(value)){const untouched=[classicLayout(),defaultLayout()].some(layout=>{const original=layout.filter(w=>w.id!=='music');return value.every((w,i)=>w.id===original[i].id&&w.width===original[i].width&&w.height===original[i].height&&(w.visible!==false)===(original[i].visible!==false)&&w.column===undefined&&w.heightPx===undefined&&w.mobileHeightPx===undefined&&w.mobileOrder===undefined);});return untouched?defaultLayout():[...structuredClone(value),{...defaultLayout().find(w=>w.id==='music'),heightPx:196},{...defaultLayout().find(w=>w.id==='electricity'),heightPx:244}];}
 if(!Array.isArray(value)||![7,8].includes(value.length)||!value.every(w=>sizes(w)&&oldIds.includes(w.id))||new Set(value.map(w=>w.id)).size!==value.length)return defaultLayout();
 const legacy=value.length===7&&!value.some(w=>w.id==='house')?[{id:'house',width:8,height:5},...value]:value;
 if(legacy.length!==8||!oldIds.every(id=>legacy.some(w=>w.id===id)))return defaultLayout();
 const original=legacyDefault(),untouched=legacy.every((w,i)=>w.id===original[i].id&&w.width===original[i].width&&w.height===original[i].height&&(w.visible===undefined||w.visible===original[i].visible));
 if(untouched)return defaultLayout();
 return [...structuredClone(legacy),...['camera','weather','calendar','music','electricity'].map(id=>({...defaultLayout().find(w=>w.id===id),heightPx:defaultHeights[id]}))];
}
export function moveWidget(layout,id,target){const next=structuredClone(layout),from=next.findIndex(w=>w.id===id);if(from<0)return next;const [widget]=next.splice(from,1);next.splice(Math.max(0,Math.min(next.length,target)),0,widget);return next;}
const presetSize=(id,size)=>size==='compact'?(['weather','calendar'].includes(id)?{width:2,height:5}:id==='car'?{width:2,height:3}:['lights','climate','curtains'].includes(id)?{width:2,height:2}:{width:3,height:4}):size==='wide'?{width:6,height:3}:{width:4,height:4};
const classicHeights={electricity:244,music:212,house:260,camera:260,weather:260,calendar:228,waste:228,car:228,tasks:196,shopping:196,lights:134,climate:134,curtains:134};
const defaultHeights={electricity:244,house:244,calendar:244,weather:244,camera:196,car:196,waste:196,tasks:308,shopping:308,music:196,lights:132,climate:132,curtains:132};
const heightSteps=[2,3,4,5,7,9];
const snapHeight=value=>Math.max(132,Math.min(1092,Math.round((value+12)/16)*16-12));
const matchesDefault=(layout,reference)=>layout.length===reference.length&&layout.every((w,i)=>{const d=reference[i];return w.id===d.id&&w.width===d.width&&w.height===d.height&&(w.visible!==false)===(d.visible!==false);});
const sameDefault=layout=>matchesDefault(layout,defaultLayout())||matchesDefault(layout,defaultLayout().map(w=>w.id==='car'?{...w,visible:true}:w))||matchesDefault(layout,previousDefaultLayout())?'current':matchesDefault(layout.filter(w=>w.id!=='electricity'),classicLayout())?'classic':false;
const cardHeight=(widget,standard,mobile=false)=>mobile&&widget.mobileHeightPx!==undefined?widget.mobileHeightPx:widget.heightPx??(standard?(standard==='classic'?classicHeights:defaultHeights)[widget.id]:widget.height*74-14);
const mobilePriority=['calendar','music','electricity','tasks','shopping','camera','waste','weather','car','house','lights','climate','curtains'];
const mobileHeights={electricity:244,calendar:164,waste:164,weather:164,car:164,tasks:164,shopping:164,house:164,camera:244,music:164,lights:132,climate:132,curtains:132};
const mobileWidths={electricity:12,calendar:6,music:6,tasks:6,shopping:6,camera:12,waste:6,weather:6,car:6,house:12,lights:6,climate:6,curtains:6};
export const mobileWidth=widget=>widget.mobileWidth??mobileWidths[widget.id]??12;
const mobileDefaultVisible=id=>['calendar','electricity','tasks','shopping','camera','music'].includes(id);
export function widgetVisible(widget,mobile=false){return mobile?(widget.mobileVisible??mobileDefaultVisible(widget.id)):widget.visible!==false;}
export function resetMobileLayout(layout){return layout.map(w=>({...w,mobileOrder:mobilePriority.indexOf(w.id),mobileHeightPx:mobileHeights[w.id],mobileWidth:mobileWidths[w.id],mobileVisible:mobileDefaultVisible(w.id),...(['tasks','shopping'].includes(w.id)?{mobileView:'list'}:{})}));}
export function homeRectangles(layout,{minimum=2,stack=false,compactIds=[]}={}){const standard=sameDefault(layout),custom=layout.some(w=>w.mobileOrder!==undefined),items=layout.map(w=>({...w,visible:widgetVisible(w,stack),...(stack?{mobileWidth:mobileWidth(w),mobileOrder:w.mobileOrder??mobilePriority.indexOf(w.id)+(custom?widgetDefinitions.length:0)}:{}),rows:compactIds.includes(w.id)?5:Math.round(((stack?(w.mobileHeightPx??mobileHeights[w.id]):cardHeight(w,standard))+12)/16)}));if(stack)items.sort((a,b)=>a.mobileOrder-b.mobileOrder||mobilePriority.indexOf(a.id)-mobilePriority.indexOf(b.id));return arrangeGrid(items,{minimum,stack});}


export function setupDashboardLayout({onFinish=()=>{},onSaved=()=>{},notify=()=>{},onProjectionChange=()=>{},storage}={}){
 const disk=safeStorage(storage);
 let saved=defaultLayout();
 try{saved=migrateLayout(JSON.parse(disk.getItem(layoutKey)??disk.getItem(legacyLayoutKey)));}catch{}
 if(!disk.getItem('engstien-tesla-header-layout-v1')){if((disk.getItem(layoutKey)||disk.getItem(legacyLayoutKey))&&saved.some(w=>w.id==='car'&&w.visible!==false)){saved=saved.map(w=>w.id==='car'?{...w,visible:false}:w);disk.setItem(layoutKey,JSON.stringify(saved));}disk.setItem('engstien-tesla-header-layout-v1','1');}
 let previous=null;
 try{const value=JSON.parse(disk.getItem(previousLayoutKey));if(Array.isArray(value)&&[7,8,11,12].includes(value.length))previous=migrateLayout(value);}catch{}
 let draft=structuredClone(saved),editing=false,home=false,gesture=null,selectedWidget='weather',undoStack=[],redoStack=[],autoScroll=0,resizeFrame=0,baselineDraft='',editProfile=isPhoneUI()?'mobile':'desktop';
 let session=null;try{session=globalThis.sessionStorage;}catch{}const recoveryDisk=safeStorage(session);
 try{const recovery=JSON.parse(recoveryDisk.getItem(draftLayoutKey));if(recovery?.base&&JSON.stringify(migrateLayout(JSON.parse(recovery.base)))===JSON.stringify(saved)&&validLayout(recovery.draft)){draft=migrateLayout(recovery.draft);editing=true;editProfile=recovery.profile==='mobile'?'mobile':recovery.profile==='desktop'?'desktop':editProfile;baselineDraft=recovery.baseline?JSON.stringify(migrateLayout(JSON.parse(recovery.baseline))):JSON.stringify(saved);selectedWidget=widgetDefinitions.some(w=>w.id===recovery.selected)?recovery.selected:'weather';undoStack=(recovery.undo||[]).filter(validLayout).map(migrateLayout);redoStack=(recovery.redo||[]).filter(validLayout).map(migrateLayout);}}catch{}
 const mobileLayout=()=>editing?editProfile==='mobile':isPhoneUI();
 const dirty=()=>editing&&JSON.stringify(draft)!==baselineDraft;
 function persistDraft(){if(dirty())recoveryDisk.setItem(draftLayoutKey,JSON.stringify({base:JSON.stringify(saved),draft,baseline:baselineDraft,selected:selectedWidget,profile:editProfile,undo:undoStack,redo:redoStack}));else recoveryDisk.removeItem(draftLayoutKey);}
 const compactIds=(layout,mobile=mobileLayout())=>['shopping','tasks'].filter(id=>(mobile?(layout.find(w=>w.id===id)?.mobileView??'list'):widgetPreferences.get(id).view)==='compact');
 const viewHeight=(w,standard,mobile=mobileLayout())=>compactIds([w],mobile).includes(w.id)?68:mobile?(w.mobileHeightPx??mobileHeights[w.id]):cardHeight(w,standard);

 const summary=document.querySelector('.summary'),stats=[...summary.children],house=document.querySelector('#house-overview'),parking=document.querySelector('#home-overview-parking');
 const area=document.createElement('div');area.className='home-layout-menu';
 area.innerHTML='<button id="home-options" aria-label="Tilpas Hjem" aria-expanded="false" aria-controls="home-options-menu">'+menuIcon+'</button><div id="home-options-menu" hidden><button id="edit-home-layout">Rediger dashboard</button></div>';
 document.querySelector('.header-right').append(area);
 const toolbar=document.createElement('section');toolbar.className='layout-editor';toolbar.hidden=true;toolbar.setAttribute('aria-label','Rediger dashboard');
 toolbar.innerHTML=`<div class="layout-bar"><div class="layout-bar-copy"><h2 tabindex="-1">Rediger dashboard</h2><span class="layout-dirty" aria-live="off">Ingen ændringer</span></div><div class="layout-profile-picker" role="group" aria-label="Rediger skærm"><button type="button" data-edit-profile="desktop" aria-pressed="true">iPad / computer</button><button type="button" data-edit-profile="mobile" aria-pressed="false">Mobil</button></div><button id="toggle-layout-details" aria-label="Widgets og størrelser" aria-expanded="false" aria-controls="layout-details"><span aria-hidden="true">⊞</span><span class="layout-widgets-text">Widgets</span></button><button id="undo-home-layout" aria-label="Fortryd layoutændring" title="Fortryd">↶</button><button id="redo-home-layout" aria-label="Gentag layoutændring" title="Gentag">↷</button><button id="cancel-home-layout">Annuller</button><button id="save-home-layout" class="primary">Gem dashboard</button></div><div class="layout-context" aria-label="Valgt widget"></div><div class="layout-details" id="layout-details" hidden><div class="layout-details-head"><h3>Widgets og størrelser</h3><button id="close-layout-details" aria-label="Luk widgetindstillinger">×</button></div><div class="layout-selected"></div><div class="layout-list-heading"><b>Vis på dashboardet</b><span class="layout-visible-count"></span></div><div class="layout-widget-list"></div><div class="layout-reset-actions"><button id="restore-previous-home-layout" ${previous?'':'hidden'}>Tidligere layout</button><button id="reset-home-layout">Gendan standard</button></div></div>`;
 document.querySelector('#family-dashboard').before(toolbar);
 const status=document.createElement('p');status.className='layout-status';status.setAttribute('role','status');status.hidden=true;toolbar.after(status);const previewLabel=document.createElement('p');previewLabel.className='mobile-dashboard-preview-label';previewLabel.textContent='Mobil-preview · 390 px · gemmes særskilt fra iPad';previewLabel.hidden=true;status.after(previewLabel);
 window.addEventListener('pagehide',()=>{endGesture(true);persistDraft();});
 const cardFor=id=>document.querySelector(`.family-grid [data-widget-id="${id}"]`);
 function announce(message){status.hidden=false;status.textContent=message;}
 function remember(before=draft){undoStack.push(structuredClone(before));if(undoStack.length>50)undoStack.shift();redoStack=[];}
 function history(redo=false){const from=redo?redoStack:undoStack,to=redo?undoStack:redoStack;if(!from.length)return;to.push(structuredClone(draft));draft=from.pop();refresh();}
 function details(open){toolbar.classList.toggle('details-open',open);toolbar.querySelector('.layout-details').hidden=!open;toolbar.querySelector('#toggle-layout-details').setAttribute('aria-expanded',String(open));}
 function closeMenu(){area.querySelector('#home-options-menu').hidden=true;area.querySelector('#home-options').setAttribute('aria-expanded','false');}
 function controls(widget){
  const name=widgetDefinitions.find(w=>w.id===widget.id).name;
  return `<div class="widget-editor"><button type="button" class="widget-drag" data-widget-drag="${widget.id}" aria-label="Træk ${name} eller flyt med piletaster" title="Flyt kort">⠿</button></div><button class="widget-resize widget-resize-width" data-widget-resize="${widget.id}" data-axis="width" role="slider" aria-label="Tilpas bredden på ${name}" aria-orientation="horizontal" aria-valuemin="2" aria-valuemax="12" aria-valuenow="${widget.width}"></button><button class="widget-resize widget-resize-height" data-widget-resize="${widget.id}" data-axis="height" role="slider" aria-label="Tilpas højden på ${name}" aria-orientation="vertical" aria-valuemin="132" aria-valuemax="1092" aria-valuenow="${Math.round(viewHeight(widget,sameDefault(draft)))}"></button><button class="widget-resize widget-resize-both" data-widget-resize="${widget.id}" data-axis="both" aria-label="Tilpas størrelse på ${name}" title="Træk for at ændre bredde og højde">⌟</button><span class="widget-size-label" aria-hidden="true"></span>`;
 }
 function renderEditor(){
  if(!editing)return;
  toolbar.querySelector('h2').textContent=mobileLayout()?'Rediger mobildashboard':'Rediger dashboard';for(const b of toolbar.querySelectorAll('[data-edit-profile]'))b.setAttribute('aria-pressed',String(b.dataset.editProfile===editProfile));toolbar.querySelector('#reset-home-layout').textContent=mobileLayout()?'Gendan mobilstandard':'Gendan standard';
  const widget=draft.find(w=>w.id===selectedWidget)||draft[0],heightChoice=mobileLayout()?heightSteps.reduce((a,b)=>Math.abs(b*74-14-viewHeight(widget,sameDefault(draft)))<Math.abs(a*74-14-viewHeight(widget,sameDefault(draft)))?b:a):widget.height,definition=widgetDefinitions.find(w=>w.id===widget.id),reading=rectangles(draft).sort((a,b)=>a.row-b.row||a.column-b.column),place=reading.findIndex(r=>r.id===widget.id);selectedWidget=widget.id;
  toolbar.querySelector('.layout-context').innerHTML=`<b><small>Vælg et kort</small>${definition.name}</b><div role="group" aria-label="Hurtig størrelse">${[['compact','Kompakt'],['standard','Standard'],['wide','Bred']].map(([value,label])=>`<button data-layout-size="${value}" aria-label="${label} ${definition.name}">${label}</button>`).join('')}</div>`;
  toolbar.querySelector('.layout-dirty').textContent=dirty()?'Ikke gemt':'Ingen ændringer';
  toolbar.querySelector('.layout-selected').innerHTML=`<b>${definition.name}</b><p>${mobileLayout()?'Vælg halv eller fuld bredde. Mobilens valg gemmes særskilt.':'Du kan også trække direkte i kortets kanter.'}</p><div class="layout-presets" role="group" aria-label="Størrelsesforslag">${[['compact','Kompakt'],['standard','Standard'],['wide','Bred']].map(([size,name])=>`<button data-widget-preset="${widget.id}" data-size="${size}">${name}</button>`).join('')}</div><div class="widget-dimensions"><label>Bredde<select data-widget-width="${widget.id}" aria-label="Bredde for ${definition.name}">${(mobileLayout()?[6,12]:Array.from({length:11},(_,i)=>i+2)).map(v=>`<option value="${v}" ${(mobileLayout()?mobileWidth(widget):widget.width)===v?'selected':''}>${mobileLayout()?(v===6?'50 % · halv bredde':'100 % · fuld bredde'):(({2:'⅙',3:'¼',4:'⅓',6:'½',8:'⅔',12:'Fuld bredde'})[v]||v+'/12')+(v===12?'':' af rækken')}</option>`).join('')}</select></label><label>Højde<select data-widget-height="${widget.id}" aria-label="Højde for ${definition.name}" ${compactIds(draft).includes(widget.id)?'disabled':''}>${[[2,'Lav'],[3,'Kompakt'],[4,'Mellem'],[5,'Høj'],[7,'Ekstra høj'],[9,'Størst']].map(([v,l])=>`<option value="${v}" ${heightChoice===v?'selected':''}>${l}</option>`).join('')}</select></label></div>${mobileLayout()&&['tasks','shopping'].includes(widget.id)?`<label class="mobile-widget-view">Mobilvisning<select data-widget-mobile-view="${widget.id}" aria-label="Mobilvisning for ${definition.name}"><option value="list" ${(widget.mobileView??'list')==='list'?'selected':''}>Kort med antal og indhold</option><option value="compact" ${(widget.mobileView??'list')==='compact'?'selected':''}>Kun titel · åbn ved tryk</option></select></label>`:''}<div class="layout-position" role="group" aria-label="Flyt i dashboardet"><button data-widget-nudge="${widget.id}" data-x="-1" data-y="0" aria-label="Flyt ${definition.name} til venstre">←</button><button data-widget-nudge="${widget.id}" data-x="0" data-y="-1" aria-label="Flyt ${definition.name} op">↑</button><button data-widget-nudge="${widget.id}" data-x="0" data-y="1" aria-label="Flyt ${definition.name} ned">↓</button><button data-widget-nudge="${widget.id}" data-x="1" data-y="0" aria-label="Flyt ${definition.name} til højre">→</button></div><div class="layout-move"><button data-widget-move="${widget.id}" data-direction="-1" aria-label="Flyt ${definition.name} tidligere" ${place<=0?'disabled':''}>← Tidligere</button><button data-widget-move="${widget.id}" data-direction="1" aria-label="Flyt ${definition.name} senere" ${place<0||place===reading.length-1?'disabled':''}>Senere →</button></div>`;
  const list=toolbar.querySelector('.layout-widget-list'),top=list.scrollTop;
  list.innerHTML=draft.map(w=>{const def=widgetDefinitions.find(d=>d.id===w.id);return `<div class="layout-widget-option ${w.id===selectedWidget?'selected':''}"><button data-widget-select="${w.id}" aria-label="Tilpas ${def.name}" aria-pressed="${w.id===selectedWidget}">${def.name}</button><label class="widget-visibility"><input type="checkbox" data-widget-visible="${w.id}" aria-label="Vis ${def.name} på Hjem" ${widgetVisible(w,mobileLayout())?'checked':''}><span aria-hidden="true"></span></label></div>`;}).join('');list.scrollTop=top;
  toolbar.querySelector('#undo-home-layout').disabled=!undoStack.length;toolbar.querySelector('#redo-home-layout').disabled=!redoStack.length;
  toolbar.querySelector('.layout-visible-count').textContent=`${draft.filter(w=>widgetVisible(w,mobileLayout())).length} af ${draft.length}`;
 }
 function rectangles(layout,{minimum=innerWidth<=1000?3:2,stack=mobileLayout()}={}){return homeRectangles(layout,{minimum,stack,compactIds:compactIds(layout,stack)});}
 function writePositions(layout,rects,{mobileOrder=false}={}){
  const byId=new Map(rects.map(r=>[r.id,r])),reading=[...rects].sort((a,b)=>a.row-b.row||a.column-b.column);
  if(mobileLayout()){if(mobileOrder||gesture?.kind==='move')for(const [index,r] of reading.entries())layout.find(w=>w.id===r.id).mobileOrder=index;}
  else {for(const w of layout){const r=byId.get(w.id);if(r){w.column=r.column;w.row=r.row;}}layout.sort((a,b)=>{const x=byId.get(a.id),y=byId.get(b.id);return x&&y?x.row-y.row||x.column-y.column:x?-1:y?1:0;});}
 }
 function applySizes(layout,rects=rectangles(layout)){
  const byId=new Map(rects.map(r=>[r.id,r])),profiles={desktop:rectangles(layout,{minimum:2,stack:false}),tablet:rectangles(layout,{minimum:3,stack:false}),mobile:rectangles(layout,{stack:true})};
  for(const widget of layout){
   const card=cardFor(widget.id),rect=byId.get(widget.id);if(!card)continue;const fallback={column:0,row:0,width:12,rows:Math.round((viewHeight(widget,sameDefault(layout))+12)/16)},effective=rect||fallback;
   card.style.setProperty('--widget-width',widget.width);card.style.setProperty('--widget-span',effective.width);card.style.setProperty('--widget-height',widget.height);card.style.setProperty('--widget-rows',effective.rows);card.style.setProperty('--widget-column',effective.column+1);card.style.setProperty('--widget-row',effective.row+1);
   for(const [name,rectangles] of Object.entries(profiles)){const projected=rectangles.find(r=>r.id===widget.id)||fallback;card.style.setProperty(`--widget-${name}-column`,projected.column+1);card.style.setProperty(`--widget-${name}-row`,projected.row+1);card.style.setProperty(`--widget-${name}-span`,projected.width);card.style.setProperty(`--widget-${name}-rows`,projected.rows);}
   card.classList.toggle('mobile-half',mobileLayout()&&mobileWidth(widget)===6);
   if(['tasks','shopping'].includes(widget.id))card.classList.toggle('widget-compact',compactIds(layout).includes(widget.id));
   card.classList.toggle('widget-selected',editing&&widget.id===selectedWidget);
   const label=card.querySelector('.widget-size-label');if(label)label.textContent=gesture?.kind==='move'&&gesture.started?'Slip på den markerede plads':`${mobileLayout()?(mobileWidth(widget)===6?'50 %':'100 %'):widget.width+'/12'} · ${effective.rows*16-12} px`;
   card.querySelector('[data-axis=width]')?.setAttribute('aria-valuenow',widget.width);
   card.querySelector('[data-axis=height]')?.setAttribute('aria-valuenow',effective.rows*16-12);
  }
  if(gesture?.placeholder){const r=byId.get(gesture.id);gesture.placeholder.style.gridColumn=`${r.column+1} / span ${r.width}`;gesture.placeholder.style.gridRow=`${r.row+1} / span ${r.rows}`;}
 }
 function nudge(id,x,y){
  const rects=rectangles(draft),r=rects.find(r=>r.id===id);if(!r)return;
  const next=mobileLayout()?shiftStack(rects,id,y||x):relocateGrid(rects,id,{column:r.column+x,row:r.row+y});
  if(!next.some(v=>{const before=rects.find(b=>b.id===v.id);return v.column!==before.column||v.row!==before.row;}))return;
  remember();selectedWidget=id;writePositions(draft,next,{mobileOrder:true});refresh();announce('Kortet er flyttet. Ændringen er ikke gemt endnu.');
 }
 function refresh(){
  const preview=editing&&mobileLayout()&&!isPhoneUI();document.documentElement.dataset.dashboardPreview=preview?'mobile':'';document.documentElement.dataset.dashboardEditProfile=editing?editProfile:'';previewLabel.hidden=!preview;
  const grid=document.querySelector('.family-grid');summary.hidden=home&&!!grid;
  if(!home||!grid){for(const stat of stats){summary.append(stat);stat.inert=false;}if(house)parking.append(house);if(grid){grid.classList.remove('dashboard-grid','is-editing','reference-layout');grid.querySelectorAll('.widget-editor,.widget-resize,.widget-size-label,.summary-widget').forEach(el=>el.remove());grid.querySelectorAll('.dashboard-widget').forEach(el=>{el.classList.remove('dashboard-widget');el.hidden=false;el.style.removeProperty('order');for(const child of el.children)child.inert=false;});}return;}
  const active=document.activeElement,inPanel=toolbar.contains(active),focus=active?.dataset,selection=focus&&Object.keys(focus).find(k=>k.startsWith('widget'));
  renderEditor();grid.classList.add('dashboard-grid');grid.classList.toggle('is-editing',editing);grid.classList.remove('reference-layout');
  if(house&&house.parentElement!==grid)grid.append(house);
  for(const stat of stats){let wrapper=stat.closest('.summary-widget');if(!wrapper){wrapper=document.createElement('section');wrapper.className='summary-widget';wrapper.append(stat);}if(wrapper.parentElement!==grid)grid.append(wrapper);}
  const layout=editing?draft:saved;
  const briefing=document.querySelector('.family-briefing');if(briefing){briefing.inert=editing;const buttons=[...briefing.querySelectorAll('[data-briefing-target]')];for(const button of buttons)button.hidden=false;const visible=buttons.filter(b=>!b.hidden);briefing.hidden=!visible.length;visible.forEach((b,i)=>b.classList.toggle('briefing-mobile-overflow',i>=2));}
  const reading=rectangles(layout).sort((a,b)=>a.row-b.row||a.column-b.column).map(r=>r.id),ordered=[...layout].sort((a,b)=>(reading.includes(a.id)?reading.indexOf(a.id):99)-(reading.includes(b.id)?reading.indexOf(b.id):99));
  ordered.forEach((widget,index)=>{
   const content=document.querySelector(widgetDefinitions.find(w=>w.id===widget.id).selector),card=content?.closest('.summary-widget')||content;if(!card)return;
   card.classList.add('dashboard-widget');card.classList.remove('widget-is-hidden');card.hidden=!widgetVisible(widget,mobileLayout());card.dataset.widgetId=widget.id;card.style.order=index;
   card.querySelectorAll('.widget-editor,.widget-resize,.widget-size-label').forEach(el=>el.remove());if(editing&&widgetVisible(widget,mobileLayout()))card.insertAdjacentHTML('afterbegin',controls(widget));
   if(grid.children[index]!==card)grid.insertBefore(card,grid.children[index]||null);
   for(const child of card.children)child.inert=editing&&!child.matches('.widget-editor,.widget-resize,.widget-size-label');
  });
  applySizes(layout);if(editing)persistDraft();
  if(selection){const attr=selection.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),extra=active.dataset.direction?`[data-direction="${active.dataset.direction}"]`:active.dataset.size?`[data-size="${active.dataset.size}"]`:active.dataset.axis?`[data-axis="${active.dataset.axis}"]`:active.dataset.x!==undefined?`[data-x="${active.dataset.x}"][data-y="${active.dataset.y}"]`:'';(inPanel?toolbar:grid).querySelector(`[data-${attr}="${focus[selection]}"]${extra}`)?.focus({preventScroll:true});}
  else if(active?.isConnected)active.focus?.({preventScroll:true});
  onProjectionChange();
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
  if(save){saved=structuredClone(draft);disk.setItem(layoutKey,JSON.stringify(saved));const shared=onSaved();announce(shared?'Opstillingen er gemt lokalt og synkroniseres med huset.':disk.persistent?'Dit layout er gemt på denne enhed.':'Lagring er ikke tilgængelig. Layoutet bevares kun, mens siden er åben.');}
  editing=false;recoveryDisk.removeItem(draftLayoutKey);document.documentElement.classList.remove('home-layout-editing');details(false);toolbar.hidden=true;area.querySelector('#home-options').disabled=false;refresh();area.querySelector('#home-options').focus({preventScroll:true});onFinish();
 }
 area.querySelector('#home-options').onclick=()=>{const menu=area.querySelector('#home-options-menu');menu.hidden=!menu.hidden;area.querySelector('#home-options').setAttribute('aria-expanded',String(!menu.hidden));};
 const chooseProfile=profile=>{endGesture(true);editProfile=profile==='mobile'?'mobile':'desktop';if(!draft.some(w=>w.id===selectedWidget&&widgetVisible(w,mobileLayout())))selectedWidget=draft.find(w=>widgetVisible(w,mobileLayout()))?.id||'calendar';refresh();onProjectionChange();};
 const startEditing=(profile=isPhoneUI()?'mobile':'desktop')=>{
  if(editing){chooseProfile(profile);return;}closeMenu();draft=structuredClone(saved);editProfile=profile==='mobile'?'mobile':'desktop';baselineDraft=JSON.stringify(draft);undoStack=[];redoStack=[];editing=true;details(false);area.querySelector('#home-options').disabled=true;status.hidden=true;toolbar.hidden=false;document.documentElement.classList.add('home-layout-editing');chooseProfile(editProfile);(isPhoneUI()?toolbar.querySelector('#toggle-layout-details'):toolbar.querySelector('h2')).focus({preventScroll:true});
 };
 for(const button of toolbar.querySelectorAll('[data-edit-profile]'))button.onclick=()=>chooseProfile(button.dataset.editProfile);
 area.querySelector('#edit-home-layout').onclick=()=>startEditing();
 toolbar.querySelector('#toggle-layout-details').onclick=()=>details(toolbar.querySelector('.layout-details').hidden);
 toolbar.querySelector('#close-layout-details').onclick=()=>{details(false);toolbar.querySelector('#toggle-layout-details').focus();};
 toolbar.querySelector('#restore-previous-home-layout').onclick=()=>{if(previous){remember();draft=structuredClone(previous);refresh();notify('Dit tidligere layout er indlæst som udkast. Gem, hvis du vil bruge det.');}};
 toolbar.querySelector('#undo-home-layout').onclick=()=>history();toolbar.querySelector('#redo-home-layout').onclick=()=>history(true);
 toolbar.querySelector('#save-home-layout').onclick=()=>finish(true);toolbar.querySelector('#cancel-home-layout').onclick=()=>finish(false);toolbar.querySelector('#reset-home-layout').onclick=()=>{remember();draft=mobileLayout()?resetMobileLayout(draft):defaultLayout().map(w=>{const before=draft.find(d=>d.id===w.id);for(const key of ['mobileOrder','mobileHeightPx','mobileVisible','mobileView','mobileWidth'])if(before?.[key]!==undefined)w[key]=before[key];return w;});refresh();};
 document.addEventListener('click',event=>{
  if(!area.contains(event.target))closeMenu();if(!editing||gesture)return;
  const selected=event.target.closest('[data-widget-select]'),card=event.target.closest('.dashboard-widget');
  if(selected||card&&!event.target.closest('button')){selectedWidget=selected?.dataset.widgetSelect||card.dataset.widgetId;refresh();return;}
  const nudged=event.target.closest('[data-widget-nudge]');if(nudged){nudge(nudged.dataset.widgetNudge,Number(nudged.dataset.x),Number(nudged.dataset.y));return;}
  const quick=event.target.closest('[data-layout-size]');if(quick){toolbar.querySelector(`[data-widget-preset="${selectedWidget}"][data-size="${quick.dataset.layoutSize}"]`).click();return;}
  const preset=event.target.closest('[data-widget-preset]');
  if(preset){const before=rectangles(draft);remember();const widget=draft.find(w=>w.id===preset.dataset.widgetPreset);const size=presetSize(widget.id,preset.dataset.size);if(mobileLayout()){widget.mobileWidth=preset.dataset.size==='compact'?6:12;if(['tasks','shopping'].includes(widget.id))widget.mobileView='list';}if(!mobileLayout())Object.assign(widget,size);widget[mobileLayout()?'mobileHeightPx':'heightPx']=snapHeight(mobileLayout()?(preset.dataset.size==='compact'?132:preset.dataset.size==='wide'?356:244):size.height*74-14);if(!mobileLayout())writePositions(draft,relocateGrid(before,widget.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((widget.heightPx+12)/16)}));refresh();return;}
  const button=event.target.closest('[data-widget-move]');if(button){const id=button.dataset.widgetMove,direction=Number(button.dataset.direction),rects=rectangles(draft).sort((a,b)=>a.row-b.row||a.column-b.column),index=rects.findIndex(r=>r.id===id),target=rects[index+direction];if(index<0||!target)return;remember();writePositions(draft,mobileLayout()?shiftStack(rects,id,direction):relocateGrid(rects,id,{column:target.column,row:target.row}),{mobileOrder:true});refresh();}
 });
 document.addEventListener('change',event=>{
  if(!editing)return;const el=event.target,id=el.dataset.widgetWidth||el.dataset.widgetHeight||el.dataset.widgetVisible||el.dataset.widgetMobileView;if(!id)return;const before=rectangles(draft);remember();const widget=draft.find(w=>w.id===id);
  if(el.dataset.widgetVisible)widget[mobileLayout()?'mobileVisible':'visible']=el.checked;
  else if(el.dataset.widgetMobileView)widget.mobileView=el.value;
  else if(el.dataset.widgetWidth)widget[mobileLayout()?'mobileWidth':'width']=Number(el.value);
  else {if(mobileLayout()&&['tasks','shopping'].includes(widget.id))widget.mobileView='list';if(!mobileLayout())widget.height=Number(el.value);widget[mobileLayout()?'mobileHeightPx':'heightPx']=snapHeight(Number(el.value)*74-14);}
  if(!el.dataset.widgetVisible&&!el.dataset.widgetMobileView&&!mobileLayout())writePositions(draft,relocateGrid(before,id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((viewHeight(widget,sameDefault(draft))+12)/16)}));
  refresh();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if(gesture){event.preventDefault();endGesture(true);}else if(editing&&home&&!toolbar.querySelector('.layout-details').hidden){event.preventDefault();details(false);toolbar.querySelector('#toggle-layout-details').focus();}else if(editing&&home){event.preventDefault();finish(false);}else closeMenu();return;}
  if(!editing||!home||gesture)return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.target.matches('input,textarea,select')){event.preventDefault();history(event.shiftKey);return;}
  const resize=event.target.closest('[data-widget-resize]');
  if(resize&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
   const axis=resize.dataset.axis,widget=draft.find(w=>w.id===resize.dataset.widgetResize),horizontal=['ArrowLeft','ArrowRight'].includes(event.key);
   if(axis==='width'&&!horizontal&&!['Home','End'].includes(event.key)||axis==='height'&&horizontal)return;
   event.preventDefault();const before=rectangles(draft);remember();selectedWidget=widget.id;
   if(axis==='width'||axis==='both'&&horizontal)widget.width=event.key==='Home'?2:event.key==='End'?12:Math.max(2,Math.min(12,widget.width+(event.key==='ArrowLeft'?-1:1)));
   else {const beforeHeight=viewHeight(widget,sameDefault(draft));if(mobileLayout()&&['tasks','shopping'].includes(widget.id))widget.mobileView='list';widget[mobileLayout()?'mobileHeightPx':'heightPx']=snapHeight(event.key==='Home'?132:event.key==='End'?1092:beforeHeight+(event.key==='ArrowUp'?-16:16));if(!mobileLayout())widget.height=heightSteps.reduce((a,b)=>Math.abs(b*74-14-viewHeight(widget,sameDefault(draft)))<Math.abs(a*74-14-viewHeight(widget,sameDefault(draft)))?b:a);}
   if(!mobileLayout())writePositions(draft,relocateGrid(before,widget.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((viewHeight(widget,sameDefault(draft))+12)/16)}));refresh();return;
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
   if(mobileLayout()&&g.axis!=='width'&&['tasks','shopping'].includes(widget.id))widget.mobileView='list';
   const dx=x+scrollX-g.startX,dy=y+scrollY-g.startY;
   if(g.axis!=='height'&&!mobileLayout())widget.width=Math.max(innerWidth<=1000?3:2,Math.min(12,Math.round(g.width+dx/g.column)));
   if(g.axis!=='width'){widget[mobileLayout()?'mobileHeightPx':'heightPx']=snapHeight(g.height+dy);if(!mobileLayout())widget.height=heightSteps.reduce((a,b)=>Math.abs(b*74-14-viewHeight(widget,sameDefault(draft)))<Math.abs(a*74-14-viewHeight(widget,sameDefault(draft)))?b:a);}
   next=mobileLayout()?rectangles(draft):relocateGrid(g.rects,g.id,{width:Math.max(innerWidth<=1000?3:2,widget.width),rows:Math.round((viewHeight(widget,sameDefault(draft))+12)/16)});
  }else{
   const left=x-g.offsetX,top=y-g.offsetY;g.card.style.setProperty('left',left+'px');g.card.style.setProperty('top',top+'px');g.inBounds=x>=grid.left-24&&x<=grid.right+24&&y>=grid.top-64;
   const column=Math.round((left-grid.left)/g.column),row=snapGridRow((top-grid.top)/16,g.rects);next=mobileLayout()?reorderStack(g.rects,g.id,(top-grid.top)/16,(left-grid.left)/g.column+Math.min(mobileWidth(widget),6)/2):relocateGrid(g.rects,g.id,{column,row});g.placeholder.classList.toggle('drop-invalid',!g.inBounds);
  }
  g.changed=next.some(r=>{const old=g.rects.find(v=>v.id===r.id);return r.column!==old.column||r.row!==old.row||r.width!==old.width||r.rows!==old.rows;});writePositions(draft,next);applySizes(draft,next);
 }
 function scrollGesture(){
  if(!gesture)return;const bar=toolbar.getBoundingClientRect(),top=bar.top<innerHeight/2?bar.bottom+12:24,bottom=bar.top>=innerHeight/2?bar.top-12:innerHeight-(mobileLayout()?84:24),speed=!gesture.started?0:gesture.y>bottom?12:gesture.y<top?-12:0;
  if(speed){const before=scrollY;window.scrollBy(0,speed);if(scrollY!==before)updateGesture(gesture.x,gesture.y);}
  autoScroll=requestAnimationFrame(scrollGesture);
 }
 document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-widget-resize],[data-widget-drag]');if(!editing||!handle||event.button!==0||gesture)return;
  event.preventDefault();details(false);const id=handle.dataset.widgetResize||handle.dataset.widgetDrag,widget=draft.find(w=>w.id===id),grid=document.querySelector('.family-grid'),card=cardFor(id),box=card.getBoundingClientRect();selectedWidget=id;renderEditor();
  gesture={id,handle,card,box,pointerId:event.pointerId,kind:handle.dataset.widgetResize?'resize':'move',axis:handle.dataset.axis,before:structuredClone(draft),rects:rectangles(draft),startX:event.clientX+scrollX,startY:event.clientY+scrollY,offsetX:event.clientX-box.left,offsetY:event.clientY-box.top,x:event.clientX,y:event.clientY,width:widget.width,height:box.height,column:(grid.getBoundingClientRect().width+12)/12,started:false,changed:false,inBounds:true};
  handle.setPointerCapture(event.pointerId);handle.focus({preventScroll:true});applySizes(draft);autoScroll=requestAnimationFrame(scrollGesture);
 });
 window.addEventListener('resize',()=>{if(gesture)endGesture(true);cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(home)refresh();});});
 document.addEventListener('pointermove',event=>{if(gesture&&gesture.pointerId===event.pointerId)updateGesture(event.clientX,event.clientY);});
 document.addEventListener('pointerup',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture();});
 document.addEventListener('pointercancel',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture(true);});
 document.addEventListener('lostpointercapture',event=>{if(gesture&&gesture.pointerId===event.pointerId)endGesture(true);});
 const wantsHouseModel=()=>{const w=(editing?draft:saved).find(w=>w.id==='house');return !!w&&widgetVisible(w,mobileLayout())&&(!mobileLayout()||mobileWidth(w)===12);};
 return {refresh,wantsHouseModel,mobileWidth:id=>mobileWidth((editing?draft:saved).find(w=>w.id===id)||{id}),setMobileWidth(id,width){if(editing||![6,12].includes(width)||!widgetDefinitions.some(w=>w.id===id))return;saved=saved.map(w=>w.id===id?{...w,mobileWidth:width}:w);draft=structuredClone(saved);disk.setItem(layoutKey,JSON.stringify(saved));onSaved();refresh();},isVisible:id=>{const w=(editing?draft:saved).find(w=>w.id===id);return !!w&&widgetVisible(w,mobileLayout());},isCompact:id=>compactIds(editing?draft:saved).includes(id),setMobileListView(id,view){if(editing||!['tasks','shopping'].includes(id)||!['list','compact'].includes(view))return;saved=saved.map(w=>w.id===id?{...w,mobileView:view}:w);draft=structuredClone(saved);disk.setItem(layoutKey,JSON.stringify(saved));onSaved();refresh();},current:()=>structuredClone(saved),isEditing:()=>editing,applyShared(value){if(editing)throw Error('Afslut dashboardredigering før den fælles opsætning hentes.');if(!validLayout(value))throw Error('Dashboardlayoutet er ugyldigt.');saved=structuredClone(migrateLayout(value));draft=structuredClone(saved);disk.setItem(layoutKey,JSON.stringify(saved));refresh();},visibility(id,visible){if(editing)return;saved=saved.map(w=>w.id===id?{...w,[mobileLayout()?'mobileVisible':'visible']:visible}:w);draft=structuredClone(saved);disk.setItem(layoutKey,JSON.stringify(saved));onSaved();refresh();},edit(profile){startEditing(profile);},preview(){startEditing();toolbar.querySelector('#reset-home-layout').click();},setHome(value){if(!value&&gesture)endGesture(true);home=value;toolbar.hidden=!home||!editing;document.documentElement.classList.toggle('home-layout-editing',home&&editing);area.querySelector('#home-options').disabled=home&&editing;area.hidden=false;area.querySelector('#home-options').setAttribute('aria-label',home?'Tilpas Hjem':'Flere muligheder');area.querySelector('#edit-home-layout').hidden=!home;status.hidden=!home||status.hidden;closeMenu();refresh();}};
}
