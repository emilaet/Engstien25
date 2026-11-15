import {readFileSync} from 'node:fs';
import {appVersion} from '../src/app-version.js';
const text=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(text('package.json')),lock=JSON.parse(text('package-lock.json')),config=text('engstien/config.yaml');
if(!/^\d+\.\d+\.\d+$/.test(appVersion)||pkg.version!==appVersion||lock.version!==appVersion||lock.packages[''].version!==appVersion||!config.includes('version: "'+appVersion+'"')||!text('Dockerfile').includes('io.hass.version="'+appVersion+'"'))throw Error('Versionsnumrene i Green-pakken stemmer ikke overens.');
for(const rule of ['ingress: true','homeassistant_api: true','panel_admin: true','backup: cold','aarch64','amd64'])if(!config.includes(rule))throw Error('Green-konfigurationen mangler '+rule);
for(const forbidden of ['host_network: true','privileged:','docker_api: true','full_access: true','hassio_role: admin'])if(config.includes(forbidden))throw Error('Green-pakken beder om unødvendig adgang: '+forbidden);
if(!text('engstien/Dockerfile').includes('ARG ENGSTIEN_VERSION='+appVersion))throw Error('Installationsversionen stemmer ikke.');
console.log('Green-pakke '+appVersion+': version, arkitekturer, ingress og backup er kontrolleret.');
