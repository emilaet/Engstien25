import {test,expect} from '@playwright/test';
test('Hjem is the family landing page; Rum retains the existing house controls and browser history',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{name:'Hjem',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Huskeliste',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Handleliste',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Tømmekalender',exact:true})).toBeVisible();await expect(page.locator('#scene canvas')).toHaveCount(0);
 await page.screenshot({path:'/tmp/engstien-family-home.png'});
 await page.getByRole('button',{name:'Åbn Rum'}).click();await expect(page.locator('#scene canvas')).toBeVisible();await expect(page.getByRole('heading',{name:'Rum',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Sluk alt lys i huset'}).click();await page.getByRole('button',{name:'Hjem',exact:true}).click();await expect(page.getByRole('heading',{name:'Hjem',exact:true})).toBeVisible();await expect(page.locator('#rooms-workspace')).toBeHidden();
 await page.goBack();await expect(page.locator('#scene canvas')).toBeVisible();await expect(page.locator('#light-count')).toHaveText('0 / 14');expect(errors).toEqual([]);
});
test('Tasks and Apple Notes demo shopping list support adding, completing and clearing without HTML injection',async({page})=>{
 await page.goto('/');const task=page.getByRole('textbox',{name:'Nyt punkt på huskelisten'}),shop=page.getByRole('textbox',{name:'Ny vare på handlelisten'});
 await shop.fill('Gem denne kladde');await task.fill('Husk cykellygter');await page.getByRole('button',{name:'Tilføj huskepunkt'}).click();await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toBeVisible();await expect(task).toHaveValue('');await expect(shop).toHaveValue('Gem denne kladde');
 await shop.fill('<img src=x onerror="window.injected=true">');await page.getByRole('button',{name:'Tilføj vare'}).click();const item=page.getByRole('checkbox',{name:'<img src=x onerror="window.injected=true">',exact:true});await expect(item).toBeVisible();expect(await page.evaluate(()=>window.injected)).toBeUndefined();
 await page.getByRole('checkbox',{name:'Husk cykellygter'}).focus();await page.keyboard.press('Space');await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toBeChecked();await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toBeFocused();await page.getByRole('checkbox',{name:'Havremælk',exact:true}).check();await page.reload();await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toBeChecked();await expect(page.getByRole('checkbox',{name:'Havremælk',exact:true})).toBeChecked();
 await page.getByRole('button',{name:'Fjern købte'}).click();await expect(page.getByRole('checkbox',{name:'Havremælk',exact:true})).toHaveCount(0);await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toBeChecked();
 await page.getByRole('button',{name:'Fjern klarede'}).click();await expect(page.getByRole('checkbox',{name:'Husk cykellygter'})).toHaveCount(0);await expect(item).toBeVisible();
});
test('Renosyd example schedule uses loaded category pictograms and explains sources',async({page})=>{
 await page.goto('/');await expect(page.locator('.source-badge').filter({hasText:'Renosyd · eksempeldata'})).toBeVisible();await expect(page.locator('.next-collection')).toContainText('I morgen');
 await expect(page.locator('.next-collection img[alt="Restaffald"]')).toBeVisible();await expect(page.locator('.next-collection img[alt="Madaffald"]')).toBeVisible();await expect(page.locator('.collection-row')).toHaveCount(3);
 expect(await page.locator('.waste-card img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBeTruthy();await expect(page.locator('.waste-note')).toContainText('Renosyd er ikke tilsluttet');
 await page.getByRole('button',{name:'Datakilder og ikoner'}).click();await expect(page.locator('.family-source-dialog')).toBeVisible();await expect(page.locator('.family-source-dialog')).toContainText('Apple Noter');await page.getByRole('button',{name:'Forstået',exact:true}).click();await expect(page.locator('.family-source-dialog')).toBeHidden();
});
test('Family dashboard works on landscape tablet and mobile with usable list entry',async({page})=>{
 for(const [width,height] of [[1024,768],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/');await expect(page.getByRole('heading',{name:'Handleliste',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.getByRole('textbox',{name:'Ny vare på handlelisten'}).fill('Æbler');await page.getByRole('button',{name:'Tilføj vare'}).click();await expect(page.getByRole('checkbox',{name:'Æbler',exact:true}).first()).toBeVisible();
  await page.screenshot({path:`/tmp/engstien-family-${width}.png`,fullPage:true});
 }
});
