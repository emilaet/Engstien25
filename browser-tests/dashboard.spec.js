import {openOptions,closeOptions,modelOption,graphicsProfile,selectFurniture,chargeScenario,wasteScenario,clearList,readyScene} from './ui.js';
import {test,expect} from '@playwright/test';
async function roomPoint(page,id){
 await expect.poll(()=>page.locator('#scene').getAttribute('data-room-points')).toBeTruthy();
 return page.locator('#scene').evaluate((host,key)=>{const [x,y]=JSON.parse(host.dataset.roomPoints)[key],r=host.querySelector('canvas').getBoundingClientRect();return {x:r.x+x*r.width,y:r.y+y*r.height};},id);
}
test('3D dashboard renders and room controls persist independently',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Rum',exact:true}).click();await expect(page.locator('#scene canvas')).toBeVisible();await expect(page.locator('.room-label')).toHaveCount(0);await page.screenshot({path:'/tmp/engstien-dashboard.png'});
 await page.locator('[data-room="stue"]').click();await page.locator('[data-room-details="stue"]').click();await expect(page.getByRole('heading',{name:'Stue',exact:true})).toBeVisible();const loft=page.getByRole('switch',{name:'Loftslys'}),lamp=page.getByRole('switch',{name:'Gulvlampe'});await expect(loft).toHaveAttribute('aria-checked','true');await loft.click();await expect(loft).toHaveAttribute('aria-checked','false');await expect(lamp).toHaveAttribute('aria-checked','true');
 await page.getByRole('button',{name:'Hæv temperatur'}).click();await expect(page.locator('.stepper b')).toHaveText('22,5 °C');await page.reload();await page.locator('[data-room="stue"]').click();await page.locator('[data-room-details="stue"]').click();await expect(page.locator('.stepper b')).toHaveText('22,5 °C');await expect(page.getByRole('switch',{name:'Loftslys'})).toHaveAttribute('aria-checked','false');
 await expect(page.getByRole('slider',{name:'Stort vinduesparti'})).toBeVisible();await page.locator('.nav[data-tab="car"]').click();await expect(page.getByRole('heading',{name:'Opladning',exact:true})).toBeVisible();await page.getByRole('switch',{name:'Opladning',exact:true}).click();await expect(page.locator('.charge-controls')).toContainText('På pause');
 await page.getByRole('button',{name:'Rum',exact:true}).click();await page.getByRole('button',{name:'Zoom ind'}).click();await page.getByRole('button',{name:'Nulstil visning'}).click();await modelOption(page,'Sådan bruger du huset');await expect(page.locator('#help-dialog')).toBeVisible();await page.getByRole('button',{name:'Forstået'}).click();expect(errors).toEqual([]);
});
test('Landscape tablet and mobile have no horizontal overflow',async({page})=>{for(const [w,h] of [[1024,768],[390,844]]){await page.setViewportSize({width:w,height:h});await page.goto('/');await page.getByRole('button',{name:'Rum',exact:true}).click();await expect(page.locator('#scene canvas')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}});
test('Floor tap selects and expands the room without changing lights; drag does not select',async({page})=>{
 await page.goto('/#rooms');const {x,y}=await roomPoint(page,'stue');
 const lights=()=>page.evaluate(async()=>(await import('/src/home-data.js')).createDemoHome().load().stue.lights);const before=await lights();await page.mouse.click(x,y);await expect(page.locator('#scene')).toHaveAttribute('data-selected-room','stue');await expect(page.getByRole('button',{name:'Vis enheder i Stue',exact:true})).toHaveAttribute('aria-expanded','true');await expect(page.locator('[data-room-card=stue]')).toHaveClass(/is-selected/);await expect(page.getByRole('switch',{name:'Loftslys i Stue',exact:true})).toBeInViewport();expect(await lights()).toEqual(before);
 await page.mouse.click(x,y);await expect(page.locator('#devices-stue')).toBeVisible();expect(await lights()).toEqual(before);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y+40,{steps:8});await page.mouse.up();expect(await lights()).toEqual(before);await expect(page.locator('#scene')).toHaveAttribute('data-selected-room','stue');
 await page.getByRole('button',{name:'Nulstil visning'}).click();await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(800);await page.mouse.up();await expect(page.getByRole('switch',{name:'Loftslys i Stue',exact:true})).toBeVisible();expect(await lights()).toEqual(before);
});
test('Empty architectural model supports overhead plan and full wall inspection',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Rum',exact:true}).click();
 await modelOption(page,'Vis eller skjul møbler');
 const plan=page.getByRole('button',{name:'Vis plantegning ovenfra'}),walls=page.getByRole('button',{name:'Vis vægge i fuld højde'});
 await plan.click();await expect(plan).toHaveAttribute('aria-pressed','true');await page.waitForTimeout(700);
 await page.screenshot({path:'/tmp/engstien-corrected-plan.png'});
 await modelOption(page,'Vis vægge i fuld højde');await expect(walls).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Vis vægge i fuld højde',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Nulstil visning'}).click();await expect(plan).toHaveAttribute('aria-pressed','false');await page.waitForTimeout(700);
 await page.screenshot({path:'/tmp/engstien-corrected-full.png'});
 await modelOption(page,'Vis vægge i fuld højde');await expect(walls).toHaveAttribute('aria-pressed','false');await page.waitForTimeout(700);
 await page.screenshot({path:'/tmp/engstien-corrected-cutaway.png'});expect(errors).toEqual([]);
});

test('Room selection uses the sidebar without overlay labels',async({page})=>{
 await page.goto('/#rooms');await expect(page.locator('#scene canvas')).toBeVisible();
 await page.locator('[data-room="stue"]').click();
 await expect(page.locator('[data-room-card=stue]')).toHaveClass(/is-selected/);
 await expect(page.locator('#devices-stue')).toBeVisible();
 await expect(page.locator('.room-label')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Vis eller skjul rumnavne'})).toHaveCount(0);
 await page.reload();await expect(page.locator('.room-label')).toHaveCount(0);
});
test('Whole-house light buttons cover partial lamp states, persist and leave other devices unchanged',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Rum',exact:true}).click();const on=page.getByRole('button',{name:'Tænd alt lys i huset'}),off=page.getByRole('button',{name:'Sluk alt lys i huset'});
 const devices=()=>page.evaluate(async()=>Object.values((await import('/src/home-data.js')).createDemoHome().load()).map(({lights,...rest})=>rest));const before=await devices();
 await off.click();await expect(off).toBeDisabled();await expect(on).toBeEnabled();await expect(page.locator('#light-count')).toHaveText('0 / 14');
 await expect(page.locator('.room-row[data-light-state="off"]')).toHaveCount(14);await expect(page.locator('.room-label:visible')).toHaveCount(0);
 await page.getByRole('button',{name:'Vis plantegning ovenfra'}).click();await page.waitForTimeout(300);await page.screenshot({path:'/tmp/engstien-all-lights-off.png'});
 await on.click();await expect(on).toBeDisabled();await expect(off).toBeEnabled();await expect(page.locator('#light-count')).toHaveText('14 / 14');await expect(page.locator('.room-row[data-light-state="on"]')).toHaveCount(14);
 await page.waitForTimeout(300);await page.screenshot({path:'/tmp/engstien-all-lights-on.png'});
 await page.locator('[data-room="stue"]').click();await page.locator('[data-room-details="stue"]').click();await page.getByRole('switch',{name:'Loftslys'}).click();await expect(page.locator('.room-light-summary')).toHaveText('1 af 2 lamper tændt');await expect(on).toBeEnabled();
 await page.getByRole('button',{name:'Tilbage til rum'}).click();await expect(page.locator('[data-room="stue"]')).toHaveAttribute('data-light-state','partial');await expect(page.locator('[data-room="stue"] .light-state-pill')).toHaveText('1/2 tændt');
 await off.click();expect(await devices()).toEqual(before);await page.reload();await expect(page.locator('#light-count')).toHaveText('0 / 14');await expect(page.locator('.room-row[data-light-state="off"]')).toHaveCount(14);
});
test('Full-height plan selection highlights the clicked room and scrolls its devices into the sidebar',async({page})=>{
 await page.goto('/#rooms');await page.getByRole('button',{name:'Vis plantegning ovenfra'}).click();await modelOption(page,'Vis vægge i fuld højde');await expect(page.locator('#scene')).toHaveAttribute('data-camera-distance','40.000');const point=await roomPoint(page,'kontor');await page.mouse.click(point.x,point.y);await expect(page.locator('#scene')).toHaveAttribute('data-selected-room','kontor');await expect(page.locator('[data-room-card=kontor]')).toHaveClass(/is-selected/);await expect(page.getByRole('switch',{name:'Loftslys i Kontor',exact:true})).toBeInViewport();await expect(page.locator('.room-label')).toHaveCount(0);await page.screenshot({path:'/tmp/engstien-selected-room-plan.png'});
 await page.locator('[data-room=sove]').click();await expect(page.locator('#scene')).toHaveAttribute('data-selected-room','sove');await expect(page.locator('[data-room=sove]')).toHaveAttribute('aria-current','true');await expect(page.locator('[data-room=kontor]')).toHaveAttribute('aria-current','false');await expect(page.getByRole('switch',{name:'Loftslys i Soveværelse',exact:true})).toBeInViewport();await expect(page.locator('.room-accordion.is-selected')).toHaveCount(1);await page.getByRole('button',{name:'Vis enheder i Soveværelse',exact:true}).click();await expect(page.locator('#scene')).toHaveAttribute('data-selected-room','');await expect(page.locator('.room-accordion.is-selected')).toHaveCount(0);
});
