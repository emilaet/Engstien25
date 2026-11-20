import {test,expect} from './fixtures.js';
import {setAppearance,readyScene} from './ui.js';
import {createDashboardServer} from '../server/app.mjs';
import {resolve} from 'node:path';
import {robotRawStates,robotRegistry,robotStorage,mapPng} from '../tests/fixtures/robots.js';
let server,url,posts,states,offline,mapReads,serviceFailure;
test.use({actionTimeout:10000});
test.beforeEach(async()=>{
 posts=[];states=robotRawStates();offline=false;mapReads=0;serviceFailure=false;
 server=createDashboardServer({password:'robots-test-only',storage:robotStorage(),staticRoot:resolve('dist'),haUrl:'http://ha.test',haToken:'private-robot-token',registryImpl:async()=>robotRegistry(),fetchImpl:async(url,options)=>{
  if(offline)throw Error('offline');
  if(url.pathname.includes('image_proxy')){mapReads++;return new Response(mapPng,{headers:{'content-type':'image/png'}});}
  if(options.method==='POST'){
   if(serviceFailure)return new Response('Unavailable',{status:503});
   const body=JSON.parse(options.body);posts.push({path:url.pathname,body});const e=states.find(e=>e.entity_id===body.entity_id),service=url.pathname.split('/').at(-1);
   if(e){if(service==='start'||service==='clean_area')e.state='cleaning';if(service==='start_mowing'||service==='start_mow')e.state='mowing';if(service==='pause')e.state='paused';if(service==='return_to_base'||service==='dock')e.state='returning';if(service==='select_option')e.state=body.option;if(service==='set_value')e.state=String(body.value);if(service==='turn_on'||service==='turn_off')e.state=service==='turn_on'?'on':'off';}
   return Response.json([]);
  }
  return Response.json(states);
 }});await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;
});
test.afterEach(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
async function open(page,kind='vacuum'){
 const login=await page.request.post(url+'/api/session',{data:{password:'robots-test-only'}});expect(login.ok()).toBe(true);await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url+'/#'+kind);await expect(page.locator('.rp-status')).toHaveText('Ved stationen');
}

test('Both robot routes reuse the house canvas, frame the station and preserve appearance and history',{tag:'@smoke'},async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await readyScene(page);const scene=page.locator('#scene'),canvas=await scene.locator('canvas').elementHandle();await expect(scene).toHaveAttribute('data-view','vacuum');await expect(scene).toHaveAttribute('data-camera-moving','false');await setAppearance(page,'night');await expect(page.locator('.model-subtitle')).toContainText('Qrevo');
 await page.getByRole('button',{name:'Robotplæneklipper',exact:true}).click();await expect(scene).toHaveAttribute('data-view','mower');await expect(scene).toHaveAttribute('data-camera-moving','false');await expect(scene).toHaveAttribute('data-appearance','dark');expect(await scene.locator('canvas').evaluate((el,old)=>el===old,canvas)).toBe(true);expect(Number(await scene.getAttribute('data-robot-extent'))).toBeLessThan(.83);
 await page.waitForTimeout(350);const frames=Number(await scene.getAttribute('data-render-count'));await page.waitForTimeout(500);expect(Number(await scene.getAttribute('data-render-count'))-frames).toBeLessThanOrEqual(1);await page.goBack();await expect(scene).toHaveAttribute('data-view','vacuum');await expect(page.locator('.rp-kicker')).toContainText('QREVO');await page.reload();await expect(page.locator('.rp-status')).toHaveText('Ved stationen');expect(errors).toEqual([]);await page.getByRole('button',{name:'Forbind Roborock Qrevo 5AE',exact:true}).click();const editor=page.getByRole('dialog',{name:'Enhedens indstillinger',exact:true});await expect(editor).toBeVisible();await expect(editor.getByRole('combobox',{name:'Home Assistant: Robotstøvsuger',exact:true})).toHaveValue('vacuum.qrevo');expect(posts).toEqual([]);
});

test('Roborock controls send real typed HA services and only mapped rooms appear',async({page})=>{
 await open(page);await expect(page.locator('.rp-battery strong')).toContainText('78');await expect(page.locator('.rp-metrics')).toContainText('1 t 5 min');await expect(page.locator('[data-rp-choice]')).toHaveCount(2);await expect(page.locator('[data-rp-choice=bad]')).toHaveCount(0);
 await page.getByRole('button',{name:'Start rengøring',exact:true}).click();await expect(page.getByRole('button',{name:'Sæt på pause',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Sæt på pause',exact:true}).click();await expect(page.locator('.rp-status')).toHaveText('På pause');
 await page.locator('[data-rp-choice=stue]').click();await expect(page.locator('[data-rp-choice=stue]')).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Start i valgte rum',exact:true}).click();await expect.poll(()=>posts.some(p=>p.path.endsWith('/vacuum/clean_area'))).toBe(true);expect(posts.find(p=>p.path.endsWith('/clean_area')).body.cleaning_area_id).toEqual(['stue']);await expect(page.locator('[data-rp-choice=stue]')).toHaveAttribute('aria-pressed','true');
 await page.locator('.rp-settings summary').click();await page.getByLabel('Sugestyrke',{exact:true}).selectOption('turbo');await expect.poll(()=>posts.some(p=>p.body.fan_speed==='turbo')).toBe(true);await page.getByLabel('Mopperute',{exact:true}).selectOption('deep');await expect.poll(()=>posts.some(p=>p.body.option==='deep')).toBe(true);await page.getByRole('button',{name:/Vask mopper/}).click();await expect.poll(()=>posts.some(p=>p.body.entity_id==='switch.qrevo_wash')).toBe(true);await page.getByRole('switch',{name:'Børnesikring',exact:true}).click();await expect(page.getByRole('switch',{name:'Børnesikring',exact:true})).toHaveAttribute('aria-checked','true');
 await page.getByRole('button',{name:'Til station',exact:true}).click();await expect(page.locator('.rp-status')).toHaveText('På vej hjem');expect(posts[0]).toEqual({path:'/api/services/vacuum/start',body:{entity_id:'vacuum.qrevo'}});expect(mapReads).toBe(0);
});

test('Mammotion zones, existing tasks and real number limits work without showing unsupported blade-height controls',async({page})=>{
 await open(page,'mower');await page.getByRole('button',{name:'Forhave',exact:true}).click();await page.getByRole('button',{name:'Start i valgte zoner',exact:true}).click();await expect.poll(()=>posts.some(p=>p.path.endsWith('/mammotion/start_mow'))).toBe(true);expect(posts[0].body.areas).toEqual(['switch.yuka_front']);await expect(page.getByRole('button',{name:'Weekend',exact:false})).toBeEnabled();await page.getByRole('button',{name:'Weekend',exact:false}).click();await expect.poll(()=>posts.some(p=>p.path.endsWith('/button/press'))).toBe(true);
 await page.locator('.rp-settings summary').click();await expect(page.getByRole('slider',{name:'Klippehøjde',exact:true})).toHaveCount(0);await page.getByRole('slider',{name:'Kørehastighed',exact:true}).fill('0.5');await expect.poll(()=>posts.some(p=>p.body.entity_id==='number.yuka_speed'&&p.body.value===.5)).toBe(true);await expect(page.locator('.rp-settings')).toHaveAttribute('open','');await expect(page.getByRole('button',{name:'other_zone',exact:true})).toHaveCount(0);
});

test('Maps load only when opened, through the authenticated server; offline robots disable commands',async({page})=>{
 await open(page);expect(mapReads).toBe(0);await page.getByRole('button',{name:'Kort',exact:true}).click();await expect(page.locator('.robot-map-panel img')).toBeVisible();expect(mapReads).toBe(1);expect(await page.locator('.robot-map-panel img').getAttribute('src')).toMatch(/^\/api\/settings\/robot-map\?/);await page.getByRole('button',{name:'Opdater kort',exact:true}).click();await expect.poll(()=>mapReads).toBe(2);states.find(e=>e.entity_id==='image.qrevo_map').last_updated=new Date().toISOString();await page.request.get(url+'/api/settings/ha?refresh=1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect.poll(()=>mapReads).toBe(3);await page.getByRole('button',{name:'3D',exact:true}).click();await expect(page.locator('#scene')).toBeVisible();await expect(page.locator('.robot-portrait')).toBeHidden();
 offline=true;await page.goto(url+'/#settings/connections');await page.getByRole('button',{name:'Hent enheder igen',exact:true}).click();await page.getByRole('button',{name:'Robotstøvsuger',exact:true}).click();await expect(page.locator('.rp-status')).toHaveText('Forbindelsen mangler');await expect(page.getByRole('button',{name:'Start rengøring',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Til station',exact:true})).toBeDisabled();expect(posts).toEqual([]);
});

test('Robot phone pages remain readable at 320–430 px, with five reachable nav items and no typing controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await readyScene(page);
 for(const kind of ['vacuum','mower']){
  await page.getByRole('button',{name:kind==='vacuum'?'Robotstøvsuger':'Robotplæneklipper',exact:true}).click();await expect(page.locator('#scene')).toHaveAttribute('data-camera-moving','false');
  for(const width of [320,390,430]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.locator('#scene').evaluate(el=>Math.abs(el.getBoundingClientRect().width-el.querySelector('canvas').width/devicePixelRatio)<2)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('header h1')).toHaveText(kind==='vacuum'?'Robotstøvsuger':'Robotplæneklipper');for(const [view,name]of [['vacuum','Robotstøvsuger'],['mower','Robotplæneklipper']]){expect(await page.locator('.nav[data-tab='+view+'] small').textContent()).toBe(name);expect(await page.locator('.nav[data-tab='+view+'] small').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);}const sizes=await page.locator('.rail .nav').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,right:r.right};}));expect(sizes).toHaveLength(5);for(const r of sizes){expect(r.w).toBeGreaterThanOrEqual(44);expect(r.h).toBeGreaterThanOrEqual(44);expect(r.right).toBeLessThanOrEqual(width);}expect(await page.locator('#scene').evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(220);expect(await page.locator('.model-card').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(500);expect(await page.locator('#scene').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(350);await expect(page.locator('.robot-sidebar input:not([type=range]),.robot-sidebar textarea')).toHaveCount(0);}
 }
 await page.locator('.rp-settings summary').click();await expect(page.getByRole('slider',{name:'Kørehastighed',exact:true})).toBeVisible();await page.getByRole('button',{name:'Forbind Mammotion Yuka Mini 2',exact:true}).click();await expect(page.locator('#settings-page')).toBeVisible();await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('Robot selection during an unfinished camera morph cannot leave an old station or duplicate canvas',async({page})=>{
 await open(page);await readyScene(page);await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'Robotplæneklipper',exact:true}).click();await expect(page.locator('#scene')).toHaveAttribute('data-camera-moving','true');await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(page.locator('#scene')).toHaveAttribute('data-view','charger');await expect(page.locator('#scene')).toHaveAttribute('data-camera-moving','false');await expect(page.locator('#scene canvas')).toHaveCount(1);await expect(page.locator('.robot-panel')).toHaveCount(0);
});


test('An unconnected installation shows no invented battery or job and keeps both robot pages usable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#vacuum');await expect(page.locator('.rp-status')).toHaveText('Ikke tilsluttet');await expect(page.locator('.rp-battery strong')).toHaveText('—');await expect(page.getByRole('button',{name:'Start rengøring',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Kort',exact:true}).click();await expect(page.locator('.robot-map-panel')).toContainText('når Home Assistant er klar');await expect(page.locator('.robot-map-panel img')).toBeHidden();await page.getByRole('button',{name:'Robotplæneklipper',exact:true}).click();await expect(page.locator('.rp-status')).toHaveText('Ikke tilsluttet');await expect(page.locator('.rp-battery strong')).toHaveText('—');await expect(page.getByRole('button',{name:'Start klipning',exact:true})).toBeDisabled();
});

test('The complete product close-up is the default, with a working 3D/map alternative and image failure recovery',async({page})=>{
 await open(page);const image=page.locator('.robot-portrait img');await expect(image).toBeVisible();await expect.poll(()=>image.evaluate(i=>i.naturalWidth)).toBeGreaterThan(1000);await expect(image).toHaveCSS('object-fit','contain');await expect(page.getByRole('button',{name:'Nærbillede',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('#scene')).toBeHidden();await expect(page.getByRole('button',{name:'Zoom ind',exact:true})).toBeHidden();await readyScene(page);
 await page.getByRole('button',{name:'3D',exact:true}).click();await expect(page.locator('#scene')).toBeVisible();await expect(page.getByRole('button',{name:'Zoom ind',exact:true})).toBeVisible();await page.getByRole('button',{name:'Nærbillede',exact:true}).click();await expect(image).toBeVisible();await image.evaluate(i=>{i.src='/missing-robot-image.png';});await expect(page.locator('.robot-visual-error')).toBeVisible();await expect(page.locator('#scene')).toBeVisible();
 await page.getByRole('button',{name:'Robotplæneklipper',exact:true}).click();await expect(image).toBeVisible();await expect.poll(()=>image.evaluate(i=>i.naturalWidth)).toBeGreaterThan(1000);await expect(image).toHaveAttribute('alt',/grå Mammotion/);await expect(page.locator('.robot-visual-error')).toBeHidden();
});

test('Navigation labels never overlap the footer, and every robot stays reachable on short screens and iPads',async({page})=>{
 await open(page,'mower');
 for(const [width,height] of [[1440,1000],[1366,768],[1280,720],[1024,768],[820,1180],[1024,430],[820,360]]){
  await page.setViewportSize({width,height});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const kind of ['vacuum','mower']){const button=page.locator('.rail .nav[data-tab='+kind+']');await button.click();await expect(button).toBeInViewport();if(kind==='mower'){const rows=await page.locator('.model-heading h2').evaluate(el=>{const n=el.firstChild,t=n.textContent,r=document.createRange();r.setStart(n,t.indexOf('Mini'));r.setEnd(n,t.indexOf('Mini')+4);const first=r.getBoundingClientRect().top;r.setStart(n,t.lastIndexOf('2'));r.setEnd(n,t.lastIndexOf('2')+1);return [first,r.getBoundingClientRect().top];});expect(Math.abs(rows[0]-rows[1])).toBeLessThan(1);}const geometry=await button.evaluate(el=>{const a=el.getBoundingClientRect(),f=document.querySelector('.rail-bottom'),b=f.getBoundingClientRect(),text=el.querySelector('small'),range=document.createRange();range.selectNodeContents(text);const t=range.getBoundingClientRect();return {button:a.toJSON(),text:t.toJSON(),footer:b.toJSON(),footerVisible:getComputedStyle(f).display!=='none'};});expect(geometry.text.left).toBeGreaterThanOrEqual(geometry.button.left);expect(geometry.text.right).toBeLessThanOrEqual(geometry.button.right+.5);if(geometry.footerVisible)expect(geometry.button.bottom+12).toBeLessThanOrEqual(geometry.footer.top);const marker=page.locator('.nav-selection');await expect.poll(async()=>Math.abs((await marker.boundingBox()).y-(await button.boundingBox()).y)).toBeLessThan(1);}
 }
});

test('Unsupported values are never presented as selected defaults, and a keyboard-adjusted slider retains focus',async({page})=>{
 states.find(e=>e.entity_id==='select.qrevo_mop').state='unlisted';states[0].attributes.fan_speed='unlisted';await open(page);await page.locator('.rp-settings summary').click();await expect(page.getByLabel('Sugestyrke',{exact:true})).toHaveValue('');await expect(page.getByLabel('Mopperute',{exact:true})).toHaveValue('');expect(posts).toEqual([]);
 await page.getByRole('button',{name:'Robotplæneklipper',exact:true}).click();const slider=page.getByRole('slider',{name:'Kørehastighed',exact:true});await expect(page.locator('.rp-settings')).not.toHaveAttribute('open','');await page.locator('.rp-settings summary').click();await slider.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>posts.some(p=>p.body.entity_id==='number.yuka_speed'&&p.body.value===.5)).toBe(true);await expect(slider).toBeFocused();
});

test('A zone that goes offline is removed from the selection before another job can be started',async({page})=>{
 await open(page,'mower');const choice=page.getByRole('button',{name:'Forhave',exact:true});await choice.click();await expect(choice).toHaveAttribute('aria-pressed','true');states.find(e=>e.entity_id==='switch.yuka_front').state='unavailable';await page.request.get(url+'/api/settings/ha?refresh=1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect(choice).toBeDisabled();await expect(choice).toHaveAttribute('aria-pressed','false');await expect(page.getByRole('button',{name:'Start i valgte zoner',exact:true})).toBeDisabled();expect(posts).toEqual([]);
});

test('Failed robot commands show a persistent local error, keep real status, and recover on retry',async({page})=>{
 await open(page);await page.clock.install();serviceFailure=true;await page.getByRole('button',{name:'Start rengøring',exact:true}).click();await expect(page.locator('.rp-feedback-error')).toContainText('Home Assistant');await expect(page.locator('.rp-status')).toHaveText('Ved stationen');await expect(page.getByRole('button',{name:'Start rengøring',exact:true})).toBeEnabled();await page.clock.fastForward(7000);await expect(page.locator('.rp-feedback-error')).toBeVisible();expect(posts).toEqual([]);
 serviceFailure=false;await page.getByRole('button',{name:'Start rengøring',exact:true}).click();await expect(page.locator('.rp-status')).toHaveText('Gør rent');await expect(page.locator('.rp-feedback-success')).toBeVisible();await page.clock.fastForward(6001);await expect(page.locator('.rp-feedback')).toHaveCount(0);expect(posts).toHaveLength(1);
});

test('Primary robot actions retain readable text contrast in both appearances',async({page})=>{
 await open(page);for(const mode of ['day','night']){await setAppearance(page,mode);const contrast=await page.locator('[data-rp-action=start]').evaluate(el=>{const style=getComputedStyle(el),lum=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0),a=lum(style.color),b=lum(style.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});expect(contrast).toBeGreaterThanOrEqual(4.5);}
});
