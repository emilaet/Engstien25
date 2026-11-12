import {walls,finishedFloor} from './architecture.js';

// The three marked solid sections of the garden facade, clear of all glazing.
export const facadeLampXs=[1.8,6.2,11.1];
export function siteLights(){
 const wall=walls.find(w=>w.id==='garden'),z=wall.from[1]+wall.thickness/2+.10;
 return facadeLampXs.map((x,index)=>({id:'entre:ude:'+index,room:'entre',key:'ude',scope:'outside',name:'Væglampe ved terrasse',kind:'exterior',fixtureVisible:false,position:[x,finishedFloor+1.9,z],radius:2.5,power:2.8,kelvin:2700}));
}
