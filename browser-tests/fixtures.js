import {test as base,expect} from '@playwright/test';
import {electricityFixture} from '../tests/fixtures/electricity.js';
import {weatherFixture} from '../tests/fixtures/weather.js';
export {expect};
export const test=base.extend({serviceFixtures:[async({context},use)=>{
 await context.addInitScript(()=>{
  // Emulate an existing read-only calendar cache. No Google token is stored.
  if(localStorage.getItem('engstien-test-calendar-seeded'))return;
  localStorage.setItem('engstien-test-calendar-seeded','true');
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),day=offset=>new Date(Date.parse(today+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);
  const events=[['play',1,'Legeaftale','10.00','12.00','Lucas','amber'],['gym',2,'Gymnastik','16.30','17.15','Lucas','amber'],['sophia',4,'Hent Sophia tidligt','14.30','','Sophia','blue'],['visit',6,'Bedsteforældre på besøg','15.00','','Familien','green']].map(([id,offset,title,start,end,person,color])=>({id,day:day(offset),title,start,end,person,color,calendarId:'primary'}));
  localStorage.setItem('engstien-calendar-cache-v1',JSON.stringify({version:1,events,updatedAt:new Date().toISOString(),owner:'fixture@example.test',selected:['primary'],calendars:[{id:'primary',summary:'Familien',primary:true}]}));
 });
 await context.route('https://api.open-meteo.com/v1/forecast?**',async route=>{let at;try{at=await route.request().frame().evaluate(()=>Date.now());}catch{at=Date.now();}return route.fulfill({json:weatherFixture(new Date(at))});});
 await context.route('https://www.elprisenligenu.dk/api/v1/prices/**',route=>{const m=route.request().url().match(/prices\/(\d{4})\/(\d{2}-\d{2})_(DK[12])/);return route.fulfill({json:electricityFixture(m[1]+'-'+m[2],{area:m[3]})});});
 await use();
},{auto:true}]});
