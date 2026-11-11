import {toPlan} from './architecture.js';

// Approved concept: building openings stay traced from Floorplan.png. Garden
// outlines follow the reviewed site plan; the driveway grade is user supplied.
export const outdoorY=.085;
export const gardenZ=toPlan([554,739])[1];
export const carportArea={minX:toPlan([1717,739])[0],maxX:toPlan([2247,739])[0],minZ:gardenZ,maxZ:toPlan([2247,1267])[1]};
export const driveway={startX:carportArea.maxX,endX:carportArea.maxX+5,minZ:carportArea.minZ,maxZ:carportArea.maxZ,rise:1,run:5};
export const westTerrace=[[-4.6,2.8],[-.4,2.8],[-.4,8.65],[-3.2,8.65],[-3.2,7.3],[-4.6,7.3]];
export const gardenWalk=[[-.4,gardenZ],[6.6,gardenZ],[6.6,8.65],[-.4,8.65]];
export const mainTerrace=[[6.6,gardenZ],[carportArea.minX,gardenZ],[carportArea.minX,12.7],[8.0,12.7],[8.0,10.5],[6.6,10.5]];
export const terracePolygons=[westTerrace,gardenWalk,mainTerrace];
export const plantingBeds=[
 {id:'west-notch',polygon:[[-4.6,7.3],[-3.2,7.3],[-3.2,8.65],[-3.65,8.65],[-3.65,7.75],[-4.6,7.75]]},
 {id:'main-l',polygon:[[5.7,9.9],[8.0,9.9],[8.0,12.7],[7.45,12.7],[7.45,10.5],[5.7,10.5]]},
 {id:'shed-edge',polygon:[[14.65,10.8],[15.15,10.8],[15.15,13.8],[14.65,13.8]]},
];
export const plotOutline=[[-10,-3.5],[24.6,-3.5],[driveway.endX,1],[driveway.endX,18.4],[-8.3,19.6],[-10,14]];
export const outdoorPlacement={dining:{x:-2.35,z:5.3},lounge:{x:11.5,z:10.7},grill:{x:12.8,z:7.7},storage:{x:14.9,z:9.9},pots:[{x:5.4,z:7.65},{x:14.15,z:8.9}]};
// The covered slab is horizontal. Only the five metres outside its east opening
// lose one metre toward the street; adjacent front lawn follows the same grade.
export function approachHeight(x){return outdoorY-Math.max(0,Math.min(1,(x-driveway.startX)/driveway.run))*driveway.rise;}
export function lawnHeight(x){return approachHeight(x)-.065;}
export function insidePolygon(x,z,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,zi]=polygon[i],[xj,zj]=polygon[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}
