import {chargerPlacement} from './charger.js';
export function siteLights(){
 const [x,,z]=chargerPlacement().position;
 return [[1,10.85],[4,10.85],[7,10.85],[10,10.85],[12.2,10.85],[-.7,4.7],[14.8,12.3],[x-.025,z+.28]].map(([px,pz],index)=>({id:'entre:ude:'+index,room:'entre',key:'ude',scope:'outside',name:'Udelys ved terrasse og carport',kind:'exterior',fixtureVisible:false,position:[px,.24,pz],radius:3.1,power:3.5,kelvin:2700}));
}
