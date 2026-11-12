import {test,expect} from './fixtures.js';

test('Desktop checkmarks and phone Notes updates keep the page, cards and both list scroll positions fixed',async({page})=>{
 for(const [width,height] of [[1194,834],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/');
  await expect(page.locator('.tasks-card input[type=checkbox]').first()).toBeVisible();
  let notes={version:1,tasks:[{text:'Pak tasken',done:false},{text:'Vand planter',done:false}],shopping:[{text:'Havremælk',done:false},{text:'Brød',done:false}]};
  const importNotes=()=>page.getByLabel('Indlæs eksport fra Apple Noter').setInputFiles({name:'noter.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(notes))});
  if(width<760){await importNotes();await expect(page.locator('.tasks-card')).toContainText('Pak tasken');}
  for(const key of ['tasks','shopping']){
   const checkbox=page.locator(`.${key}-card input[type=checkbox]:not(:checked)`).first();
   await checkbox.scrollIntoViewIfNeeded();
   const before=await page.evaluate(()=>({y:scrollY,lists:[...document.querySelectorAll('.family-list')].map(el=>el.scrollTop),cards:[...document.querySelectorAll('.family-card')].map(el=>el.getBoundingClientRect().top)}));
   const id=await checkbox.getAttribute('data-item');
   if(width<760){await expect(checkbox).toBeDisabled();notes[key][0].done=true;await importNotes();}else await checkbox.click();
   await expect(page.locator(`input[data-item="${id}"]`)).toBeChecked();
   await page.waitForTimeout(250);
   const after=await page.evaluate(()=>({y:scrollY,lists:[...document.querySelectorAll('.family-list')].map(el=>el.scrollTop),cards:[...document.querySelectorAll('.family-card')].map(el=>el.getBoundingClientRect().top)}));
   expect(after).toEqual(before);
  }
 }
});

test('Room views focus closely on the house with the garden still rendered and reset after charger navigation',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await page.goto('/');
 await page.getByRole('button',{name:'Rum',exact:true}).click();const scene=page.locator('#scene');
 await expect(scene).toHaveAttribute('data-camera-moving','false');await expect(scene).toHaveAttribute('data-camera-mode','3d');
 const distance=Number(await scene.getAttribute('data-camera-distance'));
 await page.screenshot({path:'/tmp/engstien-room-framing-3d.png',animations:'disabled'});
 await page.getByRole('button',{name:'Vis plantegning ovenfra',exact:true}).click();
 await expect(scene).toHaveAttribute('data-camera-mode','plan');
 const points=JSON.parse(await scene.getAttribute('data-room-points'));
 // The main house fills the plan; the outdoor environment stays rendered around it.
 await expect(scene).toHaveAttribute('data-outdoor-visible','true');
 expect(points.bad1[0]).toBeLessThan(.10);expect(points.v2[0]).toBeGreaterThan(.87);
 expect(points.v2[0]-points.bad1[0]).toBeGreaterThan(.77);
 expect(points.bad1[1]).toBeLessThan(points.kontor[1]);
 for(const point of Object.values(points)){expect(point[0]).toBeGreaterThan(0);expect(point[0]).toBeLessThan(1);expect(point[1]).toBeGreaterThan(0);expect(point[1]).toBeLessThan(1);}
 await page.screenshot({path:'/tmp/engstien-room-framing-plan.png',animations:'disabled'});
 await page.getByRole('button',{name:'Vis hele huset udefra',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','full');
 await page.screenshot({path:'/tmp/engstien-room-framing-full.png',animations:'disabled'});
 await expect(scene).toHaveAttribute('data-exterior','true');
 await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-moving','false');
 await page.getByRole('button',{name:'Rum',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-moving','false');
 expect(Number(await scene.getAttribute('data-camera-distance'))).toBeCloseTo(distance,1);
});


test('Selecting Plan again and resetting keep its close default instead of switching to 3D',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#rooms');const scene=page.locator('#scene');await expect(scene).toHaveAttribute('data-render-finish','native');await page.getByRole('button',{name:'Vis plantegning ovenfra',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','plan');const original=await scene.getAttribute('data-room-points');
 await page.getByRole('button',{name:'Zoom ind',exact:true}).click();await expect.poll(()=>scene.getAttribute('data-room-points')).not.toBe(original);await page.getByRole('button',{name:'Vis plantegning ovenfra',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','plan');await expect(scene).toHaveAttribute('data-room-points',original);
 await page.getByRole('button',{name:'Zoom ind',exact:true}).click();await expect.poll(()=>scene.getAttribute('data-room-points')).not.toBe(original);await page.getByRole('button',{name:'Nulstil visning',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','plan');await expect(scene).toHaveAttribute('data-room-points',original);await expect(scene).toHaveAttribute('data-carport-roof','false');await expect(scene).toHaveAttribute('data-outdoor-visible','true');
});
