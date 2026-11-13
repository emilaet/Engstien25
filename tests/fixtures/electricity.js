import {addDays} from '../../src/family-data.js';
export function electricityFixture(day='2026-11-13',{quarterly=false,area='DK1'}={}){
 const startOf=day=>{const zero=new Date(day+'T00:00:00Z'),offset=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Copenhagen',hour:'numeric',hourCycle:'h23'}).format(zero));return zero.getTime()-offset*3600000;};
 const start=startOf(day),end=startOf(addDays(day,1)),step=quarterly?900000:3600000;
 return Array.from({length:(end-start)/step},(_,i)=>{const at=start+i*step,hour=new Date(at).getUTCHours(),price=(area==='DK2'?.1:0)+[-.12,.06,.10,.14,.25,.40,.70,.95,1.2,.9,.8,.7,.65,.5,.55,.95,1.3,1.5,1.2,.8,.55,.4,.2,.1][hour];return {DKK_per_kWh:price,EUR_per_kWh:price/7.46,EXR:7.46,time_start:new Date(at).toISOString(),time_end:new Date(at+step).toISOString()};});
}
