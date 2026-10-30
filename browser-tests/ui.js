import {expect} from '@playwright/test';
export async function openOptions(page){if(!await page.locator('#home-options-menu').isVisible())await page.locator('#home-options').click();}
export async function closeOptions(page){if(await page.locator('#home-options-menu').isVisible())await page.locator('#home-options').click();}
export async function modelOption(page,name){await openOptions(page);await page.getByRole('button',{name,exact:true}).click();if(!await page.locator('dialog[open]').count())await closeOptions(page);}
export async function graphicsProfile(page,value){await openOptions(page);await page.getByLabel('Grafikkvalitet').selectOption(value);await closeOptions(page);}
export async function selectFurniture(page,id){const picker=page.locator('.furniture-picker');if(!await picker.evaluate(el=>el.open))await picker.locator('summary').click();await page.locator(`[data-furniture=${id}]`).click();}
export async function chargeScenario(page,value){const details=page.locator('.charge-advanced');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await page.getByLabel('Ladetilstand i demo').selectOption(value);}
export async function wasteScenario(page,value){const details=page.locator('.waste-calendar');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await page.getByLabel('Affaldsscenarie').selectOption(value);}
export async function clearList(page,key){const details=page.locator(`.${key}-card .list-card-menu`);if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await details.getByRole('button',{name:key==='tasks'?'Fjern klarede':'Fjern købte',exact:true}).click();}
export async function readyScene(page){await expect(page.locator('#scene')).toHaveAttribute('data-render-finish','native',{timeout:30000});}
