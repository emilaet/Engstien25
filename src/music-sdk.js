const pending=new Map();
export function loadMusicSdk(src,ready){
 if(ready())return Promise.resolve();
 if(pending.has(src))return pending.get(src);
 const promise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=src;script.async=true;
  const timer=setTimeout(()=>finish(Error('Musiktjenesten svarer ikke. Prøv igen.')),20000);
  function finish(error){clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();pending.delete(src);reject(error);}else resolve();}
  script.onload=()=>finish(ready()?null:Error('Musikafspilleren kunne ikke startes.'));
  script.onerror=()=>finish(Error('Musiktjenesten kunne ikke hentes. Kontrollér forbindelsen.'));
  document.head.append(script);
 });
 pending.set(src,promise);return promise;
}
