import {daysBetween,relativeDay} from './family-data.js';
export function dailyBriefing({today,tasks=[],waste=[],calendar=[],wasteStatus='demo'}){
 const items=[];
 const next=calendar.find(e=>daysBetween(e.day,today)>=0&&daysBetween(e.day,today)<=1);
 if(next)items.push({target:'calendar',label:next.title,detail:relativeDay(next.day,today)+' · '+next.start});
 const pickup=wasteStatus!=='offline'&&waste.find(e=>daysBetween(e.date,today)>=0&&daysBetween(e.date,today)<=1);
 if(pickup)items.push({target:'waste',label:pickup.label,shortDetail:pickup.date===today?'Tømmes i dag':'Frem i aften',detail:pickup.date===today?'Tømning i dag':'Sæt beholderen frem i aften'});
 const task=tasks.filter(t=>!t.done&&t.due&&daysBetween(t.due,today)<=1).sort((a,b)=>a.due.localeCompare(b.due))[0];
 if(task)items.push({target:'tasks',itemId:task.id,label:task.text,detail:daysBetween(task.due,today)<0?'Forfalden · '+relativeDay(task.due,today):relativeDay(task.due,today)});
 return items.slice(0,3);
}
