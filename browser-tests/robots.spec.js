import {test,expect} from './fixtures.js';
import {setAppearance,readyScene} from './ui.js';
import {createDashboardServer} from '../server/app.mjs';
import {resolve} from 'node:path';
import {robotRawStates,robotRegistry,robotStorage,mapPng} from '../tests/fixtures/robots.js';
let server,url,posts,states,offline,mapReads;
test.use({actionTimeout:10000});
test.beforeEach(async()=>{
 posts=[];states=robotRawStates();offline=false;mapReads=0;
 server=createDashboardServer({password:'robots-test-only',storage:robotStorage(),staticRoot:resolve('dist'),haUrl:'http://ha.test',haToken:'private-robot-token',registryImpl:async()=>robotRegistry(),fetchImpl:async(url,options)=>{
  if(offline)throw Error('offline');
  if(url.pathname.includes('image_proxy')){mapReads++;return new Response(mapPng,{headers:{'content-type':'image/png'}});}
  if(options.method==='POST'){
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
 await open(page);expect(mapReads).toBe(0);await page.getByRole('button',{name:'Kort',exact:true}).click();await expect(page.locator('.robot-map-panel img')).toBeVisible();expect(mapReads).toBe(1);expect(await page.locator('.robot-map-panel img').getAttribute('src')).toMatch(/^\/api\/settings\/robot-map\?/);await page.getByRole('button',{name:'Opdater kort',exact:true}).click();await expect.poll(()=>mapReads).toBe(2);states.find(e=>e.entity_id==='image.qrevo_map').last_updated=new Date().toISOString();await page.request.get(url+'/api/settings/ha?refresh=1');await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await expect.poll(()=>mapReads).toBe(3);await page.getByRole('button',{name:'3D',exact:true}).click();await expect(page.locator('#scene')).toBeVisible();
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
