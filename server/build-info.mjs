import {readFileSync} from 'node:fs';
import {appVersion} from '../src/app-version.js';
export function runtimeBuild(){
 for(const path of ['../build-info.json','../dist/build-info.json'])try{const info=JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));if(info.version===appVersion&&typeof info.build==='string'&&/^[a-zA-Z0-9._-]{1,100}$/.test(info.build))return info.build;}catch{}
 return appVersion;
}
