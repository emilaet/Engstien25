import {test,expect} from './fixtures.js';

test('Approved garden and graded driveway are available in Full without changing room, plan or charger controls',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/#rooms');const scene=page.locator('#scene');
 await page.getByRole('button',{name:'Vis hele huset udefra',exact:true}).click();
 await expect(scene).toHaveAttribute('data-outdoor-visible','true');await expect(scene).toHaveAttribute('data-exterior-side','garden');
 const layout=JSON.parse(await scene.getAttribute('data-outdoor-layout'));expect(layout.driveway).toMatchObject({rise:1,run:5,slope:.2});
 await page.getByRole('button',{name:'Indkørsel',exact:true}).click();
 await expect(scene).toHaveAttribute('data-exterior-side','driveway');await expect(page.getByRole('button',{name:'Indkørsel',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Nulstil visning',exact:true}).click();await expect(scene).toHaveAttribute('data-exterior-side','driveway');
 await page.getByRole('button',{name:'Have',exact:true}).click();await expect(scene).toHaveAttribute('data-exterior-side','garden');
 await page.getByRole('button',{name:'Vis plantegning ovenfra',exact:true}).click();
 await expect(scene).toHaveAttribute('data-outdoor-visible','true');await expect(page.getByRole('group',{name:'Se udemiljøet'})).toBeHidden();
 await page.locator('[data-room=stue]').click();await expect(page.getByRole('switch',{name:'Loftslys i Stue',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(scene).toHaveAttribute('data-view','charger');await expect(scene).toHaveAttribute('data-outdoor-visible','true');
 await page.getByRole('button',{name:'Hjem',exact:true}).click();await expect(scene).toHaveAttribute('data-camera-mode','plan');await expect(scene).toHaveAttribute('data-outdoor-visible','true');expect(errors).toEqual([]);
});

test('Exterior angles remain framed and reachable on tall tablets and phones, including night mode',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:1194,height:1400});await page.goto('/#rooms');
 await page.getByRole('button',{name:'Vis hele huset udefra',exact:true}).click();
 for(const viewport of [{width:1194,height:1400},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const name of ['Indkørsel','Have']){
   const button=page.getByRole('button',{name,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
   await expect.poll(async()=>Number(await page.locator('#scene').getAttribute('data-overview-extent'))).toBeLessThan(.96);
   expect(Number(await page.locator('#scene').getAttribute('data-camera-distance'))).toBeLessThan(300);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 await page.getByLabel('Dag- og aftenvisning').selectOption('night');await expect(page.locator('#scene')).toHaveAttribute('data-appearance','dark');
 await expect(page.getByRole('button',{name:'Have',exact:true})).toBeInViewport();
});
