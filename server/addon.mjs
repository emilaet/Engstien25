import {mkdirSync,chownSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDashboardServer,fileStorage} from './app.mjs';

export function startAddon({env=process.env,dataDirectory=env.DASHBOARD_DATA_DIR||'/data',dropPrivileges=true}={}){
 if(!env.SUPERVISOR_TOKEN)throw Error('Start Engstien fra Home Assistant. Supervisor-adgang mangler.');
 const directory=resolve(dataDirectory);mkdirSync(directory,{recursive:true});
 if(dropPrivileges&&process.getuid?.()===0){
  chownSync(directory,1000,1000);
  for(const name of ['dashboard.json','ha-connection.json'])if(existsSync(resolve(directory,name)))chownSync(resolve(directory,name),1000,1000);
  process.setgid(1000);process.setuid(1000);
 }
 const storage=fileStorage(resolve(directory,'dashboard.json'));
 const credentials=fileStorage(resolve(directory,'ha-connection.json'));
 const server=createDashboardServer({storage,credentialStore:credentials,staticRoot:resolve(fileURLToPath(new URL('../dist',import.meta.url))),haUrl:'http://supervisor/core/',haToken:env.SUPERVISOR_TOKEN,managedHa:true,ingress:{trustedAddress:'172.30.32.2'},build:env.APP_BUILD||undefined});
 server.listen(8099,'0.0.0.0',()=>console.log('Engstien er klar via Home Assistant.'));
 let stopping=false;
 const stop=()=>{if(stopping)return;stopping=true;const timeout=setTimeout(()=>process.exit(1),25000);timeout.unref();server.close(async()=>{try{await storage.flush();await credentials.flush();clearTimeout(timeout);process.exit(0);}catch{console.error('Opsætningen kunne ikke gemmes ved stop.');process.exit(1);}});server.closeIdleConnections();};
 process.once('SIGTERM',stop);process.once('SIGINT',stop);
 return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))startAddon();
