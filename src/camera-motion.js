// Preserve a visible flight at normal frame rates, while giving slow devices
// a time limit so camera controls are never held waiting for eight frames.
export function cameraFlightProgress(elapsed,duration,frames){
 if(duration===0)return 1;
 const time=Math.max(0,elapsed);
 return Math.min(1,Math.max(Math.min(time/duration,frames/8),frames>1?time/(duration+1000):0));
}
