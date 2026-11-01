import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLayout,validLayout,moveWidget,migrateLayout} from '../src/dashboard-layout.js';
const legacy=()=>[['house',8,5],['waste',4,5],['tasks',4,5],['shopping',4,5],['car',4,5],['lights',4,2],['climate',4,2],['curtains',4,2]].map(([id,width,height])=>({id,width,height,visible:!['lights','climate','curtains'].includes(id)}));
test('Grid validates known widgets, visibility and fixed sizes',()=>{const a=defaultLayout();assert.ok(validLayout(a));for(const x of [null,[...a.slice(1),null],[...a.slice(1),a[1]],a.map(w=>w.id==='tasks'?{...w,width:13}:w),a.map(w=>w.id==='tasks'?{...w,visible:'yes'}:w)])assert.equal(validLayout(x),false);});
test('Reordering preserves saved dimensions without mutating the original',()=>{const a=defaultLayout();a.find(w=>w.id==='shopping').width=8;const b=moveWidget(a,'shopping',0);assert.equal(b[0].width,8);assert.equal(a[0].id,'house');assert.ok(validLayout(b));assert.equal(moveWidget(b,'shopping',99).at(-1).id,'shopping');});
test('Unmodified old defaults receive the approved eight visible cards',()=>{assert.deepEqual(migrateLayout(legacy()),defaultLayout());assert.deepEqual(migrateLayout(legacy().map(({visible,...w})=>w)),defaultLayout());assert.deepEqual(defaultLayout().filter(w=>w.visible).map(w=>w.id),['house','camera','weather','calendar','waste','car','tasks','shopping']);});
test('Eight and seven widget custom layouts retain order, sizes and visibility, adding new widgets once',()=>{for(const old of [legacy().reverse(),legacy().filter(w=>w.id!=='house').reverse()]){old[0].width=8;const b=migrateLayout(old);assert.deepEqual(b.slice(old.length===7?1:0,8),old);assert.ok(validLayout(b));assert.deepEqual(b.slice(8).map(w=>w.id),['camera','weather','calendar']);assert.deepEqual(migrateLayout(b),b);}});
test('Malformed legacy layouts do not become partial saved layouts',()=>{assert.deepEqual(migrateLayout([{id:'unknown',width:4,height:5}]),defaultLayout());assert.deepEqual(migrateLayout([...legacy().slice(1),legacy()[1]]),defaultLayout());});

test('Sixth-width widgets remain valid and retain their dimensions through storage migration',()=>{const a=defaultLayout().map(w=>({...w,width:2}));assert.ok(validLayout(a));assert.deepEqual(migrateLayout(a),a);});
test('Direct resize sizes survive reload migration while malformed pixel heights are rejected',()=>{
 const layout=defaultLayout().map(w=>({...w,width:5,heightPx:340}));assert.ok(validLayout(layout));assert.deepEqual(migrateLayout(layout),layout);
 for(const heightPx of [null,'340',0,131,1093,NaN,Infinity,200.5])assert.equal(validLayout(layout.map(w=>({...w,heightPx}))),false);
});
