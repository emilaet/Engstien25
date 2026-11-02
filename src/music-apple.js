import {loadMusicSdk} from './music-sdk.js';
import {safeArtwork} from './music-link.js';

export function createApplePlayer({developerToken,onChange}){
 let kit=null,loading=null,selection=null,queued=false;
 const notify=()=>onChange(snapshot());
 function snapshot(){
  const p=kit?.player||kit,item=p?.nowPlayingItem||kit?.nowPlayingItem,a=item?.attributes||item||{};
  return {connected:!!kit?.isAuthorized,playing:p?.isPlaying===true||p?.playbackState===(window.MusicKit?.PlaybackStates?.playing??5),
   title:a.name||a.title||'',artist:a.artistName||'',artwork:safeArtwork(a.artwork?.url?.replace('{w}','300').replace('{h}','300')),
   duration:Number(p?.currentPlaybackDuration)||Number(a.durationInMillis)/1000||0,position:Number(p?.currentPlaybackTime)||0,
   canPrevious:!!item&&(p?.nowPlayingItemIndex??kit?.nowPlayingItemIndex??1)>0,
   canNext:!!item&&(p?.queue?.nextPlayableItemIndex!==-1),canSeek:!!item};
 }
 async function initialize(){
  if(kit)return kit;if(loading)return loading;
  if(!developerToken)throw Error('Apple Music mangler opsætning, før du kan forbinde din konto.');
  loading=(async()=>{
   await loadMusicSdk('https://js-cdn.music.apple.com/musickit/v3/musickit.js',()=>!!window.MusicKit);
   await window.MusicKit.configure({developerToken,app:{name:'Engstien 25',build:'1.0.0'}});
   kit=window.MusicKit.getInstance();
   for(const event of ['authorizationStatusDidChange','playbackStateDidChange','nowPlayingItemDidChange','playbackTimeDidChange','queuePositionDidChange','queueItemsDidChange'])kit.addEventListener(event,notify);
   kit.addEventListener('mediaPlaybackError',()=>onChange({...snapshot(),error:'Sangen kunne ikke afspilles. Kontrollér dit Apple Music-abonnement og prøv igen.'}));
   notify();return kit;
  })().catch(error=>{loading=null;throw error;});return loading;
 }
 async function connect(){await initialize();await kit.authorize();notify();}
 return {
  snapshot,connect,prepare:initialize,
  setSelection(value){selection=value;queued=false;},
  async play(){await initialize();if(!kit.isAuthorized)throw Error('Forbind din Apple Music-konto først.');if(!queued&&selection){await kit.setQueue(selection.queue||{url:selection.url});queued=true;}await kit.play();notify();},
  async pause(){kit?.pause();notify();},
  async previous(){await kit?.skipToPreviousItem();notify();},
  async next(){await kit?.skipToNextItem();notify();},
  async seek(seconds){await kit?.seekToTime(seconds);notify();},
  async logout(){kit?.stop();await kit?.unauthorize();queued=false;notify();},
  async library(){await initialize();if(!kit.isAuthorized)throw Error('Forbind din Apple Music-konto først.');
   const response=await kit.api.music('/v1/me/library/playlists',{limit:25});
   return (response.data?.data||[]).map(item=>({id:item.id,title:item.attributes?.name||'Spilleliste',detail:'Dit Apple Music-bibliotek',queue:{playlist:item.id}}));
  },
 };
}
