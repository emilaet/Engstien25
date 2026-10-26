import {resolve} from 'node:path';
import {createDashboardServer,fileStorage} from './app.mjs';
const host=process.env.DASHBOARD_HOST||'127.0.0.1',port=Number(process.env.PORT||4174);
const server=createDashboardServer({password:process.env.DASHBOARD_PASSWORD,storage:fileStorage(resolve(process.env.DASHBOARD_DATA||'.local-dashboard/data.json')),haUrl:process.env.HA_URL,haToken:process.env.HA_TOKEN,secureCookies:process.env.COOKIE_SECURE==='true',entities:{battery:process.env.TESLA_BATTERY_ENTITY,status:process.env.TESLA_STATUS_ENTITY,target:process.env.TESLA_TARGET_ENTITY,power:process.env.TESLA_POWER_ENTITY,energy:process.env.TESLA_ENERGY_ENTITY,remaining:process.env.TESLA_REMAINING_ENTITY,charger:process.env.CHARGER_STATUS_ENTITY}});
server.listen(port,host,()=>console.log(`Dashboardserver klar på port ${port}; ingen credentials logges.`));
