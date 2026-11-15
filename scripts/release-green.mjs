import {readFileSync,writeFileSync} from 'node:fs';
const version=process.argv[2],root=new URL('../',import.meta.url);
if(!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Brug npm run release:green -- 0.2.1');
const path=p=>new URL(p,root),pkg=JSON.parse(readFileSync(path('package.json'))),before=pkg.version;
const parts=v=>v.split('.').map(Number);if(parts(version).reduce((cmp,n,i)=>cmp||Math.sign(n-parts(before)[i]),0)<=0)throw Error('Vælg et højere versionsnummer end '+before+'.');
const writes=[];pkg.version=version;writes.push(['package.json',JSON.stringify(pkg,null,2)+'\n']);
const lock=JSON.parse(readFileSync(path('package-lock.json')));lock.version=version;lock.packages[''].version=version;writes.push(['package-lock.json',JSON.stringify(lock,null,2)+'\n']);
for(const [file,old,next]of [['src/app-version.js',"appVersion='"+before+"'","appVersion='"+version+"'"],['engstien/config.yaml','version: "'+before+'"','version: "'+version+'"'],['engstien/Dockerfile','ARG ENGSTIEN_VERSION='+before,'ARG ENGSTIEN_VERSION='+version],['Dockerfile','io.hass.version="'+before+'"','io.hass.version="'+version+'"']]){const s=readFileSync(path(file),'utf8');if(!s.includes(old))throw Error('Versionsfelt mangler i '+file);writes.push([file,s.replace(old,next)]);}
for(const [file,contents]of writes)writeFileSync(path(file),contents);
console.log('Klar til Green-version '+version+'. Opdater CHANGELOG, commit og push til main. GitHub bygger pakken automatisk.');
