import {copenhagenDay,addDays,daysBetween} from './family-data.js';
// Normalized widget boundary. This provider deliberately supplies examples only.
export function demoWidgetSnapshot(now=new Date()){
 const today=copenhagenDay(now),hour=new Intl.DateTimeFormat('da-DK',{hour:'numeric',hourCycle:'h23',timeZone:'Europe/Copenhagen'}).format(now),night=+hour<7||+hour>=17;
 const kinds=['partly','rain','partly','sun','cloud'],highs=[11,10,9,10,8],lows=[7,6,5,4,3],rain=[20,70,30,10,20];
 const days=kinds.map((kind,i)=>({day:addDays(today,i),kind,high:highs[i],low:lows[i],rain:rain[i]}));
 const nextHour=(Math.floor(now.getTime()/3600000)+1)*3600000;
 const hours=Array.from({length:6},(_,i)=>{const at=new Date(nextHour+i*3600000);const h=+new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:'Europe/Copenhagen'}).format(at);return {at:at.toISOString(),day:copenhagenDay(at),kind:i<2?'rain':h<7||h>=17?'moon':'partly',temperature:(night?8:11)-Math.floor(i/2),rain:[70,60,20,10,10,10][i]};});
 const events=[{id:'play',day:addDays(today,1),title:'Legeaftale',start:'10.00',end:'12.00',person:'Lucas',color:'amber'},{id:'gym',day:addDays(today,2),title:'Gymnastik',start:'16.30',end:'17.15',person:'Lucas',color:'amber'},{id:'sophia',day:addDays(today,4),title:'Hent Sophia tidligt',start:'14.30',end:'',person:'Sophia',color:'blue'},{id:'visit',day:addDays(today,6),title:'Bedsteforældre på besøg',start:'15.00',end:'',person:'Familien',color:'green'}];
 return {today,weather:{status:'demo',current:night?8:11,feels:night?6:9,condition:night?'Lette byger':'Let skyet',kind:night?'rain':'partly',wind:4,direction:'S',days,hours},camera:{status:'demo'},calendar:{status:'demo',source:'Google Kalender',from:today,to:addDays(today,6),events:upcomingEvents(events,today)}};
}
export function upcomingEvents(events,today){return events.filter(e=>daysBetween(e.day,today)>=0&&daysBetween(e.day,today)<7).sort((a,b)=>a.day.localeCompare(b.day)||(a.start||'').localeCompare(b.start||''));}
export function createDemoWidgetsProvider({now=()=>new Date()}={}){return {async load(){return demoWidgetSnapshot(now());}};}
