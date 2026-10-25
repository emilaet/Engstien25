// Source of truth: Floorplan.png (2466 × 1392). Positions are traced in source
// pixels, then converted using the dimensioned 2.9 m rear room depth (~220 px).
// Furniture symbols, door swing arcs and the OPTIONAL alcove are not walls.
export const drawing = { origin: [554, 188], pixelsPerMeter: 76, file: 'Floorplan.png' };
export const toPlan = ([x, z]) => [(x - drawing.origin[0]) / 76, (z - drawing.origin[1]) / 76];
export const interior = { width: (2026 - 554) / 76, depth: (707 - 188) / 76 };
export const finishedFloor = .12;
// Facade fra SV.png explicitly indicates 2.4 m at the rear and 3.1 m at garden.
export const ceilingHeight = z => 2.4 + .7 * Math.max(0, Math.min(1, z / interior.depth));

const rect = (x1,z1,x2,z2) => [[x1,z1],[x2,z1],[x2,z2],[x1,z2]];
export const floorPixels = {
 bad1: rect(554,188,694,412),
 sove: rect(694,188,942,412),
 walk: rect(942,188,1114,412),
 kokken: [[1114,188],[1368,188],[1368,316],[1413,316],[1413,412],[1114,412]],
 depot: rect(1368,188,1459,316),
 v1: [[1459,188],[1716,188],[1716,412],[1413,412],[1413,316],[1459,316]],
 v2: rect(1716,188,2026,412),
 // Open functional zones; no wall between living, dining and kitchen.
 stue: rect(554,412,990,707),
 alrum: rect(990,412,1368,707),
 gang: rect(1368,412,1811,518),
 bad2: rect(1368,518,1512,707),
 bryggers: rect(1512,518,1705,707),
 entre: [[1705,518],[1811,518],[1811,604],[1857,604],[1857,707],[1705,707]],
 kontor: [[1811,412],[2026,412],[2026,707],[1857,707],[1857,604],[1811,604]],
};

function wall(id, axis, fixed, start, end, thickness = 8, extra = {}) {
 const p = toPlan(axis === 'x' ? [start, fixed] : [fixed, start]);
 const q = toPlan(axis === 'x' ? [end, fixed] : [fixed, end]);
 return { id, axis, from: p, to: q, length: (end-start)/76, thickness: thickness/76, openings: [], ...extra };
}
export const walls = [
 wall('rear','x',173,524,2058,30,{exterior:true}),
 wall('garden','x',723,524,2058,32,{exterior:true}),
 wall('west','z',539,188,707,30,{exterior:true}),
 wall('east','z',2042,188,707,32,{exterior:true}),
 wall('bath-bedroom','z',694,188,412),
 wall('bedroom-walk','z',942,188,412),
 wall('suite-kitchen','z',1114,188,412),
 wall('suite-living','x',412,554,1114),
 wall('pantry-kitchen','z',1368,188,316),
 wall('pantry-bedroom','z',1459,188,316),
 wall('pantry-south','x',316,1368,1459,8,{inferred:true}),
 wall('tower-bedroom','z',1413,316,412),
 wall('bedrooms','z',1716,188,412),
 wall('bedrooms-hall','x',412,1368,2026),
 wall('hall-service','x',518,1368,1705),
 wall('bath-living','z',1368,518,707),
 wall('bath-utility','z',1512,518,707),
 wall('utility-entry','z',1705,518,707),
 wall('office-entry-upper','z',1811,412,604),
 wall('office-entry-step','x',604,1811,1857),
 wall('office-entry-lower','z',1857,604,707),
 wall('carport-west','z',1723,836,1262,12,{scope:'outbuilding',height:2.2}),
 wall('carport-south','x',1262,1723,2247,12,{scope:'outbuilding',height:2.2}),
 wall('shed-north','x',971,1723,1863,12,{scope:'outbuilding',height:2.2}),
 wall('shed-east','z',1863,971,1262,12,{scope:'outbuilding',height:2.2}),
];
const getWall = id => walls.find(w => w.id === id);
function opening(id, wallId, startPx, endPx, kind, extra = {}) {
 const w = getWall(wallId);
 const axisIndex = w.axis === 'x' ? 0 : 1;
 const offsetOrigin = drawing.origin[axisIndex];
 const start = (startPx-offsetOrigin)/76-w.from[axisIndex];
 const end = (endPx-offsetOrigin)/76-w.from[axisIndex];
 const result = {id,wall:wallId,start,end,kind,sill:0,head:2.1,...extra};
 w.openings.push(result);return result;
}
export const doors = [
 opening('bath1-door','bath-bedroom',333,401,'door',{rooms:['sove','bad1'],hinge:'end',swing:70}),
 opening('suite-door','suite-living',989,1056,'door',{rooms:['stue','walk'],hinge:'end',swing:-70}),
 opening('pantry-door','pantry-kitchen',270,316,'door',{rooms:['kokken','depot'],hinge:'start',swing:-70,finish:'oak',head:2.129}),
 opening('bedroom1-door','bedrooms-hall',1635,1704,'door',{rooms:['gang','v1'],hinge:'end',swing:-70}),
 opening('bedroom2-door','bedrooms-hall',1730,1798,'door',{rooms:['gang','v2'],hinge:'start',swing:70}),
 opening('bath2-door','hall-service',1430,1498,'door',{rooms:['gang','bad2'],hinge:'end',swing:70}),
 opening('utility-door','utility-entry',585,650,'door',{rooms:['entre','bryggers'],hinge:'start',swing:-70}),
 opening('office-door','office-entry-upper',427,495,'door',{rooms:['gang','kontor'],hinge:'start',swing:70}),
 opening('shed-door','shed-east',985,1054,'door',{rooms:['carport','shed'],hinge:'start',swing:-70,finish:'oak'}),
 opening('entrance-door','garden',1722,1795,'door',{rooms:['outside','entre'],hinge:'start',swing:70,glazed:true}),
];
export const passages = [
 opening('bedroom-walk-passage','bedroom-walk',337,412,'passage',{rooms:['sove','walk'],head:'ceiling'}),
];
export const windows = [
 opening('rear-bath1','rear',632,678,'window',{room:'bad1',sill:.9,head:2.05}),
 opening('rear-bedroom-left','rear',705,751,'window',{room:'sove',sill:.9,head:2.05}),
 opening('rear-bedroom-right','rear',886,933,'window',{room:'sove',sill:.9,head:2.05}),
 opening('rear-walk','rear',1004,1050,'window',{room:'walk',sill:.9,head:2.05}),
 opening('rear-kitchen','rear',1218,1356,'window',{room:'kokken',sill:.9,head:2.05,columns:[.32]}),
 opening('rear-bedroom1','rear',1504,1641,'window',{room:'v1',sill:.9,head:2.05,columns:[.32]}),
 opening('east-bedroom2','east',247,381,'window',{room:'v2',sill:.9,head:2.05,columns:[.68]}),
 opening('east-office','east',518,653,'window',{room:'kontor',sill:.9,head:2.05,columns:[.68]}),
 opening('west-living','west',421,518,'window',{room:'stue',sill:.9,head:2.35}),
 opening('garden-living-narrow','garden',554,623,'window',{room:'stue',sill:0,head:3.1,transoms:[1,2.1]}),
 opening('terrace-glazing','garden',1072,1364,'glazed-assembly',{room:'alrum',sill:0,head:3.1,columns:[.25,.5,.75],transoms:[2.1],door:{panel:0,hinge:'start',swing:-70,head:2.1}}),
 opening('garden-bath2','garden',1449,1497,'window',{room:'bad2',sill:.9,head:2.05}),
 opening('garden-utility','garden',1559,1650,'window',{room:'bryggers',sill:.9,head:2.05}),
];
export const openings = [...doors,...passages,...windows];

// Subdivide each wall around REAL openings, including lintels and sills.
// A window is never a glass plane placed over a solid wall.
export function wallSections(w) {
 const cuts=[0,w.length,...w.openings.flatMap(o=>[o.start,o.end])].sort((a,b)=>a-b);
 const sections=[];
 for(let i=0;i<cuts.length-1;i++){
  const start=cuts[i],end=cuts[i+1];if(end-start<1e-6)continue;
  const opening=w.openings.find(o=>(start+end)/2>o.start && (start+end)/2<o.end);
  if(!opening)sections.push({start,end,bottom:0,top:'ceiling'});
  else{
   if(opening.sill>0)sections.push({start,end,bottom:0,top:opening.sill});
   if(opening.head!=='ceiling')sections.push({start,end,bottom:opening.head,top:'ceiling'});
  }
 }
 return sections;
}
export function openingPosition(o, distance=(o.start+o.end)/2){
 const w=getWall(o.wall);return w.axis==='x'?[w.from[0]+distance,w.from[1]]:[w.from[0],w.from[1]+distance];
}
export function containsPoint(polygon, x, z) {
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [xi,zi]=polygon[i],[xj,zj]=polygon[j];
  if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;
 }
 return inside;
}
