export function deviceControl(catalog,connection,id,pending=false){
 const device=catalog.devices.find(d=>d.id===id);if(!device?.bindings.primary&&!device?.retired)return null;
 const entity=connection.entities?.find(e=>e.id===device.bindings.primary);
 const reason=device.retired?'Udgået af planen':!connection.online?'Forbindelse til Home Assistant mangler':!entity?'Den koblede enhed mangler':['unknown','unavailable'].includes(entity.state)?'Enheden er utilgængelig':pending?'Sender kommando …':'';
 return {device,entity,locked:!!reason,pending,reason,brightness:!!entity&&((entity.colorModes||[]).some(m=>!['onoff','unknown'].includes(m))||!!(entity.features&1)),position:!!(entity?.features&4),open:!!(entity?.features&1),close:!!(entity?.features&2),stop:!!(entity?.features&8)};
}
export function applyDeviceReadings(state,catalog,connection){
 if(!connection.online)return state;
 for(const device of catalog.devices){if(device.retired||!device.anchor||!device.bindings.primary)continue;const entity=connection.entities.find(e=>e.id===device.bindings.primary);if(!entity||['unknown','unavailable'].includes(entity.state))continue;const a=device.anchor,target=state[a.room];if(!target)continue;
  if(device.type==='light'){target.lights[a.key]=entity.state==='on';if(Number.isFinite(entity.brightness)){if(target.brightness!==100){for(const key of Object.keys(target.levels))target.levels[key]=target.levels[key]*target.brightness/100;target.brightness=100;}target.levels[a.key]=Math.round(entity.brightness/255*100);}}
  if(device.type==='climate'){if(Number.isFinite(entity.current))target.current=entity.current;if(Number.isFinite(entity.target))target.target=entity.target;}
  if(device.type==='cover'&&Number.isFinite(entity.position))target.curtains[a.key]=entity.position;
 }
 return state;
}
export function vehicleReadings(catalog,connection){
 const vehicle=catalog.devices.find(d=>d.type==='vehicle'&&!d.retired&&d.bindings.primary),charger=catalog.devices.find(d=>d.type==='charger'&&!d.retired&&d.bindings.primary);if(!vehicle)return null;
 const read=(device,slot)=>connection.entities.find(e=>e.id===device?.bindings[slot]),number=(device,slot)=>{const e=read(device,slot);return e&&!['unknown','unavailable',''].includes(e.state)&&Number.isFinite(Number(e.state))?Number(e.state):null;};
 const battery=number(vehicle,'primary'),target=number(vehicle,'target'),power=number(charger,'power'),energy=number(charger,'energy'),remaining=number(vehicle,'remaining'),cs=read(charger,'status'),status=read(vehicle,'status'),powerUnit=read(charger,'power')?.unit,energyUnit=read(charger,'energy')?.unit;
 return {configured:true,readonly:true,status:!connection.online?'offline':({charging:'charging',on:'charging',complete:'complete',stopped:'paused',off:'paused',disconnected:'disconnected',asleep:'sleeping'})[status?.state]||'offline',battery:battery>=0&&battery<=100?battery:null,target:target>=0&&target<=100?target:null,power:powerUnit==='W'?power===null?null:power/1000:powerUnit==='kW'?power:null,kwh:energyUnit==='Wh'?energy===null?null:energy/1000:energyUnit==='kWh'?energy:null,remainingMinutes:['h','hr'].includes(read(vehicle,'remaining')?.unit)?remaining===null?null:remaining*60:remaining,homeCharging:connection.online&&['charging','on'].includes(cs?.state)&&Date.now()-Date.parse(cs?.updatedAt)<300000,quality:!connection.online?'cached':battery===null?'unavailable':!Number.isFinite(Date.parse(read(vehicle,'primary')?.updatedAt||''))||Date.now()-Date.parse(read(vehicle,'primary')?.updatedAt||'')>900000?'cached':'live',source:'Home Assistant',updatedAt:read(vehicle,'primary')?.updatedAt,capacity:null,price:null};
}
