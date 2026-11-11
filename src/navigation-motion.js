// Navigation remains synchronous: animations never delay controls or history.
export function createNavigationMotion(nav){
 const marker=document.createElement('span');
 marker.className='nav-selection';marker.setAttribute('aria-hidden','true');nav.prepend(marker);
 nav.classList.add('has-nav-motion');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let previous=null,animation=null;
 function position(){
  const active=nav.querySelector('.nav.active');
  for(const button of nav.querySelectorAll('.nav')){
   if(button===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  marker.style.opacity=active?'1':'0';
  if(!active)return;
  const rect=active.getBoundingClientRect(),parent=nav.getBoundingClientRect();
  marker.style.width=rect.width+'px';marker.style.height=rect.height+'px';
  marker.style.borderRadius=getComputedStyle(active).borderRadius;
  marker.style.transform=`translate(${rect.left-parent.left}px,${rect.top-parent.top}px)`;
 }
 const observer=new ResizeObserver(position);observer.observe(nav);
 for(const button of nav.querySelectorAll('.nav'))observer.observe(button);
 document.fonts.ready.then(position);
 reduced.addEventListener('change',()=>{if(reduced.matches){animation?.cancel();animation=null;}});
 return {sync(view){
  position();
  if(!nav.dataset.motionReady)requestAnimationFrame(()=>{nav.dataset.motionReady='true';});
  if(view===previous)return;
  const initial=previous===null;previous=view;
  animation?.cancel();animation=null;
  const target=document.querySelector(view==='home'?'#family-dashboard':view==='settings'?'#settings-page':'#rooms-workspace');
  if(!initial&&!reduced.matches&&target?.animate){
   // Fade without translating the workspace: resizing, camera hit testing and
   // restored editor drafts must keep their exact coordinates during entry.
   animation=target.animate([{opacity:0},{opacity:1}],{duration:240,easing:'cubic-bezier(.22,1,.36,1)'});
  }
 }};
}
