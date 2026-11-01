// Grid coordinates are zero-based. Rows are 16px including the gutter.
export const overlaps=(a,b)=>a.column<b.column+b.width&&b.column<a.column+a.width&&a.row<b.row+b.rows&&b.row<a.row+a.rows;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function clearBelow(rect,placed){
 let hits=placed.filter(other=>overlaps(rect,other));
 while(hits.length){rect.row=Math.max(...hits.map(other=>other.row+other.rows));hits=placed.filter(other=>overlaps(rect,other));}
 return rect;
}
export function arrangeGrid(items,{minimum=2,stack=false}={}){
 const entries=items.filter(item=>item.visible!==false).map((item,index)=>({...item,index,width:stack?12:clamp(Math.max(minimum,item.width),2,12),rows:Math.max(1,item.rows)}));
 if(stack){
  entries.sort((a,b)=>a.mobileOrder!==undefined||b.mobileOrder!==undefined?(a.mobileOrder??a.index)-(b.mobileOrder??b.index):(a.row??a.index)-(b.row??b.index)||(a.column??0)-(b.column??0));
  let row=0;return entries.map(item=>{const rect={id:item.id,column:0,row,width:12,rows:item.rows};row+=item.rows;return rect;});
 }
 const placed=[];
 for(const item of entries.filter(item=>Number.isInteger(item.column)&&Number.isInteger(item.row)).sort((a,b)=>a.row-b.row||a.column-b.column||a.index-b.index)){
  placed.push(clearBelow({id:item.id,column:clamp(item.column,0,12-item.width),row:Math.max(0,item.row),width:item.width,rows:item.rows},placed));
 }
 let row=0,column=0;
 for(const item of entries.filter(item=>!Number.isInteger(item.column)||!Number.isInteger(item.row))){
  let rect;
  for(;;){if(column+item.width>12){column=0;row++;}rect={id:item.id,column,row,width:item.width,rows:item.rows};if(!placed.some(other=>overlaps(rect,other)))break;column++;}
  placed.push(rect);column+=item.width;
 }
 return items.filter(item=>item.visible!==false).map(item=>placed.find(rect=>rect.id===item.id));
}
export function relocateGrid(rectangles,id,{column,row,width,rows}){
 const source=rectangles.find(rect=>rect.id===id);if(!source)return rectangles.map(rect=>({...rect}));
 const picked={...source,width:clamp(width??source.width,2,12),rows:Math.max(1,rows??source.rows)};
 picked.column=clamp(Math.round(column??source.column),0,12-picked.width);picked.row=clamp(Math.round(row??source.row),0,1000);
 const rest=rectangles.filter(rect=>rect.id!==id).map(rect=>({...rect})),hits=rest.filter(rect=>overlaps(rect,picked));
 // Exchange matching slots instead of pushing an entire row down.
 if(hits.length===1&&picked.column===hits[0].column&&picked.row===hits[0].row&&hits[0].width<=source.width&&hits[0].rows<=source.rows){
  const replacement={...hits[0],column:source.column,row:source.row};
  if(!overlaps(replacement,picked)&&!rest.some(rect=>rect.id!==replacement.id&&overlaps(rect,replacement)))Object.assign(hits[0],replacement);
 }
 const placed=[picked];
 for(const rect of rest.sort((a,b)=>a.row-b.row||a.column-b.column))placed.push(clearBelow(rect,placed));
 return rectangles.map(rect=>placed.find(other=>other.id===rect.id));
}
export function reorderStack(rectangles,id,top){
 const picked=rectangles.find(rect=>rect.id===id);if(!picked)return rectangles.map(rect=>({...rect}));
 const rest=rectangles.filter(rect=>rect.id!==id).sort((a,b)=>a.row-b.row),center=top;
 let index=rest.findIndex(rect=>center<=rect.row+rect.rows/2);if(index<0)index=rest.length;rest.splice(index,0,picked);
 let row=0;return rest.map(rect=>{const next={...rect,column:0,row};row+=rect.rows;return next;});
}
export function snapGridRow(row,rectangles){
 const edges=[0,...rectangles.flatMap(r=>[r.row,r.row+r.rows])],nearest=edges.reduce((a,b)=>Math.abs(b-row)<Math.abs(a-row)?b:a);
 return Math.max(0,Math.abs(nearest-row)<=2?nearest:Math.round(row));
}

export function shiftStack(rectangles,id,direction){
 const ordered=[...rectangles].sort((a,b)=>a.row-b.row),from=ordered.findIndex(r=>r.id===id);if(from<0)return ordered.map(r=>({...r}));
 const [picked]=ordered.splice(from,1);ordered.splice(Math.max(0,Math.min(ordered.length,from+direction)),0,picked);let row=0;return ordered.map(r=>{const next={...r,row,column:0};row+=r.rows;return next;});
}
