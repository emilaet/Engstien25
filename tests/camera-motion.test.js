import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraFlightProgress} from '../src/camera-motion.js';

test('Camera flights animate smoothly, respect reduced motion and release controls after slow or suspended frames',()=>{
 assert.equal(cameraFlightProgress(0,0,1),1);
 assert.equal(cameraFlightProgress(-10,1450,1),0);
 let previous=0;
 for(let frame=1;frame<=100;frame++){
  const progress=cameraFlightProgress(frame*16,1450,frame);
  assert.ok(progress>=previous&&progress<=1);previous=progress;
 }
 assert.equal(previous,1);
 assert.ok(cameraFlightProgress(725,1450,45)>.4&&cameraFlightProgress(725,1450,45)<.6);
 for(const frames of [2,3,5,8])assert.equal(cameraFlightProgress(2450,1450,frames),1,'A stalled renderer must not hold camera controls for eight frames');
 const start=cameraFlightProgress(60000,1450,1);
 assert.ok(start>0&&start<1,'Show a visible start even after a long compilation or background-tab pause');
 assert.equal(cameraFlightProgress(60016,1450,2),1,'Finish on the next rendered frame after suspension');
});
