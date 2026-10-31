import {test,expect} from '@playwright/test';
const ids=['camera','weather','calendar','car','waste','shopping','tasks','house','lights','climate','curtains'];
async function custom(page){await page.addInitScript(ids=>{if(!localStorage.getItem('engstien-home-layout-v3'))localStorage.setItem('engstien-home-layout-v3',JSON.stringify(ids.map(id=>({id,width:3,height:3,visible:true}))))},ids);await page.goto('/');await expect(page.locator('.dashboard-widget')).toHaveCount(11);}
async function edit(page){await page.locator('#home-options').click();await page.getByRole('button',{name:'Rediger dashboard',exact:true}).click();}
test('All eleven widgets contain their content across narrow, wide, short and tall saved sizes',async({page})=>{
 test.setTimeout(240_000);await custom(page);const failures=[];
 for(const [vw,vh]of [[1194,834],[834,1194],[390,844]]){await page.setViewportSize({width:vw,height:vh});
  for(const width of [3,4,6,8,12])for(const height of [2,3,4,5,7,9]){
   await page.locator('.dashboard-widget').evaluateAll((cards,size)=>cards.forEach(c=>{c.style.setProperty('--widget-width',size.width);c.style.setProperty('--widget-height',size.height)}),{width,height});await page.evaluate(()=>new Promise(requestAnimationFrame));
   const issues=await page.locator('.dashboard-widget').evaluateAll(cards=>cards.flatMap(c=>{const r=c.getBoundingClientRect(),errors=[];if(c.scrollWidth>c.clientWidth+1)errors.push('horizontal overflow');for(const el of c.querySelectorAll('button,input,select,.home-car-meta,.home-car-progress,#charge-summary,.hw-event')){if(!el.getClientRects().length)continue;const b=el.getBoundingClientRect();if(b.width>r.width+1||b.left<r.left-1||b.right>r.right+1)errors.push(el.className||el.id||el.tagName);}return errors.length?[{id:c.dataset.widgetId,errors}]:[]}));
   if(issues.length)failures.push({vw,width,height,issues});if(vw===1194&&width>=6&&height===2)expect(await page.locator('.dashboard-widget.weather-card').evaluate(c=>c.scrollHeight<=c.clientHeight+1)).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(failures).toEqual([]);
});
test('Compact Tesla retains charging information and compact calendar and weather actions remain usable',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await custom(page);
 await expect(page.locator('#charge-summary')).toContainText('80');await expect(page.locator('.home-car-meta')).toContainText('kW');await expect(page.locator('.home-car-meta')).toContainText(/min/);
 const calendar=page.locator('.calendar-card');await calendar.getByRole('button',{name:/Se hele ugen/}).click();await expect(page.locator('.hw-calendar-dialog')).toBeVisible();await page.keyboard.press('Escape');
 const weather=page.locator('.dashboard-widget.weather-card');await weather.getByRole('button',{name:'Skift vejrudsigt til time for time'}).click();await expect(weather.locator('.hw-day')).toHaveCount(6);expect(await weather.evaluate(c=>c.scrollWidth<=c.clientWidth+1)).toBe(true);await weather.getByRole('button',{name:'Se timer'}).click();await expect(page.locator('.hw-weather-dialog')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('#car-summary').click();await expect(page.locator('#rooms-workspace')).toHaveAttribute('data-view','charger');
});
test('Editor keeps the actual preview width and supports size presets, undo, redo, visibility and cancellation',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await custom(page);const before=await page.locator('.family-grid').boundingBox();await edit(page);const after=await page.locator('.family-grid').boundingBox();expect(Math.abs(before.width-after.width)).toBeLessThan(18);
 await page.locator('.layout-editor [data-widget-select=calendar]').click();await page.getByRole('button',{name:'Bred',exact:true}).click();await expect(page.getByLabel('Bredde for Familiens kalender',{exact:true})).toHaveValue('6');await page.getByRole('button',{name:'Fortryd layoutændring'}).click();await expect(page.getByLabel('Bredde for Familiens kalender',{exact:true})).toHaveValue('3');await page.getByRole('button',{name:'Gentag layoutændring'}).click();await expect(page.getByLabel('Bredde for Familiens kalender',{exact:true})).toHaveValue('6');
 await page.getByRole('checkbox',{name:'Vis Familiens kalender på Hjem',exact:true}).uncheck();await page.getByRole('button',{name:'Fortryd layoutændring'}).click();await expect(page.getByRole('checkbox',{name:'Vis Familiens kalender på Hjem',exact:true})).toBeChecked();await page.getByRole('button',{name:'Annuller',exact:true}).click();await expect(page.locator('[data-widget-id=calendar]')).toHaveCSS('grid-column-start','span 3');
 await edit(page);await expect(page.getByRole('button',{name:'Fortryd layoutændring'})).toBeDisabled();await page.keyboard.press('Escape');await expect(page.locator('#home-options')).toBeFocused();
});
test('Phone editor has reachable controls and saves compact choices without page overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await custom(page);await edit(page);await page.locator('.layout-editor [data-widget-select=car]').click();await page.getByRole('button',{name:'Kompakt',exact:true}).click();await page.getByRole('button',{name:'Gem dashboard',exact:true}).click();await page.reload();await expect(page.locator('#car-summary')).toContainText('80');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await edit(page);
 for(const name of ['Fortryd layoutændring','Gentag layoutændring','Gem dashboard']){const b=await page.getByRole('button',{name,exact:true}).boundingBox();expect(b.width).toBeGreaterThan(40);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(390);}
});

test('Long shopping entries wrap in narrow cards and remain editable without overlapping rows',async({page})=>{
 await page.setViewportSize({width:834,height:1194});await custom(page);const text='Havremælk, grøntsager og frugt til hele familien og gæsterne i weekenden';const card=page.locator('.shopping-card');await card.getByRole('textbox',{name:'Ny vare på handlelisten'}).fill(text);await card.getByRole('button',{name:'Tilføj vare'}).click();await expect(card.getByRole('checkbox',{name:text,exact:true})).toBeVisible();
 const issues=await card.locator('.family-item').evaluateAll(rows=>rows.flatMap((row,i)=>{const box=row.getBoundingClientRect(),next=rows[i+1]?.getBoundingClientRect(),copy=row.querySelector('.family-item-copy');return next&&box.bottom>next.top+1||copy.scrollWidth>copy.clientWidth+1||copy.scrollHeight>copy.clientHeight+1?[i]:[]}));expect(issues).toEqual([]);await card.getByRole('button',{name:'Rediger '+text,exact:true}).click();await expect(page.locator('.family-edit-dialog')).toBeVisible();await page.getByRole('button',{name:'Annuller',exact:true}).click();
});
