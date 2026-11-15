import {compatibleEntity,deviceRooms,normalizeDeviceCatalog} from './device-catalog.js';

export function importedType(entity){
 const domain=entity.id.split('.')[0];
 return ({light:'light',switch:'switch',input_boolean:'switch',climate:'climate',cover:'cover',sensor:'sensor',binary_sensor:'sensor',camera:'camera',media_player:'media_player',vacuum:'vacuum'})[domain]||null;
}
export function availableImports(catalog,connection){
 const bound=new Set(catalog.devices.filter(d=>!d.retired).map(d=>d.bindings.primary));
 return (connection.entities||[]).filter(e=>importedType(e)&&!bound.has(e.id)).sort((a,b)=>(a.area+' '+a.name).localeCompare(b.area+' '+b.name,'da'));
}
export function planDeviceImport(catalog,connection,{entityId,room,type,name,replaceId='',id='custom-'+crypto.randomUUID()}={}){
 if(!connection.online)throw Error('Forbind Home Assistant, før du tilføjer enheder.');
 const entity=availableImports(catalog,connection).find(e=>e.id===entityId);
 if(!entity)throw Error('Enheden er allerede koblet eller findes ikke længere. Hent listen igen.');
 if(!deviceRooms.some(r=>r.id===room))throw Error('Vælg et rum.');
 const selectedType=type||importedType(entity);
 if(!compatibleEntity({type:selectedType},'primary',entity))throw Error('Funktionen passer ikke til den valgte enhed.');
 const next=structuredClone(catalog),existing=replaceId&&next.devices.find(d=>d.id===replaceId&&!d.retired&&d.room===room&&d.type===selectedType&&!d.bindings.primary);
 if(replaceId&&!existing)throw Error('Den valgte funktion er allerede koblet. Hent opsætningen igen.');
 if(existing)existing.bindings.primary=entity.id;
 else next.devices.push({id,room,type:selectedType,name:(name||entity.name.slice(0,100)).trim(),bindings:{primary:entity.id}});
 return {catalog:normalizeDeviceCatalog(next),deviceId:existing?.id||id,room};
}
