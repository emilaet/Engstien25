import {createServer} from 'node:http';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {randomBytes,timingSafeEqual,scryptSync} from 'node:crypto';
import {createDemoFamilyProvider} from '../src/family-data.js';
export function createDashboardServer({password,storage,haUrl='',haToken='',entities={},fetchImpl=fetch,staticRoot=resolve('dist'),secureCookies=false}={}){
 if(!password)throw new Error('DASHBOARD_PASSWORD skal konfigureres på serveren.');
 const salt=randomBytes(16),hash=scryptSync(password,salt,32),sessions=new Map(),attempts=new Map();
 let vehicleCache=null;
 const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value));};
 const session=req=>{const token=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('dashboard_session='))?.split('=')[1];const entry=token&&sessions.get(token);return entry&&entry.expires>Date.now()?entry:null;};
 async function body(req){let text='';for await(const part of req){text+=part;if(text.length>8192)throw new Error('For stor forespørgsel.');}return JSON.parse(text||'{}');}
 async function vehicle(){
  if(!haUrl||!haToken||!entities.battery)return {configured:false,readonly:true};
  try{
   const values={},times={},units={};await Promise.all(Object.entries(entities).filter(([,id])=>id).map(async([key,id])=>{const u=new URL('api/states/'+encodeURIComponent(id),haUrl.endsWith('/')?haUrl:haUrl+'/');const r=await fetchImpl(u,{headers:{authorization:'Bearer '+haToken},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('HA unavailable');const d=await r.json();values[key]=d.state;units[key]=d.attributes?.unit_of_measurement;times[key]=d.last_reported||d.last_updated||null;}));
   const num=key=>values[key]!==undefined&&values[key]!==null&&values[key]!==''&&Number.isFinite(Number(values[key]))?Number(values[key]):null;
   const percent=key=>num(key)!==null&&num(key)>=0&&num(key)<=100?num(key):null;
   const states={charging:'charging',on:'charging',stopped:'paused',off:'paused',complete:'complete',disconnected:'disconnected',starting:'waiting',asleep:'sleeping'};
   const status=states[String(values.status).toLowerCase()]||'offline';
   const age=key=>times[key]?Date.now()-Date.parse(times[key]):Infinity;
   const power=num('power')===null?null:units.power==='W'?num('power')/1000:units.power==='kW'?num('power'):null;
   const energy=num('energy')===null?null:units.energy==='Wh'?num('energy')/1000:units.energy==='kWh'?num('energy'):null;
   const remainingMinutes=num('remaining')===null?null:['h','hr'].includes(units.remaining)?num('remaining')*60:['min','minutes'].includes(units.remaining)?num('remaining'):null;
   vehicleCache={configured:true,readonly:true,status,battery:percent('battery'),target:percent('target'),power,kwh:energy,remainingMinutes,capacity:null,price:null,homeCharging:age('charger')<300000&&['charging','on'].includes(String(values.charger).toLowerCase()),quality:percent('battery')===null?'unavailable':age('battery')>900000?'cached':'live',source:'Home Assistant · Tesla',updatedAt:times.battery,fetchedAt:new Date().toISOString()};return vehicleCache;
  }catch{return vehicleCache?{...vehicleCache,status:'offline',homeCharging:false,quality:'cached'}:{configured:true,readonly:true,status:'offline',battery:null,target:null,power:null,kwh:null,price:null,homeCharging:false,quality:'unavailable',source:'Home Assistant · Tesla',updatedAt:null};}
 }
 async function familySnapshot(family){const data=await family.load();return {...data,mode:'server',persistence:'server',sources:{...data.sources,tasks:{name:'Fælles huskeliste',status:'connected'},shopping:{name:'Fælles handleliste',status:'connected'}}};}
 return createServer(async(req,res)=>{
  try{
   const path=new URL(req.url,'http://localhost').pathname;
   if(path==='/api/info')return json(res,200,{service:'engstien-dashboard',authentication:'session',vehicleReadOnly:true});
   if(path==='/api/session'&&req.method==='POST'){
    const ip=req.socket.remoteAddress,attempt=attempts.get(ip);if(attempt&&attempt.until>Date.now()&&attempt.count>=5)return json(res,429,{error:'For mange forsøg. Prøv igen senere.'});
    const b=await body(req),candidate=scryptSync(String(b.password||''),salt,32);if(!timingSafeEqual(candidate,hash)){attempts.set(ip,{count:(attempt?.until>Date.now()?attempt.count:0)+1,until:Date.now()+900000});return json(res,401,{error:'Forkert adgangskode.'});}
    attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,{expires:Date.now()+43200000,family:createDemoFamilyProvider({storage})});res.setHeader('set-cookie',`dashboard_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secureCookies?'; Secure':''}`);return json(res,200,{authenticated:true});
   }
   if(path.startsWith('/api/')){
    const active=session(req);if(!active)return json(res,401,{error:'Log ind på dashboardserveren.'});
    if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`${secureCookies?'https':'http'}://${req.headers.host}`)return json(res,403,{error:'Ugyldig origin.'});
    if(path==='/api/vehicle'&&req.method==='GET')return json(res,200,await vehicle());
    if(path==='/api/family'&&req.method==='GET')return json(res,200,await familySnapshot(active.family));
    if(path==='/api/family'&&req.method==='POST'){
     const b=await body(req);if(!['addItem','setDone','editItem','clearCompleted','undo'].includes(b.action))return json(res,400,{error:'Ukendt handling.'});await active.family[b.action](...(b.args||[]));return json(res,200,await familySnapshot(active.family));
    }
    return json(res,405,{error:'Live styring er ikke aktiveret. Tesla-forbindelsen er kun læseadgang.'});
   }
   if(req.method!=='GET')return json(res,405,{error:'Ikke understøttet.'});
   const file=resolve(staticRoot,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(resolve(staticRoot)+sep))return json(res,403,{error:'Ugyldig sti.'});if(!existsSync(file))return json(res,404,{error:'Siden findes ikke.'});
   const content=readFileSync(file);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'};res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'no-cache'});res.end(content);
  }catch(e){if(!res.headersSent)json(res,400,{error:'Forespørgslen kunne ikke udføres.'});else res.end();}
 });
}
export function fileStorage(path){
 mkdirSync(resolve(path,'..'),{recursive:true});let data={};if(existsSync(path))data=JSON.parse(readFileSync(path,'utf8'));
 return {get length(){return Object.keys(data).length;},key:i=>Object.keys(data)[i],getItem:k=>data[k]??null,setItem(k,v){const next={...data,[k]:v};writeFileSync(path+'.tmp',JSON.stringify(next),{mode:0o600});renameSync(path+'.tmp',path);data=next;}};
}
