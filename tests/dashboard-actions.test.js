import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoFamilyProvider,addDays} from '../src/family-data.js';
import {dailyBriefing} from '../src/daily-briefing.js';
import {monthDays,shiftMonth,validNoteDate} from '../src/note-editor.js';
import {chargeTiming} from '../src/vehicle-data.js';
const memory=()=>{const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('Notes are created atomically with their date and remarks; impossible dates do not leave an unfinished item',async()=>{
 const disk=memory(),p=createDemoFamilyProvider({storage:disk,now:()=>new Date('2026-11-13T11:00:00Z')});let data=await p.addItem('tasks','Til i morgen',{due:'2026-11-14',detail:'Tag tasken med'});assert.equal(data.tasks[0].due,'2026-11-14');assert.equal(data.tasks[0].detail,'Tag tasken med');const before=structuredClone(data.tasks);await assert.rejects(p.addItem('tasks','Ugyldig',{due:'2026-02-30'}));data=await p.load();assert.deepEqual(data.tasks,before);assert.equal((await createDemoFamilyProvider({storage:disk}).load()).tasks[0].detail,'Tag tasken med');
});
test('Tomorrow reminders survive older overdue tasks and every overdue reminder is explicitly marked',()=>{
 const today='2026-11-13',tasks=Array.from({length:6},(_,i)=>({id:'old-'+i,text:'Gammel '+i,due:addDays(today,-i-1)}));tasks.unshift({id:'new',text:'I morgen',due:addDays(today,1)});const items=dailyBriefing({today,tasks,waste:[{label:'Affald',date:today}],calendar:[{title:'Aftale',day:today,start:'12.00'}]});assert.equal(items.filter(i=>i.target==='tasks').length,7);assert.equal(items.find(i=>i.itemId==='new').overdue,false);assert.ok(items.filter(i=>i.itemId?.startsWith('old')).every(i=>i.overdue&&i.detail.startsWith('Forfalden')));
});
test('The custom date calendar uses Monday weeks and handles leap years and year boundaries',()=>{
 assert.equal(monthDays('2026-11-01')[0],'2026-10-26');assert.equal(monthDays('2026-11-01').length,42);assert.equal(shiftMonth('2026-12-01',1),'2027-01-01');assert.equal(shiftMonth('2026-01-01',-1),'2025-12-01');assert.equal(validNoteDate('2028-02-29'),true);assert.equal(validNoteDate('2026-02-29'),false);
});
test('Tesla timing formats duration and completion in Copenhagen, including tomorrow and elapsed live estimates',()=>{
 const now=new Date('2026-11-13T22:30:00Z'),base={status:'charging',quality:'demo',battery:70,target:90,remainingMinutes:91};let t=chargeTiming(base,now);assert.equal(t.duration,'1 t 31 min');assert.equal(t.clock,'01.01');assert.equal(t.prefix,'i morgen kl. ');t=chargeTiming({...base,quality:'live',updatedAt:'2026-11-13T22:20:00Z'},now);assert.equal(t.minutes,81);assert.equal(t.clock,'00.51');for(const patch of [{status:'paused'},{quality:'cached'},{battery:null}])assert.equal(chargeTiming({...base,...patch},now),null);assert.equal(chargeTiming({...base,remainingMinutes:undefined},now),null);
});
