import test from 'node:test';import assert from 'node:assert/strict';
import {dailyBriefing} from '../src/daily-briefing.js';import {parseNavigation,roomLocation} from '../src/navigation-state.js';import {defaultLayout,homeRectangles,validLayout,migrateLayout} from '../src/dashboard-layout.js';
test('Daily briefing includes relevant tasks and omits unavailable waste',()=>{
 const input={today:'2026-11-01',calendar:[{day:'2026-11-02',title:'Legeaftale',start:'10.00'}],waste:[{date:'2026-11-02',label:'Restaffald'}],tasks:[{text:'Klaret',done:true,due:'2026-11-01'},{text:'Husk tasken',done:false,due:'2026-11-01'},{text:'Senere',done:false,due:'2026-11-06'}]};
 assert.deepEqual(dailyBriefing(input).map(i=>i.target),['calendar','waste','tasks']);assert.equal(dailyBriefing(input)[1].detail,'Sæt beholderen frem i aften');assert.deepEqual(dailyBriefing({...input,wasteStatus:'offline'}).map(i=>i.target),['calendar','tasks']);assert.deepEqual(dailyBriefing({today:input.today}),[]);
});
test('Room links validate both destination and category and preserve legacy destinations',()=>{
 assert.deepEqual(parseNavigation('#rooms/stue/curtains',['stue']),{view:'rooms',room:'stue',category:'curtains'});assert.equal(parseNavigation('#heat').view,'rooms');assert.equal(parseNavigation('#rooms/unknown/curtains',['stue']).room,null);assert.equal(parseNavigation('#car/stue/unknown',['stue']).room,null);assert.equal(parseNavigation('#rooms/stue/unknown',['stue']).category,null);assert.equal(roomLocation('stue','curtains'),'#rooms/stue/curtains');
});
test('Stock mobile overview prioritizes family information and compact imagery without changing desktop rectangles',()=>{
 const layout=defaultLayout(),before=structuredClone(layout),desktop=homeRectangles(layout),mobile=homeRectangles(layout,{stack:true});assert.deepEqual(mobile.slice().sort((a,b)=>a.row-b.row).slice(0,4).map(r=>r.id),['calendar','waste','weather','electricity']);assert.equal(mobile.find(r=>r.id==='house').rows*16-12,132);assert.equal(desktop.find(r=>r.id==='house').rows*16-12,244);assert.deepEqual(layout,before);
});
test('Custom mobile orders and independent heights survive storage without changing desktop sizes',()=>{
 const old=defaultLayout().map((w,i)=>({...w,column:0,row:i*20,heightPx:340,mobileOrder:defaultLayout().length-1-i,mobileHeightPx:180}));assert.ok(validLayout(old));assert.deepEqual(migrateLayout(old),old);assert.equal(homeRectangles(old).find(r=>r.id==='house').rows*16-12,340);assert.equal(homeRectangles(old,{stack:true}).find(r=>r.id==='house').rows*16-12,180);assert.equal(homeRectangles(old,{stack:true}).sort((a,b)=>a.row-b.row)[0].id,'electricity');
 for(const value of [null,0,131,1093,'180',180.5])assert.equal(validLayout(defaultLayout().map(w=>({...w,mobileHeightPx:value}))),false);
});

test('A customized desktop without phone preferences receives an independent phone overview without changing its cells',()=>{const layout=defaultLayout().map((w,i)=>({...w,width:6,column:i%2*6,row:Math.floor(i/2)*30,heightPx:340})),before=structuredClone(layout),desktop=homeRectangles(layout);assert.equal(homeRectangles(layout,{stack:true}).sort((a,b)=>a.row-b.row)[0].id,'calendar');assert.deepEqual(homeRectangles(layout),desktop);assert.deepEqual(layout,before);});

test('Saved classic layouts retain every field and their original desktop heights',()=>{const classic=[['house',4,5],['camera',4,5],['weather',4,5],['calendar',6,4],['waste',3,4],['car',3,4],['tasks',6,4],['shopping',6,4],['music',3,3],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));assert.deepEqual(migrateLayout(classic).filter(w=>w.id!=='electricity'),classic);const r=homeRectangles(classic);assert.equal(r.find(r=>r.id==='house').rows*16-12,260);assert.equal(r.find(r=>r.id==='calendar').rows*16-12,228);assert.equal(r.find(r=>r.id==='music').rows*16-12,212);});
