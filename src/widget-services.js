import {copenhagenDay} from './family-data.js';
import {createWeatherProvider} from './weather-data.js';
import {createGoogleCalendar} from './google-calendar.js';
export function createWidgetServices({storage,fetchImpl=fetch,now=()=>new Date(),googleClientId=import.meta.env?.VITE_GOOGLE_CALENDAR_CLIENT_ID||''}={}){
 const listeners=new Set();let queued=false;const emit=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;for(const fn of listeners)fn();});};
 const weather=createWeatherProvider({storage,fetchImpl,now,onChange:emit}),calendar=createGoogleCalendar({storage,fetchImpl,now,clientId:googleClientId,onChange:emit});
 const snapshot=()=>({today:copenhagenDay(now()),weather:weather.snapshot(),calendar:calendar.display(),camera:{status:'demo'}});
 return {weather,calendar,snapshot,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},async load(){await Promise.all([weather.load(),calendar.load()]);return snapshot();}};
}
