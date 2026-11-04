const categories=['lights','heat','curtains'];
export function parseNavigation(hash,roomIds=[]){
 const [raw,room,category]=String(hash||'').replace(/^#/,'').split('/');
 const view=['lights','heat'].includes(raw)?'rooms':['home','rooms','car','furnish','settings'].includes(raw)?raw:'home';
 return {view,room:view==='rooms'&&roomIds.includes(room)?room:null,category:categories.includes(category)?category:null};
}
export function roomLocation(room,category='lights'){return room?'#rooms/'+encodeURIComponent(room)+'/'+(categories.includes(category)?category:'lights'):'#rooms';}
