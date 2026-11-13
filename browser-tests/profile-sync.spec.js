import {test,expect} from './fixtures.js';
import {createDashboardServer} from '../server/app.mjs';
import {resolve} from 'node:path';
import {defaultLayout} from '../src/dashboard-layout.js';
let server,url;
test.beforeAll(async()=>{const data=new Map();server=createDashboardServer({password:'profile-browser-only',storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},staticRoot:resolve('dist')});await new Promise(r=>server.listen(0,'127.0.0.1',r));url='http://127.0.0.1:'+server.address().port;});
test.afterAll(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
const login=async page=>{await page.goto(url+'/#settings/connections');await page.getByLabel('Dashboardserverens adgangskode',{exact:true}).fill('profile-browser-only');await page.getByRole('button',{name:'Forbind til server',exact:true}).click();await expect(page.locator('#settings-server-login')).toHaveCount(0);await page.goto(url+'/#settings/display');await expect(page.locator('.settings-profile')).toContainText('Opstillingen er gemt fælles for huset.');};
test('An incognito session receives and updates the household layout, widget options and display choices',async({browser,context})=>{
 const errors=[],a=await context.newPage();a.on('pageerror',e=>errors.push(e.message));await context.addInitScript(layout=>{if(localStorage.getItem('profile-seed'))return;localStorage.setItem('profile-seed','1');localStorage.setItem('engstien-home-layout-v3',JSON.stringify(layout));localStorage.setItem('engstien-widget-options-v1:shopping',JSON.stringify({view:'compact'}));localStorage.setItem('engstien-density-v1','comfortable');},defaultLayout().map(w=>w.id==='camera'?{...w,visible:false}:w.id==='weather'?{...w,width:6,heightPx:308}:w));
 await login(a);const saved=await a.evaluate(()=>JSON.parse(localStorage.getItem('engstien-home-layout-v3')));
 // A separate browser context has neither cookies nor localStorage from A.
 const isolated=await browser.newContext({viewport:{width:1440,height:1000}}),b=await isolated.newPage();b.on('pageerror',e=>errors.push(e.message));await isolated.route('https://**',r=>r.abort());try{
  await login(b);expect(await b.evaluate(()=>JSON.parse(localStorage.getItem('engstien-home-layout-v3')))).toEqual(saved);expect(await b.evaluate(()=>JSON.parse(localStorage.getItem('engstien-widget-options-v1:shopping')).view)).toBe('compact');await expect(b.locator('html')).toHaveAttribute('data-density','comfortable');await b.goto(url+'/#home');await expect(b.locator('.family-grid .camera-card')).toBeHidden();await expect(b.locator('.shopping-card')).toHaveClass(/widget-compact/);
  await b.goto(url+'/#settings/display');const saving=b.waitForResponse(r=>r.url().endsWith('/api/settings/profile')&&r.request().method()==='PUT');await b.getByRole('button',{name:'Komfort · valgt',exact:true}).click();expect((await saving).ok()).toBe(true);await expect(b.locator('.settings-profile')).toContainText('Opstillingen er gemt fælles for huset.');await a.reload();await expect(a.locator('html')).toHaveAttribute('data-density','compact');expect(await a.evaluate(()=>JSON.parse(localStorage.getItem('engstien-home-layout-v3')))).toEqual(saved);expect(errors).toEqual([]);
 }finally{await isolated.close();}
});
