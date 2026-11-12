import {createServer} from 'node:http';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {readFile,writeFile,rename,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {randomBytes,timingSafeEqual,scryptSync,createHash} from 'node:crypto';
import {createHaBridge} from './home-assistant.mjs';
import {createNotesStore} from '../src/apple-notes.js';
import {createDemoFamilyProvider} from '../src/family-data.js';
export function createDashboardServer({password,storage,haUrl='',haToken='',entities={},fetchImpl=fetch,staticRoot=resolve('dist'),secureCookies=false,credentialStore,registryImpl,notesSyncToken=''}={}){
 if(!password)throw new Error('DASHBOARD_PASSWORD skal konfigureres på serveren.');
 const salt=randomBytes(16),hash=scryptSync(password,salt,32),sessions=new Map(),attempts=new Map();
 if(notesSyncToken&&notesSyncToken.length<32)throw Error('NOTES_SYNC_TOKEN skal være mindst 32 tegn.');const notes=createNotesStore(storage);
 const ha=createHaBridge({haUrl,haToken,storage,credentialStore,fetchImpl,registryImpl});
 let vehicleCache=null;const assetCache=new Map();
 const durable=async value=>{await storage?.flush?.();await credentialStore?.flush?.();return value;};
 const json=(res,status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(value));};
 const session=req=>{const token=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('dashboard_session='))?.split('=')[1];const entry=token&&sessions.get(token);return entry&&entry.expires>Date.now()?entry:null;};
 async function body(req){const chunks=[];let bytes=0;for await(const part of req){chunks.push(part);bytes+=part.length;if(bytes>(req.url.startsWith('/api/settings/catalog')?262144:req.url.startsWith('/api/notes')||req.url.startsWith('/api/family')?65536:8192))throw new Error('For stor forespørgsel.');}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
 async function vehicle(){
  if(!ha.configured||!entities.battery)return {configured:false,readonly:true};
  try{
   const values={},times={},units={};await Promise.all(Object.entries(entities).filter(([,id])=>id).map(async([key,id])=>{const d=await ha.entity(id);values[key]=d.state;units[key]=d.attributes?.unit_of_measurement;times[key]=d.last_reported||d.last_updated||null;}));
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
 async function familySnapshot(family){const data=await family.load();return {...data,mode:'server',persistence:'server',sources:data.notes?data.sources:{...data.sources,tasks:{name:'Fælles huskeliste',status:'connected'},shopping:{name:'Fælles handleliste',status:'connected'}}};}
 return createServer(async(req,res)=>{
  try{
   const path=new URL(req.url,'http://localhost').pathname;
   if(path==='/api/info')return json(res,200,{service:'engstien-dashboard',authentication:'session',vehicleReadOnly:true});
   if(path==='/api/session'&&req.method==='POST'){
    const ip=req.socket.remoteAddress,attempt=attempts.get(ip);if(attempt&&attempt.until>Date.now()&&attempt.count>=5)return json(res,429,{error:'For mange forsøg. Prøv igen senere.'});
    const b=await body(req),candidate=scryptSync(String(b.password||''),salt,32);if(!timingSafeEqual(candidate,hash)){attempts.set(ip,{count:(attempt?.until>Date.now()?attempt.count:0)+1,until:Date.now()+900000});return json(res,401,{error:'Forkert adgangskode.'});}
    attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,{expires:Date.now()+43200000,family:createDemoFamilyProvider({storage})});res.setHeader('set-cookie',`dashboard_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secureCookies?'; Secure':''}`);return json(res,200,{authenticated:true});
   }
   if(path==='/api/notes/import'&&req.method==='POST'){
    if(!notesSyncToken)return json(res,503,{error:'Notes-broen er ikke konfigureret.'});
    const supplied=String(req.headers.authorization||'').replace(/^Bearer /,'');
    const hash=value=>createHash('sha256').update(value).digest();
    if(!timingSafeEqual(hash(supplied),hash(notesSyncToken)))return json(res,401,{error:'Ugyldig Notes-nøgle.'});
    try{const snapshot=notes.import(await body(req));await storage?.flush?.();return json(res,200,{ok:true,updatedAt:snapshot.updatedAt});}catch(e){return json(res,400,{error:e.message});}
   }
   if(path.startsWith('/api/')){
    const active=session(req);if(!active)return json(res,401,{error:'Log ind på dashboardserveren.'});
    if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!==`${secureCookies?'https':'http'}://${req.headers.host}`)return json(res,403,{error:'Ugyldig origin.'});
    if(path==='/api/settings/catalog'&&req.method==='GET')return json(res,200,ha.catalog());
    if(path==='/api/settings/catalog'&&req.method==='PUT'){try{return json(res,200,await durable(ha.saveCatalog(await body(req))));}catch(e){return json(res,e.status||400,{error:e.message});}}
    if(path==='/api/settings/ha'&&req.method==='GET')return json(res,200,await ha.snapshot(new URL(req.url,'http://localhost').searchParams.has('refresh')));
    if(path==='/api/settings/ha'&&req.method==='POST'){try{return json(res,200,await durable(await ha.configure(await body(req))));}catch(e){return json(res,400,{error:e.message});}}
    if(path==='/api/settings/ha'&&req.method==='DELETE')return json(res,200,await durable(ha.disconnect()));
    if(path==='/api/settings/command'&&req.method==='POST'){try{const command=await body(req);if(!Number.isSafeInteger(command.revision))throw Error('Hent enhedskataloget før betjening.');return json(res,200,await ha.command(command));}catch(e){return json(res,e.status||400,{error:e.message});}}
    if(path==='/api/vehicle'&&req.method==='GET')return json(res,200,await vehicle());
    if(path==='/api/family'&&req.method==='GET')return json(res,200,await familySnapshot(active.family));
    if(path==='/api/family'&&req.method==='POST'){
     const b=await body(req);if(!['addItem','setDone','editItem','clearCompleted','undo','importNotes'].includes(b.action))return json(res,400,{error:'Ukendt handling.'});await active.family[b.action](...(b.args||[]));await storage?.flush?.();return json(res,200,await familySnapshot(active.family));
    }
    return json(res,405,{error:'Live styring er ikke aktiveret. Tesla-forbindelsen er kun læseadgang.'});
   }
   if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Ikke understøttet.'});
   const file=resolve(staticRoot,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(resolve(staticRoot)+sep))return json(res,403,{error:'Ugyldig sti.'});
   let info;try{info=await stat(file);if(!info.isFile())throw Error();}catch{return json(res,404,{error:'Siden findes ikke.'});}
   const tag='"'+info.size.toString(16)+'-'+info.mtimeMs.toString(16)+'"',immutable=/[-.][a-zA-Z0-9_-]{8,}\.(?:js|css|woff2|webp|png|svg)$/.test(file)&&!file.endsWith('.html');
   const headers={'etag':tag,'last-modified':info.mtime.toUTCString(),'x-content-type-options':'nosniff','cache-control':immutable?'public, max-age=31536000, immutable':'no-cache'};
   if(req.headers['if-none-match']===tag||!req.headers['if-none-match']&&req.headers['if-modified-since']&&Math.floor(info.mtimeMs/1000)<=Date.parse(req.headers['if-modified-since'])/1000){res.writeHead(304,headers);return res.end();}
   let cached=assetCache.get(file);if(cached?.tag!==tag){cached={tag,content:await readFile(file)};if(assetCache.size>=64)assetCache.delete(assetCache.keys().next().value);assetCache.set(file,cached);}
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.webp':'image/webp','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'};res.writeHead(200,{...headers,'content-type':types[extname(file)]||'application/octet-stream','content-length':cached.content.length});res.end(req.method==='HEAD'?undefined:cached.content);
  }catch(e){if(!res.headersSent)json(res,400,{error:'Forespørgslen kunne ikke udføres.'});else res.end();}
 });
}
export function fileStorage(path){
 mkdirSync(resolve(path,'..'),{recursive:true});let data={};if(existsSync(path))data=JSON.parse(readFileSync(path,'utf8'));
 let revision=0,persisted=0,pending=null;
 async function flush(){
  if(pending){await pending;if(persisted!==revision)return flush();return;}
  if(persisted===revision)return;
  pending=(async()=>{while(persisted!==revision){const current=revision,serialized=JSON.stringify(data);await writeFile(path+'.tmp',serialized,{mode:0o600});await rename(path+'.tmp',path);persisted=current;}})();
  try{await pending;}finally{pending=null;}
 }
 return {get length(){return Object.keys(data).length;},key:i=>Object.keys(data)[i],getItem:k=>data[k]??null,setItem(k,v){data[k]=v;revision++;queueMicrotask(()=>flush().catch(()=>{}));},removeItem(k){if(Object.hasOwn(data,k)){delete data[k];revision++;queueMicrotask(()=>flush().catch(()=>{}));}},flush};
}
