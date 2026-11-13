import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLayout,homeRectangles,validLayout,resetMobileLayout} from '../src/dashboard-layout.js';
import {normalizeDashboardProfile,defaultDashboardProfile} from '../src/dashboard-profile.js';
test('Mobile projection is independent of desktop order, visibility, widths and heights',()=>{
 const original=defaultLayout(),mobile=homeRectangles(original,{stack:true}),desktopChanged=original.toReversed().map(w=>({...w,visible:!w.visible,width:12,heightPx:500,column:0,row:200}));assert.deepEqual(homeRectangles(desktopChanged,{stack:true}),mobile);assert.deepEqual(mobile.slice(0,4).map(r=>r.id),['calendar','music','electricity','tasks']);assert.ok(!mobile.some(r=>['house','weather','waste','car'].includes(r.id)));
});
test('Explicit mobile visibility and list style survive normalization and cannot alter desktop geometry',()=>{
 const p=defaultDashboardProfile(),before=homeRectangles(p.layout);p.layout=p.layout.map(w=>w.id==='shopping'?{...w,mobileView:'compact',mobileOrder:0}:w.id==='camera'?{...w,mobileVisible:false,mobileHeightPx:244}:w);const clean=normalizeDashboardProfile(p);assert.equal(clean.layout.find(w=>w.id==='shopping').mobileView,'compact');assert.equal(clean.layout.find(w=>w.id==='camera').mobileVisible,false);assert.deepEqual(homeRectangles(clean.layout),before);assert.ok(!homeRectangles(clean.layout,{stack:true}).some(r=>r.id==='camera'));for(const patch of [{mobileVisible:'false'},{mobileVisible:null},{mobileView:'bad'}])assert.equal(validLayout(defaultLayout().map((w,i)=>i?w:{...w,...patch})),false);
});
test('Resetting mobile defaults preserves every desktop field and does not mutate the input',()=>{
 const original=defaultLayout().map((w,i)=>({...w,visible:i%2===0,column:i%3*4,row:i*30,heightPx:340,mobileHeightPx:500,mobileVisible:true,mobileView:'compact'})),copy=structuredClone(original),next=resetMobileLayout(original),strip=layout=>layout.map(({mobileOrder,mobileHeightPx,mobileVisible,mobileView,mobileWidth,...w})=>w);assert.deepEqual(strip(next),strip(original));assert.deepEqual(original,copy);assert.equal(next.find(w=>w.id==='house').mobileVisible,false);assert.equal(next.find(w=>w.id==='shopping').mobileView,'list');
});
test('Mobile width validates, syncs with the account profile and resets without touching iPad geometry',()=>{
 const profile=defaultDashboardProfile(),desktop=homeRectangles(profile.layout);profile.layout=profile.layout.map((w,i)=>({...w,mobileVisible:true,mobileWidth:i%2?6:12}));const clean=normalizeDashboardProfile(profile);assert.deepEqual(clean.layout.map(w=>w.mobileWidth),profile.layout.map(w=>w.mobileWidth));assert.deepEqual(homeRectangles(clean.layout),desktop);assert.ok(homeRectangles(clean.layout,{stack:true}).some(w=>w.column===6));
 for(const bad of [null,0,5,7,13,'6'])assert.equal(validLayout(profile.layout.map((w,i)=>i?w:{...w,mobileWidth:bad})),false);
 const reset=resetMobileLayout(clean.layout);assert.equal(reset.find(w=>w.id==='electricity').mobileWidth,12);assert.equal(reset.find(w=>w.id==='shopping').mobileWidth,6);assert.deepEqual(homeRectangles(reset),desktop);
});
