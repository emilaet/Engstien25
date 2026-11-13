import test from 'node:test';import assert from 'node:assert/strict';
import {retryDelay,createPoliteTariffFetch} from '../scripts/tariff-http.mjs';
test('Tariff publishing honours Retry-After once and serializes public API calls',async()=>{
 const calls=[],waits=[];let responses=0;const request=createPoliteTariffFetch({wait:async ms=>waits.push(ms),fetchImpl:async url=>{calls.push(url);return ++responses===1?{status:429,headers:{get:()=> '5'}}:{status:200};}});
 const results=await Promise.all([request('grid'),request('tax')]);assert.deepEqual(calls,['grid','grid','tax']);assert.deepEqual(waits,[5000,1100,1100]);assert.ok(results.every(r=>r.status===200));
 assert.equal(retryDelay(null),60000);assert.equal(retryDelay('Thu, 01 Jan 1970 00:00:10 GMT',5000),5000);
});
test('A long server cooldown is reported rather than repeatedly requesting tariffs',async()=>{let calls=0;const request=createPoliteTariffFetch({wait:async()=>assert.fail('must not retry'),fetchImpl:async()=>{calls++;return{status:429,headers:{get:()=> '3600'}};}});await assert.rejects(request('grid'),/3600 sekunder/);assert.equal(calls,1);});
