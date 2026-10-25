// Meter coordinates traced from Floorplan.png. Heights are provisional.
export const rooms = [
 {id:'bad1',name:'Bad ved soveværelse',short:'Bad 1',x:0,z:0,w:1.8,d:2.9,area:5.2,tile:true},
 {id:'sove',name:'Soveværelse',short:'Soveværelse',x:1.95,z:0,w:3.2,d:2.9,area:9.3},
 {id:'walk',name:'Walk-in',short:'Walk-in',x:5.3,z:0,w:2.2,d:2.9,area:6.3},
 {id:'kokken',name:'Køkken',short:'Køkken',x:7.65,z:0,w:3.3,d:2.9,area:10.6},
 {id:'depot',name:'Depot',short:'Depot',x:11.1,z:0,w:1.05,d:1.55,area:1.8},
 {id:'v1',name:'Værelse 1',short:'Værelse 1',x:12.3,z:0,w:3.9,d:2.9,area:10.3},
 {id:'v2',name:'Værelse 2',short:'Værelse 2',x:16.35,z:0,w:4,d:2.9,area:11.7},
 {id:'stue',name:'Stue',short:'Stue',x:0,z:3.05,w:6.9,d:3.9,area:22.1,curtains:['Stort vinduesparti','Vindue ved sofa','Gavlvindue']},
 {id:'alrum',name:'Alrum',short:'Alrum',x:6.9,z:3.05,w:4.05,d:3.9,area:19.1},
 {id:'gang',name:'Gang',short:'Gang',x:11.1,z:3.05,w:6.1,d:1.3,area:7.6},
 {id:'bad2',name:'Gæstebad',short:'Bad 2',x:11.1,z:4.5,w:1.8,d:2.45,area:4.4,tile:true},
 {id:'bryggers',name:'Bryggers',short:'Bryggers',x:13.05,z:4.5,w:2.5,d:2.45,area:6,tile:true},
 {id:'entre',name:'Entré',short:'Entré',x:15.7,z:4.5,w:1.5,d:2.45,area:4.1,tile:true},
 {id:'kontor',name:'Kontor',short:'Kontor',x:17.35,z:3.05,w:3,d:3.9,area:9.9},
];
export function initialState(){return Object.fromEntries(rooms.map((r,i)=>[r.id,{lights:{loft:['stue','kokken','alrum'].includes(r.id),lampe:r.id==='stue'},brightness:75,current:Math.round((21+i%3*.3)*10)/10,target:22,curtains:(r.curtains||[]).map(()=>65)}]));}
export function toggleRoom(state,id){const on=Object.values(state[id].lights).some(Boolean);for(const key of Object.keys(state[id].lights))state[id].lights[key]=!on;}
export function chargingEstimate(battery,target,capacity,power){return power>0?Math.max(0,target-battery)/100*capacity/power:null;}
