import * as THREE from 'three';

const hash=(x,y,seed=1)=>{let v=(Math.imul(x+seed,374761393)^Math.imul(y-seed,668265263))>>>0;v=Math.imul(v^(v>>>13),1274126177)>>>0;return (v^(v>>>16))>>>0;};
const noise=(x,y,seed=1)=>hash(Math.floor(x),Math.floor(y),seed)/4294967295;
function texture(size,pixel,{repeat=[1,1],color=true}={}){
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const value=pixel(x/size,y/size,x,y),p=(y*size+x)*4;const rgb=Array.isArray(value)?value:[value,value,value];for(let c=0;c<3;c++)data[p+c]=Math.max(0,Math.min(255,Math.round(rgb[c])));data[p+3]=255;}
 const map=new THREE.DataTexture(data,size,size);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...repeat);map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
}
export function oakMaps({floor=false,deck=false}={}){
 const size=512,boards=floor?8:1;
 function grain(u,v,x,y){const board=Math.floor(u*boards),s=u*boards-board,t=v*2+(board%2)*.5;
  const curve=Math.sin(v*13+board*.7)*.10+Math.sin(v*37+board)*.025;
  const lines=Math.sin((s+curve)*180+Math.sin(v*7)*3)*2.5+Math.sin((s+curve)*421)*1.5;
  const broad=Math.sin((s+Math.sin(v*3)*.07)*29)*2.5;
  const tint=(noise(board,0,21)-.5)*12,pores=noise(x,y,17)>.982?-12:0;
  const joint=floor&&(s<.004||s>.996||Math.abs(t-Math.round(t))<.0025)?-32:0;
  return 242+tint+lines+broad+(noise(x,y)-.5)*6+pores+joint;
 }
 const map=texture(size,grain,{repeat:floor?[1/1.6,1/3.2]:[2,1]});
 const bump=texture(size,(u,v,x,y)=>{const board=Math.floor(u*boards),s=u*boards-board;return floor&&(s<.004||s>.996)?50:185+(grain(u,v,x,y)-240)*1.2;},{repeat:floor?[1/1.6,1/3.2]:[2,1],color:false});
 const roughness=texture(size,(u,v,x,y)=>200+(grain(u,v,x,y)-242)*.7,{repeat:floor?[1/1.6,1/3.2]:[2,1],color:false});
 if(deck)for(const t of [map,bump,roughness]){t.rotation=Math.PI/2;t.center.set(.5,.5);}
 return {map,bumpMap:bump,roughnessMap:roughness};
}
export function fabricMaps(){
 const map=texture(256,(u,v,x,y)=>239+(noise(x,y)-.5)*19+Math.sin(x*Math.PI)*2);
 const bump=texture(256,(u,v,x,y)=>140+(noise(x,y)-.5)*70+((x+y)%2?15:-15),{color:false});
 map.repeat.set(7,7);bump.repeat.set(7,7);return {map,bumpMap:bump};
}
export function floorMaterial(tile=false){
 if(tile){const map=texture(256,(u,v,x,y)=>{const edge=(u%(.5))<.003||(v%(.5))<.003;return edge?193:241+(noise(x,y)-.5)*7;},{repeat:[1/1.2,1/1.2]});return new THREE.MeshStandardMaterial({color:'#ddd7cd',map,roughness:.73});}
 return new THREE.MeshStandardMaterial({color:'#e0c397',...oakMaps({floor:true}),bumpScale:.0035,roughness:.68,metalness:0});
}
export function blackTimberMaterial(){
 const map=texture(256,(u,v,x,y)=>{const bow=Math.sin(v*9)*.03+Math.sin(v*31)*.006;return 218+Math.sin((u+bow)*190)*8+Math.sin((u+bow)*420)*4+(noise(x,y)-.5)*9;});
 const bump=texture(256,(u,v,x,y)=>130+Math.sin((u+Math.sin(v*9)*.03)*190)*17+(noise(x,y)-.5)*15,{color:false});
 map.repeat.set(2,1);bump.repeat.set(2,1);
 return new THREE.MeshStandardMaterial({color:'#272b29',map,bumpMap:bump,bumpScale:.008,roughness:.82,metalness:.04});
}
export function gravelMaterial(){return new THREE.MeshStandardMaterial({color:'#79766c',roughness:1,map:texture(256,(u,v,x,y)=>{const a=noise(x>>2,y>>2,7),b=noise(x,y,9);return 110+a*110+b*30;}),bumpScale:.01});}
export function softContactTexture(){
 const map=texture(64,()=>255);const data=map.image.data;
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const r=Math.max(Math.abs(x-31.5),Math.abs(y-31.5))/31.5,p=(y*64+x)*4;data[p]=data[p+1]=data[p+2]=0;data[p+3]=Math.round(255*Math.pow(Math.max(0,1-r*r),2));}map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;map.generateMipmaps=false;map.minFilter=THREE.LinearFilter;map.needsUpdate=true;return map;
}

// A small studio reflection probe used only by the matte charger materials.
// It does not add artificial room lights or depend on a network image.
export function chargerSurfaceMaps(){
 const map=texture(256,(u,v,x,y)=>239+(noise(x,y,29)-.5)*13);
 const bump=texture(256,(u,v,x,y)=>130+(noise(x,y,29)-.5)*100,{color:false});
 const roughness=texture(256,(u,v,x,y)=>193+(noise(x,y,43)-.5)*19,{color:false});
 return {map,bumpMap:bump,roughnessMap:roughness};
}
export function chargerEnvironment(){
 if(typeof document==='undefined')return null;
 const faces=Array.from({length:6},(_,face)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createLinearGradient(0,0,128,128);gradient.addColorStop(0,face===0?'#bdb7a9':'#817f7a');gradient.addColorStop(.4,'#545550');gradient.addColorStop(1,'#181c1e');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);if(face===0||face===4){const strip=ctx.createLinearGradient(0,0,128,0);strip.addColorStop(0,'#ffffff00');strip.addColorStop(.2,'#ece6d399');strip.addColorStop(.32,'#ece6d3cc');strip.addColorStop(.4,'#ffffff00');ctx.fillStyle=strip;ctx.fillRect(0,0,128,128);}return canvas;});
 const cube=new THREE.CubeTexture(faces);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;return cube;
}
