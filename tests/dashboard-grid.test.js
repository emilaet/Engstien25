import test from 'node:test';import assert from 'node:assert/strict';
import {arrangeGrid,relocateGrid,reorderStack,overlaps,snapGridRow,shiftStack} from '../src/dashboard-grid.js';
const base=()=>arrangeGrid([{id:'a',width:4,rows:17},{id:'b',width:4,rows:17},{id:'c',width:4,rows:17},{id:'d',width:6,rows:15},{id:'e',width:6,rows:15}]);
function clear(rects){for(const a of rects){assert.ok(a.column>=0&&a.column+a.width<=12&&a.row>=0);for(const b of rects)if(a!==b)assert.equal(overlaps(a,b),false,`${a.id} and ${b.id} overlap`);}}
test('Legacy automatic layout keeps its rows, and explicit empty spaces remain empty',()=>{const b=base();assert.deepEqual(b.map(r=>[r.column,r.row]),[[0,0],[4,0],[8,0],[0,17],[6,17]]);const moved=relocateGrid(b,'a',{column:2,row:55});assert.equal(moved[0].row,55);assert.deepEqual(moved.slice(1),b.slice(1));clear(moved);assert.deepEqual(arrangeGrid(moved),moved);});
test('Cards move in all four directions, exchange occupied slots, and can return to the first cell',()=>{const b=base();const left=relocateGrid(b,'b',{column:0,row:0});assert.equal(left[1].column,0);assert.equal(left[0].column,4);clear(left);const right=relocateGrid(left,'b',{column:8,row:0});assert.equal(right[1].column,8);clear(right);const down=relocateGrid(right,'b',{column:8,row:55});assert.equal(down[1].row,55);clear(down);const up=relocateGrid(down,'b',{column:0,row:0});assert.equal(up[1].row,0);assert.equal(up[1].column,0);clear(up);});
test('Different sized collisions make room without moving unrelated cards or overlapping after resize',()=>{for(const width of [2,3,5,8,12])for(const rows of [9,17,30,60]){const next=relocateGrid(base(),'b',{column:3,row:8,width,rows});clear(next);assert.equal(next.find(r=>r.id==='b').width,width);assert.deepEqual(arrangeGrid(next),next);}});
test('Responsive widths are bounded and stacked cards follow visual reading order',()=>{const b=base();b[0].column=8;b[0].row=50;clear(arrangeGrid(b,{minimum:3}));const stack=arrangeGrid(b,{stack:true});assert.deepEqual(stack.map(r=>r.id),['b','c','d','e','a']);assert.ok(stack.every(r=>r.width===12&&r.column===0));clear(stack);const up=reorderStack(stack,'a',0);assert.equal(up[0].id,'a');clear(up);});
test('Repeated arbitrary moves and resizes never overlap, including edge clamps and holes',()=>{
 let current=base(),seed=137;
 const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<250;i++){const id=current[random(current.length)].id;current=relocateGrid(current,id,{column:random(18)-3,row:random(80)-8,width:random(11)+2,rows:random(30)+9});clear(current);}
});

test('Drag alignment tolerates slight hand movement near row edges without preventing distant empty placements',()=>{assert.equal(snapGridRow(1.6,base()),0);assert.equal(snapGridRow(18.5,base()),17);assert.equal(snapGridRow(25,base()),25);assert.equal(snapGridRow(80,base()),80);});

test('Tall phone cards can move above short cards, and one-click arrows move exactly one place both ways',()=>{
 const original=[{id:'small',width:12,column:0,row:0,rows:9},{id:'tall',width:12,column:0,row:9,rows:50},{id:'last',width:12,column:0,row:59,rows:13}];
 const up=reorderStack(original,'tall',1);assert.equal(up[0].id,'tall');clear(up);const down=shiftStack(up,'tall',1);assert.deepEqual(down,original);assert.deepEqual(shiftStack(down,'tall',-1),up);assert.equal(reorderStack(up,'tall',100)[2].id,'tall');
});
