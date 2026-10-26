import {createJournal} from './storage.js';
import {rooms} from './house.js';
import {toPlan} from './architecture.js';
const officeSouth=toPlan([(1857+2026)/2,707]);
const entryNiche=toPlan([1857,(604+707)/2]);
const utilityNorth=toPlan([(1512+1705)/2,518]);
export const furnitureKey='engstien-furniture-v1';
const item=(id,room,name,type,x,z,width,depth,height,extra={})=>({id,room,name,type,x,z,width,depth,height,rotation:0,color:'#d8cbb7',material:'fabric',visible:true,fixed:false,reference:'',notes:'',...extra});
export const furnitureCatalog=[
 item('sove-bed','sove','Nova · seng 180 × 200','bed',3.47,1.26,1.94,2.18,1.10,{reference:'https://nordicdream.dk/products/nova-180x200-boucle-latte?variant=53502566269305',basis:'Ejerens produktlink · bouclé latte. Ydermål og gavlens form er foreløbige.'}),
 item('sove-bedside-left','sove','Venstre natbord','bedside',2.23,.52,.4,.4,.48,{material:'wood',color:'#c6aa7b',basis:'Foreløbigt forslag'}),
 item('sove-bedside-right','sove','Højre natbord','bedside',4.72,.52,.4,.4,.48,{material:'wood',color:'#c6aa7b',basis:'Foreløbigt forslag'}),
 item('stue-rug','stue','Bolia · lyst stuetæppe','rug',2.75,5.25,4.10,2.6,.025,{color:'#d6cebf',reference:'https://assets.bolia.com/cdn-cgi/image/background=transparent,fit=contain,width=1024,format=auto,height=768,quality=81/globalassets/media/4.-collections/fy25/fy25ss/miljo/living-room/nuvol-bowie-latch-eida-tajo-zen-classic-cushion-mingei-forma_ss25.jpg?v=1064575166',basis:'Ejerens miljøbillede · farve og størrelse er et første skøn.'}),
 item('stue-sofa','stue','Nordvik · modulsofa','sofa',3.0,6.08,3.1,1.05,.84,{color:'#d6c9b5',reference:'https://ilva.dk/products/nordvik-modulsofa-4?variant=54618220331347',basis:'Ejerfoto 26.10.2026: lige sofa med to brede sædehynder, lave brede armlæn og beige stof. Mål er skøn.'}),
 item('stue-coffee','stue','Bolia · sofabord','coffee',2.55,4.82,1.20,.90,.34,{color:'#ccb897',material:'wood',reference:'https://images.bolia.com/cdn-cgi/image/fit=pad,width=1600,background=transparent,format=auto,height=900,quality=81/products/03-139-16_00018_angle.webp?v=1',basis:'Ejerfoto 26.10.2026: afrundet lys træplade og bred, afrundet sokkel. Mål er skøn.'}),
 item('stue-armchair','stue','Bred polstret lænestol','armchair',.96,4.20,1.27,1.04,.84,{rotation:305,color:'#d6c9b5',reference:'https://content.cylindo.com/api/v2/6838/products/madrid-laenestol/frames/30/madrid-laenestol.webp?size=1024&feature=FARVE:20-ARAGON',basis:'Ejerfoto 26.10.2026: bred lænestol med samme lave armlæn og stof som sofaen. Foto går forud for det tidligere Madrid-link.'}),
 item('stue-console','stue','Lavt egetræsmøbel og TV','console',2.65,3.24,2.1,.40,1.18,{material:'wood',color:'#bda074',basis:'Foreløbigt forslag; placering mod suitevæggen.'}),
 item('stue-plant','stue','Plante i keramikkrukke','plant',5.05,6.18,.58,.58,1.0,{color:'#c5b9a3',material:'stone',basis:'Foreløbig dekoration'}),
 item('alrum-dining','alrum','Spisebord · lamelsokler og seks træstole','dining',8.5,5.27,1.0,2.25,.76,{material:'wood',color:'#c7ab7e',basis:'Ejerfoto 26.10.2026: blank, lys træbordplade med afrundede hjørner, to lamelsokler og træstole med buede rygge. Mål gælder bordet og er skøn.'}),
 item('kokken-rear','kokken','HTH · skuffer og kogeplade','kitchenRear',9.04,.34,3.252,.60,.90,{material:'wood',color:'#c5a77a',fixed:true,basis:'HTH PDF s. 1, 2 og 6 · Nordic Essence Natur Eg, 3252 mm.'}),
 item('kokken-island','kokken','HTH · køkkenø med vask','kitchenIsland',8.43,2.32,2.042,1.20,.90,{material:'wood',color:'#c5a77a',fixed:true,basis:'HTH PDF s. 1, 3, 4 og 6–9 · ca. 2042 × 1200 mm. Arbejdsfront og vandhanens tud mod nord; barstole mod syd.'}),
 item('kokken-towers','kokken','HTH · ovn og køl/frys','kitchenTowers',11.00,2.32,.56,1.20,2.129,{material:'wood',color:'#c5a77a',fixed:true,basis:'HTH PDF s. 5 · ovn og køl/frys i østnichen. Depotdøren holdes fri.'}),
 item('walk-west','walk','Walk-in · vestlig garderobe','wardrobe',5.45,.90,.55,1.65,2.1,{material:'wood',color:'#c8b394',fixed:true,basis:'Foreløbigt inventar; passage til soveværelse holdes fri.'}),
 item('walk-east','walk','Walk-in · østlig garderobe','wardrobe',7.02,.90,.55,1.65,2.1,{rotation:180,material:'wood',color:'#c8b394',fixed:true,basis:'Foreløbigt inventar; indgang og dørslag holdes fri.'}),
 item('depot-shelf','depot','Depot · hylder','shelf',11.30,.27,1.0,.4,1.8,{material:'wood',color:'#c6b18f',fixed:true,basis:'Foreløbigt forslag langs bagvæggen, fri af depotdøren.'}),
 item('bad1-vanity','bad1','HTH · bad 1 · vaskemøbel og spejl','vanity',.275,2.10,1.420,.510,1.95,{rotation:90,material:'wood',color:'#cfc2a8',fixed:true,basis:'HTH s. 18–20: 400/600/400 mm, 1420 × 510 mm, væghængt ved 279 mm, top ca. 855 mm. Vandrette profiler, hvid integreret vask og rektangulært spejl.'}),
 item('bad1-toilet','bad1','Væghængt toilet bad 1','toilet',1.45,.34,.40,.64,.43,{material:'ceramic',color:'#efeee8',fixed:true,basis:'Plantegning · stiliseret sanitetsinventar'}),
 item('bad1-shower','bad1','Bruseniche bad 1','shower',.56,.57,1.08,1.10,2.0,{material:'stone',color:'#c2b9aa',fixed:true,basis:'Plantegning og udstillingshus · placering og beslag er omtrentlige.'}),
 item('bad2-vanity','bad2','HTH · gæstebad · vaskemøbel og spejl','vanity',10.71+.265,toPlan([1512,707])[1]-1.84,1.020,.510,1.95,{rotation:90,material:'wood',color:'#cfc2a8',fixed:true,basis:'HTH s. 21–23: 1020 × 510 mm, væghængt, vandrette profiler og to skuffer, hvid integreret vask og rektangulært spejl.'}),
 item('bad2-toilet','bad2','Væghængt toilet gæstebad','toilet',12.20,toPlan([1512,707])[1]-.34,.40,.64,.43,{rotation:180,material:'ceramic',color:'#efeee8',fixed:true,basis:'Plantegning · stiliseret sanitetsinventar'}),
 item('bad2-shower','bad2','Bruseniche gæstebad','shower',11.27,toPlan([1512,707])[1]-.465,1.08,.89,2.0,{rotation:180,showerGlassSide:-1,material:'stone',color:'#c2b9aa',fixed:true,basis:'Foreløbig placering efter plantegningen, fri af indgangsdøren.'}),
 item('bryggers-units','bryggers','HTH · bryggers · vask, VM og TT','utility',utilityNorth[0],toPlan([1512,707])[1]-.31,2.46,.60,.90,{rotation:180,material:'ceramic',color:'#efeee8',fixed:true,basis:'HTH s. 13–16: Mono (ny hvid), 2460 mm. TT/VM mod vest, vask og skab mod øst. Fronter og vandhane vender ind mod rummet; lys træbordplade.'}),
 item('bryggers-technical','bryggers','HTH · teknikområde med skydelåger','slidingWardrobe',utilityNorth[0],utilityNorth[1]+.36,2.46,.72,2.75,{material:'ceramic',color:'#efeee8',fixed:true,basis:'HTH s. 13, 15 og 17: to hvide skydelåger i aluminiumsprofiler, ca. 2460 mm bredde og 2750 mm højde foran teknikområdet.'}),
 item('entre-closet','entre','HTH · entrébænk med knager','entryBench',entryNiche[0]-.565/2,entryNiche[1],1.220,.565,1.90,{rotation:270,material:'wood',color:'#cfc3aa',fixed:true,basis:'HTH s. 10–12: lav bænk, 1220 × 565 mm, sæde ca. 50 cm over gulv, vandrette profiler og træknager i nichen. Intet højskab.'}),
 item('entre-console','entre','Entré · konsolbord og rundt spejl','entryConsole',toPlan([1811,518])[0]-.15,4.92,.85,.30,1.95,{rotation:270,material:'steel',color:'#333936',fixed:true,basis:'HTH-rendering s. 12: sort konsolbord og rundt spejl ved siden af bænken. Det løse møbels præcise produkt og mål er ikke oplyst.'}),
 item('v1-wardrobe','v1','Lucas · hvidt indbygningsskab','wardrobe',toPlan([(1413+1459)/2,316])[0],toPlan([1413,(316+412)/2])[1],.56,1.20,2.30,{material:'ceramic',color:'#efeee8',fixed:true,basis:'Ejerens rettelse: indhakket mod køkken/depot er et hvidt indbygningsskab. Nichen fra plantegningen fyldes uden at flytte vægge.'}),
 item('v2-wardrobe','v2','Sophia · hvid garderobe','wardrobe',15.61,.78,.56,1.25,2.10,{material:'ceramic',color:'#efeee8',basis:'Forslag efter referencebillederne, langs vestvæggen og fri af døren.'}),
 item('v1-bench','v1','Lucas · lille træbænk','childBench',15.01,1.62,.65,.40,.56,{rotation:270,material:'wood',color:'#c9b18c',basis:'Lav bænk med stofhynde efter referencebilledernes børnehjørne; præcise mål og produkt er forslag.'}),
 item('v2-bench','v2','Sophia · lille træbænk','childBench',16.30,1.65,.65,.40,.56,{rotation:90,material:'wood',color:'#c9b18c',basis:'Lavt møbel ved siden af sengen, inspireret af referencebilledernes læsehjørne.'}),
 item('v1-bed','v1','Juniorseng · Lucas','childBed',14.22,.60,.96,2.05,.72,{rotation:270,color:'#c3c8b1',basis:'Sengen står langs bagvæggen med gavlen mod sidevæggen som i referencebillederne; juniorsengens konkrete produkt og mål er forslag.'}),
 item('v1-storage','v1','Lav opbevaring · Lucas’ værelse','toyStorage',12.55,2.65,1.05,.48,.65,{rotation:180,material:'wood',color:'#cbb68e',basis:'Foreløbigt forslag med kurve og bøger.'}),
 item('v1-rug','v1','Legetæppe · Lucas’ værelse','rug',13.30,1.85,1.70,1.35,.02,{color:'#e0daca',basis:'Lyst legetæppe med dæmpet geometrisk mønster efter referencebillederne.'}),
 item('v2-bed','v2','Juniorseng · Sophia','childBed',18.26,.60,.96,2.05,.72,{rotation:270,color:'#d2bcb0',basis:'Sengen står langs bagvæggen med gavlen mod sidevæggen som i referencebillederne; juniorsengens konkrete produkt og mål er forslag.'}),
 item('v2-storage','v2','Lav opbevaring · Sophias værelse','toyStorage',18.10,2.65,1.05,.48,.65,{rotation:180,material:'wood',color:'#cbb68e',basis:'Foreløbigt forslag med kurve og bøger.'}),
 item('v2-rug','v2','Legetæppe · Sophias værelse','rug',17.60,1.85,1.70,1.35,.02,{color:'#e0daca',basis:'Lyst legetæppe med dæmpet geometrisk mønster efter referencebillederne.'}),
 item('kontor-desk','kontor','Skrivebord og stol','desk',officeSouth[0],officeSouth[1]-.35,1.80,.70,.75,{rotation:180,material:'wood',color:'#c6ab80',basis:'Ejerens rettelse: 180 cm bredt skrivebord helt op ad sydvæggen mod carporten, med stol på rummets side. Materiale og dybde er forslag.'}),
];
const correctedLayout=new Set(['bad1-vanity','bad1-toilet','bad1-shower','bad2-vanity','bad2-toilet','bad2-shower','bryggers-units','bryggers-technical','entre-closet','kontor-desk','v1-bed','v2-bed','v1-storage','v2-storage','v1-rug','v2-rug']);
for(const item of furnitureCatalog)item.layoutRevision=correctedLayout.has(item.id)?2:1;
const spatialFields=new Set(['x','z','width','depth','height','rotation']);
function supersededField(item,key,revision){return item.layoutRevision>1&&revision!==item.layoutRevision&&(spatialFields.has(key)||(item.fixed&&['color','material','name'].includes(key)));}
export const initialFurnishing=()=>({version:1,visible:true,items:structuredClone(furnitureCatalog)});
export function footprint(item){const angle=item.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);return [[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,z])=>[item.x+x*item.width/2*c+z*item.depth/2*s,item.z-x*item.width/2*s+z*item.depth/2*c]);}
function inside(point,polygon){let found=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if(Math.abs((point[0]-a[0])*(b[1]-a[1])-(point[1]-a[1])*(b[0]-a[0]))<1e-6&&point[0]>=Math.min(a[0],b[0])-1e-6&&point[0]<=Math.max(a[0],b[0])+1e-6&&point[1]>=Math.min(a[1],b[1])-1e-6&&point[1]<=Math.max(a[1],b[1])+1e-6)return true;if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])found=!found;}return found;}
export function placementValid(item){const room=rooms.find(r=>r.id===item.room);if(!room)return false;const points=footprint(item);return points.every((p,i)=>{const q=points[(i+1)%points.length];return [0,.25,.5,.75,1].every(t=>inside([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t],room.polygon));});}
export function validateFurniture(item){return item&&furnitureCatalog.some(x=>x.id===item.id&&x.type===item.type&&x.room===item.room&&x.fixed===item.fixed)&&[item.x,item.z,item.width,item.depth,item.height,item.rotation].every(Number.isFinite)&&item.width>=.02&&item.width<=6&&item.depth>=.02&&item.depth<=6&&item.height>=.01&&item.height<=3.1&&/^#[0-9a-f]{6}$/i.test(item.color)&&['fabric','wood','stone','ceramic','steel'].includes(item.material)&&typeof item.visible==='boolean'&&(!item.reference||/^https?:\/\//.test(item.reference))&&typeof item.name==='string'&&item.name.trim().length>0&&item.name.length<=100&&typeof item.reference==='string'&&item.reference.length<=2000&&typeof item.notes==='string'&&item.notes.length<=1500&&placementValid(item);}

export function createFurnishingData(storage){
 // Replay explicit changes on the current catalog, so later model revisions reach
 // existing browsers without erasing dimensions/colors the owner actually edited.
 const fields=['name','x','z','width','depth','height','rotation','color','material','visible','reference','notes'];
 const journal=createJournal({key:furnitureKey,initial:initialFurnishing,valid:()=>false,storage,reduce(state,op){
  if(op.kind==='visibility')state.visible=!!op.value;
  const index=state.items.findIndex(i=>i.id===op.itemId);if(index<0)return;
  if(op.kind==='edit'){const patch=Object.fromEntries(Object.entries(op.patch||{}).filter(([key])=>fields.includes(key)&&!supersededField(state.items[index],key,op.revision)));const next={...state.items[index],...patch};if(validateFurniture(next))state.items[index]=next;}
  if(op.kind==='resetItem')state.items[index]=structuredClone(furnitureCatalog.find(i=>i.id===op.itemId));
 }});
 return {load:()=>journal.load(),get persistent(){return journal.persistent;},edit(id,patch){const state=journal.load(),current=state.items.find(i=>i.id===id);if(!current)throw new Error('Møblet findes ikke.');const allowed=Object.fromEntries(Object.entries(patch).filter(([key])=>fields.includes(key))),next={...current,...allowed};if(!validateFurniture(next))throw new Error('Kontrollér mål og placering. Hele møblet skal være inden for rummets gulv.');const changes=Object.fromEntries(Object.entries(allowed).filter(([key,value])=>current[key]!==value));return Object.keys(changes).length?journal.append({kind:'edit',itemId:id,patch:changes,revision:current.layoutRevision}):state;},setVisible(value){return journal.append({kind:'visibility',value});},resetItem(id){if(!furnitureCatalog.some(i=>i.id===id))throw new Error('Møblet findes ikke.');return journal.append({kind:'resetItem',itemId:id});},subscribe:journal.subscribe};
}

export function normalizeFurnishingImport(snapshot){
 if(snapshot?.version!==1||typeof snapshot.visible!=='boolean'||!Array.isArray(snapshot.items)||!snapshot.items.length||new Set(snapshot.items.map(i=>i?.id)).size!==snapshot.items.length)throw new Error('Ugyldig indretningsfil.');
 const result=initialFurnishing();result.visible=snapshot.visible;
 for(const incoming of snapshot.items){const index=result.items.findIndex(i=>i.id===incoming?.id),base=result.items[index];if(!base||incoming.room!==base.room)throw new Error('Filen indeholder et ukendt møbel eller rum.');const legacyType=incoming.type!==base.type,patch={};
  for(const key of ['name','x','z','width','depth','height','rotation','color','material','visible','reference','notes'])if(Object.hasOwn(incoming,key)&&!supersededField(base,key,incoming.layoutRevision)&&!(legacyType&&!['reference','notes','visible'].includes(key)))patch[key]=incoming[key];
  const next={...base,...patch};if(!validateFurniture(next))throw new Error('Filen indeholder ugyldige mål, referencer eller placeringer.');result.items[index]=next;
 }
 return result;
}
