import {retryAfterMillis as retryDelay} from '../src/retry-after.js';
export {retryDelay};
export function createPoliteTariffFetch({fetchImpl=fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),now=Date.now}={}){
 let queue=Promise.resolve(),cooldown=null;
 return (url,options={})=>{
  const task=queue.then(async()=>{
   if(cooldown)throw cooldown;
   const request=()=>fetchImpl(url,{...options,signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','User-Agent':'Engstien25/tariff-publisher (github.com/emilaet/Engstien25)'}});
   let response=await request();
   if(response.status===429){const delay=retryDelay(response.headers?.get?.('retry-after'),now());if(delay>60000){cooldown=Error('Tarifkilden har begrænset adgangen. Prøv igen efter '+Math.ceil(delay/1000)+' sekunder.');throw cooldown;}await wait(delay);response=await request();if(response.status===429){cooldown=Error('Tarifkilden svarer stadig med HTTP 429. Prøv igen efter '+Math.ceil(retryDelay(response.headers?.get?.('retry-after'),now())/1000)+' sekunder.');throw cooldown;}}
   await wait(1100);return response;
  });queue=task.catch(()=>{});return task;
 };
}
