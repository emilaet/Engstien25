import {tariffUrls,normalizeTariffs} from '../src/electricity-tariffs.js';
import {tariffFixture} from '../tests/fixtures/tariffs.js';
import {electricityFixture} from '../tests/fixtures/electricity.js';
import {weatherFixture} from '../tests/fixtures/weather.js';
import {defaultDashboardProfile} from '../src/dashboard-profile.js';
import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir, access, writeFile, rm } from 'node:fs/promises';

// Ephemeral short test password (8 characters): never saved, printed or used for deployment.
const password = randomBytes(4).toString('hex');
let server, url;const tariffFile='/tmp/engstien-preview-tariffs-'+process.pid+'.json';
test.beforeAll(async () => {
  await writeFile(tariffFile,JSON.stringify({version:1,grid:'dinel',updatedAt:new Date().toISOString(),records:tariffUrls().flatMap(url=>normalizeTariffs(tariffFixture(url).records))}));
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], {
    env: { ...process.env, PREVIEW_PASSWORD: password, ELECTRICITY_TARIFFS_FILE:tariffFile }, encoding: 'utf8',
  });
  expect(result.status, 'Encrypted build must succeed').toBe(0);
  expect((await readdir('.preview/site')).sort()).toEqual(['.nojekyll','app-icon-192.png','app-icon-512.png','apple-touch-icon.png','favicon.svg','index.html','manifest.webmanifest']);
  await expect(access('.preview/plain')).rejects.toThrow();
  const html = await readFile('.preview/site/index.html');
  expect(html.toString()).not.toContain(password);
  expect(html.toString()).not.toContain('Engstien 25');
  server = createServer(async(req, res) => {
    const name=req.url?.replace('/Engstien25/','');
    if(['manifest.webmanifest','apple-touch-icon.png','app-icon-192.png','app-icon-512.png','favicon.svg'].includes(name)){res.setHeader('Content-Type',name.endsWith('.webmanifest')?'application/manifest+json':name.endsWith('.svg')?'image/svg+xml':'image/png');res.end(await readFile('.preview/site/'+name));return;}
    if(req.url!=='/Engstien25/'&&req.url!=='/Engstien25/index.html'){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/Engstien25/`;
});
test.afterAll(async () => { await rm(tariffFile,{force:true});if (server) await new Promise(resolve => server.close(resolve)); });

test('Wrong password stays locked; correct password opens working 3D without external assets', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => requests.push(req.url()));
  await page.route('https://api.open-meteo.com/v1/forecast?**',route=>route.fulfill({json:weatherFixture()}));
  await page.route('https://api.energidataservice.dk/dataset/DatahubPricelist?**',route=>route.fulfill({status:503,body:'Simulated browser tariff outage'}));
  await page.route('https://www.elprisenligenu.dk/api/v1/prices/**',route=>{const m=route.request().url().match(/prices\/(\d{4})\/(\d{2}-\d{2})_(DK[12])/);return route.fulfill({json:electricityFixture(m[1]+'-'+m[2])});});
  await page.goto(url);
  await expect(page.locator('#app')).toHaveCount(0);
  await expect(page.locator('meta[name=apple-mobile-web-app-capable]')).toHaveAttribute('content','yes');
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href','./favicon.svg');
  await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href','./manifest.webmanifest');
  await expect(page.locator('body')).toHaveCSS('font-family',/Plus Jakarta Sans/);
  await page.locator('input[type=password]').fill('incorrect-test-password');
  await page.getByRole('button', { name: 'Åbn husoversigt' }).click();
  await expect(page.locator('#app')).toHaveCount(0);
  // Staticrypt reports a wrong-password message in an alert.
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Åbn husoversigt' }).click();
  await expect(page.getByRole('heading',{name:'Hjem',exact:true})).toBeVisible({timeout:20000});
  await expect(page.getByRole('heading',{name:'Handleliste',exact:true})).toBeVisible();
  await expect(page.locator('.family-grid .electricity-card .ep-summary>strong')).toHaveText(/\d/);await expect(page.locator('.family-grid .electricity-card')).toContainText('Sidst kendte satser');
  await page.getByRole('button',{name:'Rum',exact:true}).click();
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-render-finish','native',{timeout:30000});
  await expect(page.locator('#scene')).toHaveAttribute('data-parked-car-visible','true');
  await expect(page.locator('.room-label')).toHaveCount(0);
  await page.locator('[data-room="stue"]').click();
  const lamp=page.getByRole('switch',{name:'Gulvlampe i Stue',exact:true});
  await expect(lamp).toHaveAttribute('aria-checked','true');
  await lamp.click();await expect(lamp).toHaveAttribute('aria-checked','false');
  expect(errors).toEqual([]);
  expect(requests.filter(r => !r.startsWith(url) && !r.startsWith('data:') && !r.startsWith('https://api.open-meteo.com/v1/forecast?') && !r.startsWith('https://www.elprisenligenu.dk/api/v1/prices/') && !r.startsWith('https://api.energidataservice.dk/dataset/DatahubPricelist?'))).toEqual([]);
  await page.reload();await expect(page.locator('input[type=password]')).toBeVisible();
});

test('The encrypted mobile app explains rejected account credentials and accepts a subsequent valid login',async({page})=>{
 const accountId='11111111-1111-4111-8111-111111111111',project='https://ammeopgcgdlohtjadcsq.supabase.co',errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.route('https://**',route=>route.abort());
 await page.route(project+'/**',route=>{const r=route.request(),path=new URL(r.url()).pathname;if(path.includes('/auth/v1/token')){const b=r.postDataJSON();return b.password==='incorrect-test-password'?route.fulfill({status:400,json:{code:'invalid_credentials',msg:'Invalid login credentials'}}):route.fulfill({json:{access_token:'test-account-token',refresh_token:'test-refresh',expires_in:3600,user:{id:accountId,email:b.email}}});}return route.fulfill({json:[{revision:1,updated_at:new Date().toISOString(),profile:defaultDashboardProfile()}]});});
 await page.goto(url);await page.locator('input[type=password]').fill(password);await page.getByRole('button',{name:'Åbn husoversigt'}).click();await expect(page.getByRole('heading',{name:'Hjem',exact:true})).toBeVisible();
 await page.locator('#home-options').click();await page.getByRole('button',{name:'Indstillinger',exact:true}).click();await page.getByRole('button',{name:'Skærm og dashboard',exact:true}).click();
 await page.getByLabel('E-mail',{exact:true}).fill('app@example.test');await page.getByLabel('Adgangskode til Engstien',{exact:true}).fill('incorrect-test-password');await page.getByRole('button',{name:'Log ind og hent min opstilling',exact:true}).click();await expect(page.locator('.account-login-feedback')).toHaveText('E-mail eller adgangskode er forkert.');await expect(page.getByText('E-mail eller adgangskode er forkert.',{exact:true})).toHaveCount(1);await expect(page.locator('.account-login-help')).toContainText('Authentication → Users');await expect(page.getByLabel('E-mail',{exact:true})).toHaveValue('app@example.test');await expect(page.getByLabel('Adgangskode til Engstien',{exact:true})).toHaveValue('');
 await page.getByLabel('Adgangskode til Engstien',{exact:true}).fill('valid-test-password');await page.getByRole('button',{name:'Log ind og hent min opstilling',exact:true}).click();await expect(page.locator('.settings-profile')).toContainText('Opstillingen er gemt fælles for huset.');await expect(page.locator('.account-login-help')).toHaveCount(0);expect(errors).toEqual([]);
});

test('Missing password fails closed and never starts a deployable build', async () => {
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], {
    env: { ...process.env, PREVIEW_PASSWORD: '' }, encoding: 'utf8',
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Set PREVIEW_PASSWORD');
  await expect(access('.preview/site')).rejects.toThrow();
});
