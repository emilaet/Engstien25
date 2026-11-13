import {createTariffProvider} from './electricity-tariffs.js';
import {createElectricityProvider} from './electricity-data.js';
import {widgetPreferences} from './widget-preferences.js';
import {copenhagenDay} from './family-data.js';
import {createWeatherProvider} from './weather-data.js';
import {createGoogleCalendar} from './google-calendar.js';
export function createWidgetServices({storage,fetchImpl=fetch,now=()=>new Date(),googleClientId=import.meta.env?.VITE_GOOGLE_CALENDAR_CLIENT_ID||''}={}){
 const listeners=new Set();let queued=false;const emit=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;for(const fn of listeners)fn();});};
 const weather=createWeatherProvider({storage,fetchImpl,now,onChange:emit}),calendar=createGoogleCalendar({storage,fetchImpl,now,clientId:googleClientId,onChange:emit});
 const prices=createElectricityProvider({storage,fetchImpl,now,onChange:emit}),tariffs=createTariffProvider({storage,fetchImpl,now,onChange:emit});
 const electricity={snapshot:()=>({...prices.snapshot(),tariffs:tariffs.snapshot()}),async load({force=false,priceArea=widgetPreferences.get('electricity').area}={}){await Promise.all([prices.load({force,priceArea}),tariffs.load({force,gridCompany:widgetPreferences.get('electricity').grid})]);return this.snapshot();}};
 const snapshot=()=>({today:copenhagenDay(now()),weather:weather.snapshot(),calendar:calendar.display(),camera:{status:'demo'},electricity:electricity.snapshot()});
 return {weather,calendar,electricity,snapshot,subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},async load(){void electricity.load({priceArea:widgetPreferences.get('electricity').area});await Promise.all([weather.load(),calendar.load()]);return snapshot();}};
}
