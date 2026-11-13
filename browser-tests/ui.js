import {expect} from './fixtures.js';
export async function openOptions(page){if(!await page.locator('#home-options-menu').isVisible())await page.locator('#home-options').click();}
export async function closeOptions(page){if(await page.locator('#home-options-menu').isVisible())await page.locator('#home-options').click();}
export async function modelOption(page,name){await openOptions(page);await page.getByRole('button',{name,exact:true}).click();if(!await page.locator('dialog[open]').count())await closeOptions(page);}
export async function selectFurniture(page,id){const picker=page.locator('.furniture-picker');if(!await picker.evaluate(el=>el.open))await picker.locator('summary').click();await page.locator(`[data-furniture=${id}]`).click();}
export async function chargeScenario(page,value){const details=page.locator('.charge-advanced');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await page.getByLabel('Ladetilstand i demo').selectOption(value);}
export async function wasteScenario(page,value){const details=page.locator('.waste-calendar');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await page.getByLabel('Affaldsscenarie').selectOption(value);}
export async function clearList(page,key){await page.getByRole('button',{name:'Indstillinger for '+(key==='tasks'?'Huskeliste':'Handleliste'),exact:true}).click();await page.getByRole('menuitem',{name:key==='tasks'?'Fjern klarede':'Fjern købte',exact:true}).click();}
export async function readyScene(page){const disclosure=page.locator('.rooms-visual-toggle');if(await disclosure.isVisible()&&await disclosure.getAttribute('aria-expanded')==='false')await disclosure.click();await expect(page.locator('#scene')).toHaveAttribute('data-render-finish','native',{timeout:30000});}
export async function selectRoom(page,id){if(!await page.locator(`[data-room="${id}"]`).isVisible()){const back=page.getByRole('button',{name:'Alle rum',exact:true});if(await back.isVisible())await back.click();}const search=page.getByRole('searchbox',{name:'Find et rum'});if(await search.isVisible())await search.fill('');await page.locator(`[data-room="${id}"]`).click();}
export async function roomTab(page,name){await page.getByRole('tab',{name:new RegExp('^'+name+'(?:\\s|$)')}).click();}

export async function editDashboard(page){await openOptions(page);await page.getByRole('button',{name:'Rediger dashboard',exact:true}).click();}
export async function openSettings(page,section='Overblik'){await openOptions(page);await page.getByRole('button',{name:'Indstillinger',exact:true}).click();if(section!=='Overblik')await page.getByRole('button',{name:section,exact:true}).click();}
export async function previewLayout(page){await openSettings(page,'Skærm og dashboard');await page.getByRole('button',{name:'Nyt hverdagsblik',exact:true}).click();}
export async function referenceDetails(page){const details=page.locator('.furniture-reference-more');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();}
