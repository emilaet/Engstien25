import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
test('Green release tooling updates every version together and rejects incomplete or backward releases without partial writes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'engstien-release-')),files=['package.json','package-lock.json','src/app-version.js','engstien/config.yaml','engstien/Dockerfile','Dockerfile'];
 try{
  for(const file of [...files,'scripts/release-green.mjs','scripts/check-green.mjs']){await mkdir(dirname(join(dir,file)),{recursive:true});await cp(new URL('../'+file,import.meta.url),join(dir,file));}
  const current=JSON.parse(await readFile(join(dir,'package.json'))).version,parts=current.split('.').map(Number);parts[2]++;const next=parts.join('.');
  execFileSync(process.execPath,[join(dir,'scripts/release-green.mjs'),next]);execFileSync(process.execPath,[join(dir,'scripts/check-green.mjs')]);
  const before=await Promise.all(files.map(file=>readFile(join(dir,file),'utf8')));assert.throws(()=>execFileSync(process.execPath,[join(dir,'scripts/release-green.mjs'),current],{stdio:'pipe'}));assert.deepEqual(await Promise.all(files.map(file=>readFile(join(dir,file),'utf8'))),before);
  await writeFile(join(dir,'Dockerfile'),'missing-version-field');const damaged=await Promise.all(files.map(file=>readFile(join(dir,file),'utf8')));parts[2]++;assert.throws(()=>execFileSync(process.execPath,[join(dir,'scripts/release-green.mjs'),parts.join('.')],{stdio:'pipe'}));assert.deepEqual(await Promise.all(files.map(file=>readFile(join(dir,file),'utf8'))),damaged);
 }finally{await rm(dir,{recursive:true,force:true});}
});
