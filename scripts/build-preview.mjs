import { spawnSync } from 'node:child_process';
import { readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises';

const plain = '.preview/plain';
const site = '.preview/site';
// Never leave a stale publishable artifact after a failed invocation.
await rm('.preview', { recursive: true, force: true });
const password = process.env.PREVIEW_PASSWORD;
// Never pass the password as a command-line argument or write it to a file.
if (!password || password.length < 14) {
  console.error('Set PREVIEW_PASSWORD to a passphrase of at least 14 characters. No preview was published.');
  process.exit(1);
}
function run(script, args, env = process.env) {
  const result = spawnSync(process.execPath, [script, ...args], { env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error('Preview build failed.');
}
try {
  const buildEnv = { ...process.env };
  delete buildEnv.PREVIEW_PASSWORD;
  delete buildEnv.STATICRYPT_PASSWORD;
  run('node_modules/vite/bin/vite.js', ['build', '--config', 'vite.preview.config.js'], buildEnv);
  const entries = await readdir(plain);
  if (entries.length !== 1 || entries[0] !== 'index.html') {
    throw new Error('Refusing to publish: the app must be a single self-contained HTML file.');
  }
  const source = await readFile(`${plain}/index.html`, 'utf8');
  if (/<script\b[^>]*\bsrc\s*=/i.test(source) || /<link\b[^>]*\brel=["']stylesheet/i.test(source)) {
    throw new Error('Refusing to publish external application assets.');
  }
  await mkdir(site, { recursive: true });
  run('node_modules/staticrypt/cli/index.js', [
    `${plain}/index.html`, '--directory', site, '--config', 'false',
    '--remember', 'false', '--template-title', 'Privat husoversigt',
    '--template-instructions', 'Indtast den fælles adgangskode for at åbne husoversigten.',
    '--template-placeholder', 'Adgangskode', '--template-button', 'Åbn husoversigt',
    '--template-error', 'Forkert adgangskode. Prøv igen.',
    '--template-toggle-show', 'Vis adgangskode', '--template-toggle-hide', 'Skjul adgangskode',
    '--template-color-primary', '#59694a', '--template-color-secondary', '#f3f1eb',
  ], { ...process.env, STATICRYPT_PASSWORD: password });
  const encrypted = await readFile(`${site}/index.html`, 'utf8');
  for (const marker of ['Engstien 25', 'Stort vinduesparti', 'Soveværelse', password]) {
    if (encrypted.includes(marker)) throw new Error('Refusing to publish unencrypted application data.');
  }
  await writeFile(`${site}/.nojekyll`, '');
  console.log('Encrypted preview ready in .preview/site. No plaintext model or app assets are published.');
} catch (error) {
  await rm(site, { recursive: true, force: true });
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await rm(plain, { recursive: true, force: true });
}
