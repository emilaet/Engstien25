import {defaultLayout,validLayout,migrateLayout} from './dashboard-layout.js';
import {widgetOptions,normalizeWidgetOptions} from './widget-preferences.js';
import {safeStorage} from './storage.js';
export const dashboardProfileKey='engstien-household-profile-v1';
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function normalizeDashboardProfile(value){
 if(!object(value)||!validLayout(value.layout)||!object(value.widgets)||!['auto','day','night'].includes(value.appearance)||!['compact','comfortable'].includes(value.density)||typeof value.briefing!=='boolean')throw Error('Dashboardopsætningen er ugyldig.');
 const fields=['id','width','height','visible','heightPx','mobileHeightPx','mobileOrder','column','row'];
 const layout=migrateLayout(value.layout).map(widget=>Object.fromEntries(fields.filter(key=>widget[key]!==undefined).map(key=>[key,widget[key]])));
 return {layout,widgets:Object.fromEntries(Object.keys(widgetOptions).map(id=>[id,normalizeWidgetOptions(id,value.widgets[id])])),appearance:value.appearance,density:value.density,briefing:value.briefing};
}
export function defaultDashboardProfile(){return normalizeDashboardProfile({layout:defaultLayout(),widgets:{},appearance:'auto',density:'compact',briefing:true});}
export function normalizeProfileEnvelope(value){
 if(!object(value)||value.version!==1||!Number.isSafeInteger(value.revision)||value.revision<0||(value.profile===null?value.revision!==0:!Number.isFinite(Date.parse(value.updatedAt))))throw Error('Den fælles opsætning kunne ikke læses.');
 return {version:1,revision:value.revision,updatedAt:value.updatedAt??null,profile:value.profile===null?null:normalizeDashboardProfile(value.profile)};
}
export function createDashboardProfileStore(storage,{now=()=>new Date()}={}){
 const disk=safeStorage(storage);
 function load(){const raw=disk.getItem(dashboardProfileKey);if(raw===null)return {version:1,revision:0,updatedAt:null,profile:null};return normalizeProfileEnvelope(JSON.parse(raw));}
 return {load,save(value,expectedRevision){const current=load();if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==current.revision){const error=Error('Opsætningen er ændret på en anden enhed. Hent den fælles opstilling før du gemmer igen.');error.status=409;throw error;}
  const next={version:1,revision:current.revision+1,updatedAt:now().toISOString(),profile:normalizeDashboardProfile(value)};if(!disk.setItem(dashboardProfileKey,JSON.stringify(next)))throw Error('Den fælles opsætning kunne ikke gemmes.');return structuredClone(next);
 }};
}
