import {test,expect} from './fixtures.js';
import {readyScene} from './ui.js';

test('Viewer text and controls stay outside the canvas across widths, views and wrapped subtitles',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/#rooms');await readyScene(page);
 for(const viewport of [{width:1440,height:1000},{width:1194,height:834},{width:390,height:844}]){
  await page.setViewportSize(viewport);await readyScene(page);
  for(const view of ['Vis huset i 3D','Vis plantegning ovenfra','Vis hele huset udefra']){
   await page.getByRole('button',{name:view,exact:true}).click();
   // Also exercise a subtitle that wraps on a narrow viewer.
   await page.locator('.model-subtitle').evaluate(el=>{el.textContent='Valgt rum: Bad ved soveværelse · styr enhederne til højre.';});
   const layout=await page.locator('.model-card').evaluate(card=>{
    const rect=el=>{const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right};};
    return {card:rect(card),heading:rect(card.querySelector('.model-heading')),subtitle:rect(card.querySelector('.model-subtitle')),canvas:rect(card.querySelector('#scene')),legend:rect(card.querySelector('.light-legend')),controls:rect(card.querySelector('.view-controls')),footer:rect(card.querySelector('.model-footer'))};
   });
   expect(layout.heading.bottom).toBeLessThanOrEqual(layout.canvas.top);
   expect(layout.subtitle.bottom).toBeLessThanOrEqual(layout.canvas.top);
   expect(layout.legend.top).toBeGreaterThanOrEqual(layout.canvas.bottom);
   expect(layout.controls.top).toBeGreaterThanOrEqual(layout.canvas.bottom);
   expect(layout.controls.right).toBeLessThanOrEqual(layout.card.right);expect(layout.controls.left).toBeGreaterThanOrEqual(layout.card.left);
   expect(layout.footer.bottom).toBeLessThanOrEqual(layout.card.bottom);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
});

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
   await expect.poll(async()=>Number(await page.locator('#scene').getAttribute('data-overview-extent'))).toBeLessThan(.98);
   expect(Number(await page.locator('#scene').getAttribute('data-camera-distance'))).toBeLessThan(300);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 }
 await page.getByLabel('Dag- og aftenvisning').selectOption('night');await expect(page.locator('#scene')).toHaveAttribute('data-appearance','dark');
 await expect(page.getByRole('button',{name:'Have',exact:true})).toBeInViewport();
});
