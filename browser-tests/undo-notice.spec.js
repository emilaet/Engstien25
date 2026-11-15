import {test,expect} from './fixtures.js';
import {defaultLayout} from '../src/dashboard-layout.js';

test('Removal feedback expires after six seconds across re-renders, while undo remains in the list menu',async({page})=>{
 await page.clock.install();await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(layout=>localStorage.setItem('engstien-home-layout-v3',JSON.stringify(layout)),defaultLayout().map(w=>w.id==='house'?{...w,visible:false}:w));await page.setViewportSize({width:834,height:1194});await page.goto('/');
 const item=page.getByRole('checkbox',{name:'Havremælk',exact:true}),options=page.getByRole('button',{name:'Indstillinger for Handleliste',exact:true}),notice=page.getByRole('button',{name:'Fortryd fjernelse',exact:true});
 await item.check();await options.click();await page.getByRole('menuitem',{name:'Fjern købte',exact:true}).click();await expect(notice).toBeVisible();await page.clock.pauseAt(await page.evaluate(()=>Date.now())+100);
 await page.clock.fastForward(3000);const task=page.locator('.tasks-card input[data-item]').first();await task.setChecked(!await task.isChecked());await expect(notice).toBeVisible();
 await page.clock.fastForward(3001);await expect(notice).toBeHidden();await expect(page.locator('.family-feedback-message')).toBeEmpty();
 await options.click();await page.getByRole('menuitem',{name:'Fortryd seneste fjernelse',exact:true}).click();await expect(item).toBeChecked();await expect(notice).toBeHidden();
 await options.click();await page.getByRole('menuitem',{name:'Fjern købte',exact:true}).click();await page.clock.fastForward(5000);await notice.click();await expect(item).toBeChecked();
 await options.click();await page.getByRole('menuitem',{name:'Fjern købte',exact:true}).click();await page.clock.fastForward(1500);await expect(notice).toBeVisible();await page.clock.fastForward(4501);await expect(notice).toBeHidden();
});
