import {daysBetween,relativeDay} from './family-data.js';
export function dailyBriefing({today,tasks=[],waste=[],calendar=[],wasteStatus='demo'}){
 const items=[];
 const next=calendar.find(e=>daysBetween(e.day,today)>=0&&daysBetween(e.day,today)<=1);
 if(next)items.push({target:'calendar',label:next.title,detail:relativeDay(next.day,today)+' · '+next.start});
 const pickup=wasteStatus!=='offline'&&waste.find(e=>daysBetween(e.date,today)>=0&&daysBetween(e.date,today)<=1);
 if(pickup)items.push({target:'waste',label:pickup.label,shortDetail:pickup.date===today?'Tømmes i dag':'Frem i aften',detail:pickup.date===today?'Tømning i dag':'Sæt beholderen frem i aften'});
 const relevant=tasks.filter(t=>!t.done&&t.due&&daysBetween(t.due,today)<=1);
 for(const task of relevant){const overdue=daysBetween(task.due,today)<0;items.push({target:'tasks',itemId:task.id,label:task.text,overdue,detail:overdue?'Forfalden · '+relativeDay(task.due,today):relativeDay(task.due,today)});}
 return items;
}
