import {test,expect} from '@playwright/test';
test('Navigation has one Rum entry, and legacy light/heat links still open room controls',async({page})=>{
 await page.goto('/');await expect(page.locator('.rail .nav')).toHaveCount(3);await expect(page.getByRole('button',{name:'Rum',exact:true})).toHaveCount(1);await expect(page.getByRole('button',{name:'Billader',exact:true})).toHaveCount(1);await expect(page.locator('.nav[data-tab="lights"],.nav[data-tab="heat"]')).toHaveCount(0);
 await page.locator('#lights-summary').click();await expect(page.getByRole('heading',{name:'Rum',exact:true})).toBeVisible();await page.locator('[data-room="stue"]').click();await page.locator('[data-room-details="stue"]').click();await expect(page.getByRole('switch',{name:'Loftslys'})).toBeVisible();await expect(page.getByRole('button',{name:'Hæv temperatur'})).toBeVisible();
 await page.goto('/#heat');await expect(page.getByRole('heading',{name:'Rum',exact:true})).toBeVisible();
});
test('Billader smoothly focuses the mounted charger, pulses while charging and returns to the house',async({page})=>{
 // Software-rendered CI can take longer per frame; retain the multi-frame flight checks.
 test.setTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.getByRole('button',{name:'Rum',exact:true}).click();const scene=page.locator('#scene');
 const far=Number(await scene.getAttribute('data-camera-distance'));
 const started=await page.evaluate(()=>{
  const scene=document.querySelector('#scene');window.flightDistances=[];
  const observer=new MutationObserver(()=>{if(scene.dataset.cameraMoving==='true')window.flightDistances.push(Number(scene.dataset.cameraDistance));});observer.observe(scene,{attributes:true,attributeFilter:['data-camera-distance']});
  document.querySelector('.nav[data-tab="car"]').click();return scene.dataset.cameraMoving;
 });expect(started).toBe('true');await expect(scene).toHaveAttribute('data-view','charger');
 await expect.poll(async()=>Number(await scene.getAttribute('data-camera-distance')),{timeout:15000}).toBeLessThan(far-1);await expect(scene).toHaveAttribute('data-camera-moving','false',{timeout:25000});expect(await page.evaluate(far=>new Set(window.flightDistances.filter(d=>d>3&&d<far-1)).size,far)).toBeGreaterThan(5);
 await expect.poll(async()=>Number(await scene.getAttribute('data-camera-distance'))).toBeLessThan(3);await expect(page.locator('.house-light-controls')).toBeHidden();await expect(page.locator('#plan-view')).toBeHidden();await expect(page.locator('.room-label:visible')).toHaveCount(0);
 // Observe rendered frames, rather than assuming a software GPU draws every 170 ms.
 const samples=[];for(let i=0;i<3;i++){const frame=await scene.getAttribute('data-render-count');await expect.poll(()=>scene.getAttribute('data-render-count'),{timeout:10000}).not.toBe(frame);samples.push(Number(await scene.getAttribute('data-charger-pulse')));}expect(new Set(samples).size).toBeGreaterThan(1);
 await page.screenshot({path:'/tmp/engstien-charger-closeup.png'});
 await page.getByRole('switch',{name:'Opladning',exact:true}).click();await expect.poll(async()=>Number(await scene.getAttribute('data-charger-pulse'))).toBe(0);await expect(page.locator('.charge-details')).toContainText('På pause');
 await page.getByRole('button',{name:'Rum',exact:true}).click();await expect(scene).toHaveAttribute('data-view','rooms');await expect(scene).toHaveAttribute('data-camera-moving','false',{timeout:25000});await expect.poll(async()=>Number(await scene.getAttribute('data-camera-distance'))).toBeGreaterThan(20);await expect(page.locator('.house-light-controls')).toBeVisible();expect(errors).toEqual([]);
});
test('Direct charger link, plan-to-charger transition and reduced motion work on tablet',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1024,height:768});await page.goto('/#car');const scene=page.locator('#scene');await expect(scene).toHaveAttribute('data-camera-moving','false');await expect(page.getByRole('heading',{name:'Billader',exact:true}).first()).toBeVisible();
 const value=await scene.getAttribute('data-charger-pulse');await page.waitForTimeout(200);await expect(scene).toHaveAttribute('data-charger-pulse',value);await expect(scene).toHaveAttribute('data-charger-pulse','1.000');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Rum',exact:true}).click();await page.getByRole('button',{name:'Vis plantegning ovenfra'}).click();await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-moving','false',{timeout:25000});await expect.poll(async()=>Number(await scene.getAttribute('data-camera-distance'))).toBeLessThan(3);await page.screenshot({path:'/tmp/engstien-charger-tablet.png'});
});
