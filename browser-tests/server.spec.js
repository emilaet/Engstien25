import {test,expect} from '@playwright/test';
import {createDashboardServer} from '../server/app.mjs';
import {resolve} from 'node:path';
let server,url;
test.beforeAll(async()=>{
 const map=new Map(),storage={get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 server=createDashboardServer({password:'ephemeral-browser-test',storage,staticRoot:resolve('dist'),haUrl:'http://ha.local',haToken:'test-only',entities:{battery:'battery',status:'status'},fetchImpl:async u=>({ok:true,json:async()=>({state:u.pathname.endsWith('battery')?'57':'on',last_reported:new Date().toISOString()})})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;
});
test.afterAll(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
test('Built dashboard connects to actual server, restores its session, and keeps live commands locked',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByRole('button',{name:'Datakilder',exact:true}).click();await expect(page.locator('.integration-dialog form')).toBeVisible();await page.locator('.integration-dialog input').fill('ephemeral-browser-test');await page.getByRole('button',{name:'Forbind til server'}).click();await expect(page.locator('.connection-result')).toContainText('Fælles lister er tilsluttet');await page.getByRole('button',{name:'Luk forbindelser'}).click();await expect(page.locator('.family-bottom')).toContainText('dashboardserveren');await page.getByRole('textbox',{name:'Ny vare på handlelisten'}).fill('Fra lokal server');await page.getByRole('button',{name:'Tilføj vare'}).click();await page.reload();await expect(page.locator('.family-bottom')).toContainText('dashboardserveren');await expect(page.getByRole('checkbox',{name:'Fra lokal server',exact:true})).toBeVisible();await page.getByRole('button',{name:'Billader',exact:true}).click();await expect(page.locator('.charge-number')).toHaveText('57%');await expect(page.getByRole('switch',{name:'Opladning',exact:true})).toBeDisabled();await expect(page.getByRole('slider',{name:'Oplad til'})).toBeDisabled();await expect(page.locator('.charge-details')).toContainText('Mangler data');await expect(page.locator('.charge-details')).toContainText('— kW');await expect(page.locator('.light-legend')).toContainText('Ingen bekræftet opladning');expect(errors).toEqual([]);
});
