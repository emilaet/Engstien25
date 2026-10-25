import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir, access } from 'node:fs/promises';

// Ephemeral short test password (8 characters): never saved, printed or used for deployment.
const password = randomBytes(4).toString('hex');
let server, url;
test.beforeAll(async () => {
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], {
    env: { ...process.env, PREVIEW_PASSWORD: password }, encoding: 'utf8',
  });
  expect(result.status, 'Encrypted build must succeed').toBe(0);
  expect(await readdir('.preview/site')).toEqual(['.nojekyll', 'index.html']);
  await expect(access('.preview/plain')).rejects.toThrow();
  const html = await readFile('.preview/site/index.html');
  expect(html.toString()).not.toContain(password);
  expect(html.toString()).not.toContain('Engstien 25');
  server = createServer((req, res) => {
    if (req.url !== '/Engstien25/' && req.url !== '/Engstien25/index.html') {
      res.writeHead(404); res.end(); return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/Engstien25/`;
});
test.afterAll(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('Wrong password stays locked; correct password opens working 3D without external assets', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => requests.push(req.url()));
  await page.goto(url);
  await expect(page.locator('#app')).toHaveCount(0);
  await page.locator('input[type=password]').fill('incorrect-test-password');
  await page.getByRole('button', { name: 'Åbn husoversigt' }).click();
  await expect(page.locator('#app')).toHaveCount(0);
  // Staticrypt reports a wrong-password message in an alert.
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Åbn husoversigt' }).click();
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('.room-label')).toHaveCount(14);
  await page.locator('[data-room="stue"]').click();
  const lamp=page.getByRole('switch',{name:'Bordlampe'});
  await expect(lamp).toHaveAttribute('aria-checked','true');
  await lamp.click();await expect(lamp).toHaveAttribute('aria-checked','false');
  expect(errors).toEqual([]);
  expect(requests.filter(r => !r.startsWith(url) && !r.startsWith('data:'))).toEqual([]);
  await page.reload();await expect(page.locator('input[type=password]')).toBeVisible();
});

test('Missing password fails closed and never starts a deployable build', async () => {
  const result = spawnSync(process.execPath, ['scripts/build-preview.mjs'], {
    env: { ...process.env, PREVIEW_PASSWORD: '' }, encoding: 'utf8',
  });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Set PREVIEW_PASSWORD');
  await expect(access('.preview/site')).rejects.toThrow();
});
