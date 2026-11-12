import {walls,finishedFloor} from './architecture.js';

// The three marked solid sections of the garden facade, clear of all glazing.
export const facadeLampXs=[1.8,6.2,11.1];
export function facadeLights(){
 const wall=walls.find(w=>w.id==='garden'),z=wall.from[1]+wall.thickness/2+.10;
 return facadeLampXs.map((x,index)=>({id:'outside:wall:'+index,room:'outside',key:'wall',scope:'outside',name:'Væglampe ved terrasse',kind:'exterior',fixtureVisible:false,position:[x,finishedFloor+1.9,z],radius:2.5,power:2.8,kelvin:2700}));
}
export function carportSpotLights(){return [18.4,20.8].flatMap((x,i)=>[8.5,10.7,12.9].map((z,j)=>({id:`outside:spots:${i*3+j}`,room:'outside',key:'spots',scope:'outside',name:'Spot i carporten',kind:'carport-spot',fixtureVisible:false,position:[x,2.225,z],radius:3.1,power:6,kelvin:3000})));}
export function siteLights(){return [...facadeLights(),...carportSpotLights()];}
