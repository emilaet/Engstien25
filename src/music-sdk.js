const pending=new Map();
export function loadBrowserSdk(src,ready,{service='Musiktjenesten',player='Musikafspilleren'}={}){
 if(ready())return Promise.resolve();
 if(pending.has(src))return pending.get(src);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=src;script.async=true;
  const timer=setTimeout(()=>finish(Error(service+' svarer ikke. Prøv igen.')),20000);
  function finish(error){clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();pending.delete(src);reject(error);}else resolve();}
  script.onload=()=>finish(ready()?null:Error(player+' kunne ikke startes.'));
  script.onerror=()=>finish(Error(service+' kunne ikke hentes. Kontrollér forbindelsen.'));
  document.head.append(script);
 });
 pending.set(src,promise);return promise;
}

export const loadMusicSdk=loadBrowserSdk;
