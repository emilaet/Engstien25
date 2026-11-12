// Touch phones remain in phone mode when rotated to landscape.
export const phoneMedia='(max-width:760px), (max-width:1000px) and (max-height:500px) and (any-pointer:coarse)';
export const isPhoneUI=()=>typeof matchMedia!=='undefined'&&matchMedia(phoneMedia).matches;
export function setupMobileApp(){
 const query=matchMedia(phoneMedia),root=document.documentElement;
 const canType=el=>el.matches('textarea,[contenteditable=true],input:not([type]),input[type=text],input[type=search],input[type=url],input[type=email],input[type=password],input[type=tel],input[type=number]');
 function protect(node){if(!query.matches)return;for(const el of [node,...(node.querySelectorAll?.('input,textarea,[contenteditable=true]')||[])]){if(!el.matches||!canType(el))continue;if(!el.hasAttribute('data-touch-locked')){el.dataset.touchLocked='true';el.dataset.originalReadonly=String(!!el.readOnly);el.readOnly=true;el.inputMode='none';el.tabIndex=-1;}if(el.isContentEditable)el.contentEditable='false';}}
 function sync(){root.dataset.phoneUi=String(query.matches);if(query.matches)protect(document.body);else for(const el of document.querySelectorAll('[data-touch-locked]')){el.readOnly=el.dataset.originalReadonly==='true';el.removeAttribute('inputmode');el.removeAttribute('tabindex');delete el.dataset.touchLocked;delete el.dataset.originalReadonly;}}
 new MutationObserver(records=>{if(query.matches)for(const r of records)for(const node of r.addedNodes)if(node.nodeType===1)protect(node);}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('pointerdown',e=>{if(query.matches&&canType(e.target)){e.preventDefault();e.target.blur();}},true);
 document.addEventListener('focusin',e=>{if(query.matches&&canType(e.target))e.target.blur();},true);
 query.addEventListener('change',sync);sync();
}
