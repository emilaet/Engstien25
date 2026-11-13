import {safeStorage} from './storage.js';
export const widgetPreferencePrefix='engstien-widget-options-v1:';
const select=(key,label,options,value,extra={})=>({key,label,options,value,type:'select',...extra});
const check=(key,label,value=true)=>({key,label,value,type:'checkbox'});
const listFields=[select('view','Visning',[['list','Liste'],['compact','Kun titel · åbn ved tryk']],'list'),check('showCompleted','Vis afkrydsede punkter'),check('allowAdd','Tillad tilføjelse i den udvidede liste'),select('source','Listens kilde',[['local','Liste i dashboardet'],['notes','Apple Noter · opsættes med Home Assistant']],'local',{advanced:true}),{key:'noteName',label:'Navn på Apple-note',type:'text',value:'',advanced:true}];
export const widgetOptions={
 house:{name:'Husoversigt',fields:[check('showTemperature','Vis indetemperatur'),check('showLights','Vis antal rum med lys')],connection:'Home Assistant'},
 weather:{name:'Vejret',fields:[select('forecast','Prognose',[['days','Næste dage'],['hours','Time for time']],'days'),check('showWind','Vis vind')],connection:'Open-Meteo'},
 calendar:{name:'Familiens kalender',fields:[select('events','Antal aftaler',[['1','1 aftale'],['3','3 aftaler'],['5','5 aftaler']],'3'),check('showDetails','Vis tidspunkt og person')],connection:'Google Kalender'},
 camera:{name:'Hoveddørskamera',fields:[select('mode','Ønsket kameravisning',[['image','Billede'],['interval','Billede med interval'],['live','Livevideo · kræver tilsluttet kamera']],'image'),select('interval','Opdater billede hvert',[['1','minut'],['5','5. minut'],['10','10. minut'],['30','30. minut'],['60','60. minut']],'5')],connection:'Home Assistant · kamera'},
 car:{name:'Billader',fields:[check('showPower','Vis ladeeffekt'),check('showRemaining','Vis resterende ladetid')],connection:'Home Assistant · bil og ladeboks'},
 lights:{name:'Belysning',fields:[select('count','Vis antal',[['rooms','Rum med lys'],['lamps','Tændte lysgrupper']],'rooms')],connection:'Home Assistant · lys'},
 climate:{name:'Indeklima',fields:[select('value','Temperatur i overblikket',[['average','Gennemsnit'],['lowest','Laveste rumtemperatur'],['highest','Højeste rumtemperatur']],'average')],connection:'Home Assistant · varme'},
 curtains:{name:'Gardiner',fields:[select('value','Visning',[['percent','Åbning i procent'],['state','Åben / lukket / delvist åben']],'percent')],connection:'Home Assistant · gardiner'},
 tasks:{name:'Huskeliste',fields:listFields,connection:'Apple Noter'},shopping:{name:'Handleliste',fields:listFields,connection:'Apple Noter'},
 waste:{name:'Tømmekalender',fields:[select('view','Visning',[['simple','Enkel · næste tømning'],['detailed','Detaljeret · også efterfølgende tømning']],'detailed'),check('showIcons','Vis affaldssymboler')],connection:'Renosyd · via Home Assistant'},
 music:{name:'Musik',fields:[check('showArtwork','Vis albumcover'),check('showTimeline','Vis afspilningslinje')],connection:'Spotify / Apple Music'},
 electricity:{name:'Elpriser',fields:[select('hours','Synlige timer ad gangen',[['4','4 timer'],['5','5 timer'],['6','6 timer']],'5'),check('vat','Medtag 25 % moms'),check('showAverage','Vis dagens gennemsnit'),select('area','Prisområde',[['DK1','DK1 · Hørning / Vestdanmark'],['DK2','DK2 · Østdanmark']],'DK1',{advanced:true})],connection:'Elprisen lige nu · spotpris'}
};
export function normalizeWidgetOptions(id,value={}){
 if(!widgetOptions[id])throw Error('Ukendt widget.');const result={};
 for(const f of widgetOptions[id].fields){const v=value?.[f.key];result[f.key]=f.type==='checkbox'?(typeof v==='boolean'?v:f.value):f.type==='text'?(typeof v==='string'?v.trim().slice(0,100):f.value):f.options.some(([key])=>key===v)?v:f.value;}
 return result;
}
export function createWidgetPreferences(storage){
 const disk=safeStorage(storage),listeners=new Set();
 function get(id){let value={};try{value=JSON.parse(disk.getItem(widgetPreferencePrefix+id))||{};}catch{}if(id==='weather'&&!value.forecast)value.forecast=disk.getItem('engstien-weather-mode')==='hours'?'hours':'days';return normalizeWidgetOptions(id,value);}
 function emit(id){for(const fn of listeners)fn(id);}
 if(typeof window!=='undefined')window.addEventListener('storage',e=>{if(e.key?.startsWith(widgetPreferencePrefix))emit(e.key.slice(widgetPreferencePrefix.length));});
 return {get,set(id,patch){const next=normalizeWidgetOptions(id,{...get(id),...patch});if(!disk.setItem(widgetPreferencePrefix+id,JSON.stringify(next)))throw Error('Indstillingen kunne ikke gemmes.');if(id==='weather')disk.setItem('engstien-weather-mode',next.forecast);emit(id);return next;},subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}};
}
export const widgetPreferences=createWidgetPreferences();
