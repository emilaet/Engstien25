import {demoWidgetSnapshot} from '../../src/home-widget-data.js';
export function weatherFixture(now=new Date()){
 const w=demoWidgetSnapshot(now).weather,code=kind=>({sun:0,moon:0,partly:2,cloud:3,rain:80})[kind]??3;
 return {current:{time:Math.floor(now.getTime()/1000),temperature_2m:w.current,apparent_temperature:w.feels,is_day:w.kind==='moon'?0:1,weather_code:code(w.kind),wind_speed_10m:4,wind_direction_10m:180},daily:{time:w.days.map(d=>Date.parse(d.day+'T12:00:00Z')/1000),weather_code:w.days.map(d=>code(d.kind)),temperature_2m_max:w.days.map(d=>d.high),temperature_2m_min:w.days.map(d=>d.low),precipitation_probability_max:w.days.map(d=>d.rain)},hourly:{time:w.hours.map(h=>Date.parse(h.at)/1000),weather_code:w.hours.map(h=>code(h.kind)),temperature_2m:w.hours.map(h=>h.temperature),precipitation_probability:w.hours.map(h=>h.rain),is_day:w.hours.map(h=>h.kind==='moon'?0:1)}};
}
