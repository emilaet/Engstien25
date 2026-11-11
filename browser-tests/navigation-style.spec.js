import {test,expect} from '@playwright/test';

const selected=page=>page.locator('.rail .nav.active');
async function aligned(page){
 await expect.poll(async()=>page.locator('.rail nav').evaluate(nav=>{
  const a=nav.querySelector('.nav.active').getBoundingClientRect(),b=nav.querySelector('.nav-selection').getBoundingClientRect();
  return Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height));
 })).toBeLessThan(1);
}
test('existing menu appearance stays intact while the selection moves in every direction',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('engstien-appearance-v1','day'));
 await page.goto('/');await expect(selected(page)).toHaveAttribute('data-tab','home');
 const rail=page.locator('.rail');const initial=await rail.boundingBox();
 await expect(rail).toHaveCSS('background-color','rgb(253, 252, 248)');
 await expect(page.locator('.nav-selection')).toHaveCSS('background-color','rgb(48, 62, 53)');
 for(const name of ['Billader','Rum','Hjem']){
  await page.getByRole('button',{name,exact:true}).first().click();
  await expect(selected(page)).toHaveAttribute('aria-current','page');await aligned(page);
  expect(await rail.boundingBox()).toEqual(initial);
 }
 await page.getByLabel('Dag- og aftenvisning').selectOption('night');
 await expect(rail).toHaveCSS('background-color','rgb(35, 39, 37)');
 await expect(page.locator('.nav-selection')).toHaveCSS('background-color','rgb(227, 232, 222)');
 await aligned(page);
});

test('selection follows mobile navigation and repeated changes without leaving a stale highlight',async({page})=>{
 await page.goto('/');await expect(page.locator('.nav-selection')).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 for(const name of ['Billader','Hjem','Rum','Hjem']){
  await page.locator('.rail').getByRole('button',{name,exact:true}).click();
 }
 await expect(selected(page)).toHaveAttribute('data-tab','home');await aligned(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.setViewportSize({width:1440,height:1000});await aligned(page);
});

test('reduced motion disables both selection travel and page entrance animation',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await expect(page.locator('.nav-selection')).toBeVisible();
 await page.locator('.rail').getByRole('button',{name:'Rum',exact:true}).click();
 await aligned(page);
 await expect(page.locator('.nav-selection')).toHaveCSS('transition-duration','0s');
 expect(await page.locator('#rooms-workspace').evaluate(e=>e.getAnimations().length)).toBe(0);
 await page.locator('.rail .nav[data-tab=home]').focus();await page.keyboard.press('Enter');
 await expect(selected(page)).toHaveAttribute('data-tab','home');await aligned(page);
});
