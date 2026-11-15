import {defineConfig} from 'vite';
import {appVersion} from './src/app-version.js';
const build=process.env.APP_BUILD||appVersion;
export default defineConfig({base:'./',define:{__APP_BUILD__:JSON.stringify(build)},plugins:[{name:'engstien-build-info',generateBundle(){this.emitFile({type:'asset',fileName:'build-info.json',source:JSON.stringify({version:appVersion,build})+'\n'});}}]});
