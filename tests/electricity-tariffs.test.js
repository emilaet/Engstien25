import test from 'node:test';import assert from 'node:assert/strict';
import {tariffUrls,normalizeTariffs,totalElectricityPrice,createTariffProvider} from '../src/electricity-tariffs.js';
import {normalizeWidgetOptions} from '../src/widget-preferences.js';
import {tariffFixture} from './fixtures/tariffs.js';
const memory=()=>{const values=new Map();return{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};};
const records=()=>tariffUrls('dinel').flatMap(url=>normalizeTariffs(tariffFixture(url).records));
const options={grid:'dinel',supplierMarkup:0,vat:true},period={at:'2026-11-13T11:00:00Z',price:.608};
test('Total adds hourly grid, Energinet, tax and supplier before applying VAT once',()=>{
 const tariffs={records:records()},cost=totalElectricityPrice(period,tariffs,options);
 assert.ok(Math.abs(period.price*1.25-.76)<1e-10);assert.ok(Math.abs(cost.total-1.15)<1e-10);assert.ok(Math.abs(cost.grid-.197)<1e-10);
 assert.ok(Math.abs(totalElectricityPrice(period,tariffs,{...options,supplierMarkup:5}).total-1.2)<1e-10);
 assert.ok(Math.abs(totalElectricityPrice(period,tariffs,{...options,vat:false}).total-.92)<1e-10);
 const peak=totalElectricityPrice({...period,at:'2026-11-13T17:00:00Z'},tariffs,options);assert.ok(peak.total>cost.total);
 const negative=totalElectricityPrice({...period,price:-1},tariffs,options);assert.ok(negative.total<0);
});
test('Tariffs honour validity dates, Copenhagen/DST hours, latest revisions and missing components',()=>{
 const rows=records(),tariffs={records:rows},summer=rows.find(r=>r.gln==='5790000610099');
 summer.to='2026-10-01';const winter={...summer,from:'2026-10-01',to:'2027-01-01',prices:summer.prices.map(p=>p*2)};rows.push(winter);
 assert.equal(totalElectricityPrice(period,tariffs,options).grid,.394);
 assert.equal(totalElectricityPrice({...period,at:'2027-01-01T01:00:00Z'},tariffs,options),null);
 assert.equal(totalElectricityPrice(period,{records:rows.filter(r=>r.note!=='Elafgift')},options),null);
 assert.equal(totalElectricityPrice(period,{records:rows.filter(r=>r.gln!=='5790000610099')},options),null);
 for(const at of ['2026-10-25T00:00:00Z','2026-10-25T01:00:00Z'])assert.equal(totalElectricityPrice({...period,at},tariffs,options).grid,.12);
 rows.push({...winter,prices:winter.prices.map(()=>9)});assert.equal(totalElectricityPrice(period,tariffs,options),null);
 assert.throws(()=>normalizeTariffs([{ValidFrom:'2026-01-01',Price1:null}]));
});
test('Tariff fetching caches, refreshes per grid, backs off failures and never uses expired tax',async()=>{
 let at=new Date(period.at),fail=false,calls=0;const storage=memory(),fetchImpl=async url=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>tariffFixture(url)};};
 const provider=createTariffProvider({storage,fetchImpl,now:()=>at});let value=await provider.load();assert.equal(value.status,'live');assert.equal(calls,2);await provider.load();assert.equal(calls,2);
 const restored=createTariffProvider({storage,fetchImpl,now:()=>at});assert.equal((await restored.load()).status,'cached');assert.equal(calls,2);
 value=await provider.load({gridCompany:'n1'});assert.equal(value.grid,'n1');assert.equal(calls,4);
 fail=true;value=await provider.load({force:true});assert.equal(value.status,'cached');assert.ok(totalElectricityPrice(period,value,{...options,grid:'n1'}));
 at=new Date('2027-01-01T12:00:00Z');value=await provider.load();assert.equal(totalElectricityPrice({...period,at:at.toISOString()},value,{...options,grid:'n1'}),null);
 const before=calls;await provider.load();assert.equal(calls,before);
});
test('Supplier markup is validated and old electricity options migrate with net and taxes enabled',()=>{
 assert.equal(normalizeWidgetOptions('electricity',{vat:true}).grid,'dinel');assert.equal(normalizeWidgetOptions('electricity',{supplierMarkup:'6.25'}).supplierMarkup,6.25);
 for(const value of [-1,201,'wrong',null])assert.equal(normalizeWidgetOptions('electricity',{supplierMarkup:value}).supplierMarkup,0);
});
