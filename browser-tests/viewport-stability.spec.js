import {test,expect} from '@playwright/test';

test('Checking either family list keeps the page, cards and both list scroll positions fixed',async({page})=>{
 for(const [width,height] of [[1194,834],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/');
  await expect(page.locator('.tasks-card input[type=checkbox]').first()).toBeVisible();
  for(const key of ['tasks','shopping']){
   const checkbox=page.locator(`.${key}-card input[type=checkbox]:not(:checked)`).first();
   await checkbox.scrollIntoViewIfNeeded();
   const before=await page.evaluate(()=>({y:scrollY,lists:[...document.querySelectorAll('.family-list')].map(el=>el.scrollTop),cards:[...document.querySelectorAll('.family-card')].map(el=>el.getBoundingClientRect().top)}));
   const id=await checkbox.getAttribute('data-item');await checkbox.click();
   await expect(page.locator(`input[data-item="${id}"]`)).toBeChecked();
   await page.waitForTimeout(250);
   const after=await page.evaluate(()=>({y:scrollY,lists:[...document.querySelectorAll('.family-list')].map(el=>el.scrollTop),cards:[...document.querySelectorAll('.family-card')].map(el=>el.getBoundingClientRect().top)}));
   expect(after).toEqual(before);
  }
 }
});

test('Room views start close to the house and reset consistently after charger navigation',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await page.goto('/');
 await page.getByRole('button',{name:'Rum',exact:true}).click();const scene=page.locator('#scene');
 await expect(scene).toHaveAttribute('data-camera-moving','false');await expect(scene).toHaveAttribute('data-camera-mode','3d');
 const distance=Number(await scene.getAttribute('data-camera-distance'));
 await page.screenshot({path:'/tmp/engstien-room-framing-3d.png',animations:'disabled'});
 await page.getByRole('button',{name:'Vis plantegning ovenfra',exact:true}).click();
 await expect(scene).toHaveAttribute('data-camera-mode','plan');
 const points=JSON.parse(await scene.getAttribute('data-room-points'));
 expect(points.bad1[0]).toBeLessThan(.10);expect(points.v2[0]).toBeGreaterThan(.87);
 expect(points.bad1[1]).toBeLessThan(.5);expect(points.kontor[1]).toBeGreaterThan(.5);
 await page.screenshot({path:'/tmp/engstien-room-framing-plan.png',animations:'disabled'});
 await page.getByRole('button',{name:'Vis hele huset udefra',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','full');
 await page.screenshot({path:'/tmp/engstien-room-framing-full.png',animations:'disabled'});
 await expect(scene).toHaveAttribute('data-exterior','true');
 await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-moving','false');
 await page.getByRole('button',{name:'Rum',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-moving','false');
 expect(Number(await scene.getAttribute('data-camera-distance'))).toBeCloseTo(distance,1);
});
