import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultLayout,validLayout,moveWidget} from '../src/dashboard-layout.js';
test('Saved grid accepts each known widget once, with only supported fixed sizes',()=>{
 const layout=defaultLayout();assert.equal(validLayout(layout),true);assert.equal(validLayout(null),false);assert.equal(validLayout([...layout.slice(1),null]),false);assert.equal(validLayout([...layout.slice(1),layout[1]]),false);assert.equal(validLayout(layout.map(w=>w.id==='tasks'?{...w,width:13}:w)),false);assert.equal(validLayout(layout.map(w=>w.id==='tasks'?{...w,height:0}:w)),false);
});
test('Reordering preserves each widget and its dimensions without changing the saved layout',()=>{
 const original=defaultLayout();original[5].width=8;const moved=moveWidget(original,'shopping',0);assert.equal(moved[0].id,'shopping');assert.equal(moved[0].width,8);assert.equal(original[0].id,'lights');assert.equal(validLayout(moved),true);assert.equal(moveWidget(moved,'shopping',99).at(-1).id,'shopping');assert.equal(moveWidget(original,'waste',-5)[0].id,'waste');
});
