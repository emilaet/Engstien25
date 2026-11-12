import {safeStorage} from './storage.js';
import {loadMusicSdk} from './music-sdk.js';
import {safeArtwork} from './music-link.js';

export const spotifyOAuthKey='engstien-spotify-oauth-v1';
const oauthKey=spotifyOAuthKey,sessionKey='engstien-spotify-session-v1';
const scopes='streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative';
const base64url=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export function spotifyCallback(url){const u=new URL(url);return u.searchParams.has('code')||u.searchParams.has('error')&&u.searchParams.has('state');}

// Restore the validated local destination before the app selects its first view.
// The authorization code remains in the URL until completeLogin exchanges it.
export function spotifyReturnHash(url,saved,now=Date.now()){
 try{const parsed=new URL(url),age=now-saved?.createdAt;if(!spotifyCallback(url)||!saved||typeof saved.state!=='string'||!saved.state||saved.state!==parsed.searchParams.get('state')||!Number.isFinite(saved.createdAt)||age<0||age>=600000)return null;return saved.returnHash===''?'#home':typeof saved.returnHash==='string'&&saved.returnHash.startsWith('#')?saved.returnHash:null;}catch{return null;}
}

export function createSpotifyPlayer({clientId,onChange}){
 let browserSession;try{browserSession=window.sessionStorage;}catch{browserSession=null;}
 const session=safeStorage(browserSession);
 let tokens=null,player=null,device=null,selection=null,queued=false,latest=null,tokenRequest=null;
 try{tokens=JSON.parse(session.getItem(sessionKey));}catch{}
 const redirectUri=()=>location.origin+location.pathname;
 const notify=()=>onChange(snapshot());
 function snapshot(){const item=latest?.track_window?.current_track;return {connected:!!tokens,playing:!!latest&&!latest.paused,title:item?.name||'',artist:item?.artists?.map(a=>a.name).join(', ')||'',artwork:safeArtwork(item?.album?.images?.[0]?.url),position:(latest?.position||0)/1000,duration:(latest?.duration||0)/1000,canPrevious:!!latest&&!latest.disallows?.skipping_prev,canNext:!!latest&&!latest.disallows?.skipping_next,canSeek:!!latest&&!latest.disallows?.seeking};}
 function saveTokens(value){tokens={...value,refresh_token:value.refresh_token||tokens?.refresh_token,expiresAt:Date.now()+value.expires_in*1000};session.setItem(sessionKey,JSON.stringify(tokens));}
 async function tokenRequestBody(body){
  const response=await fetch('https://accounts.spotify.com/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)});
  if(!response.ok)throw Error('Spotify-login udløb eller blev afvist. Forbind kontoen igen.');return response.json();
 }
 async function accessToken(){
  if(!tokens)throw Error('Forbind din Spotify-konto først.');
  if(tokens.expiresAt>Date.now()+60000)return tokens.access_token;
  tokenRequest??=tokenRequestBody({grant_type:'refresh_token',refresh_token:tokens.refresh_token,client_id:clientId}).then(saveTokens).finally(()=>{tokenRequest=null;});
  await tokenRequest;return tokens.access_token;
 }
 async function api(path,{method='GET',body}={}){
  const response=await fetch('https://api.spotify.com/v1/'+path,{method,headers:{Authorization:'Bearer '+await accessToken(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw Error(response.status===403?'Afspilning her kræver Spotify Premium og adgang til appen.':response.status===401?'Forbind din Spotify-konto igen.':'Spotify kunne ikke udføre handlingen. Prøv igen.');
  return response.status===204?null:response.json();
 }
 async function initialize(){
  if(player&&device)return;if(!tokens)throw Error('Forbind din Spotify-konto først.');
  window.onSpotifyWebPlaybackSDKReady=()=>{};
  await loadMusicSdk('https://sdk.scdn.co/spotify-player.js',()=>!!window.Spotify?.Player);
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Spotify-afspilleren svarer ikke. Prøv igen.')),20000);
   player?.disconnect();player=new window.Spotify.Player({name:'Engstien 25',getOAuthToken:cb=>accessToken().then(cb).catch(e=>{clearTimeout(timer);reject(e);}),volume:.65});
   player.addListener('ready',({device_id})=>{clearTimeout(timer);device=device_id;notify();resolve();});
   player.addListener('not_ready',()=>{device=null;latest=null;notify();});
   player.addListener('player_state_changed',state=>{latest=state;notify();});
   for(const event of ['initialization_error','authentication_error','account_error','playback_error'])player.addListener(event,()=>{clearTimeout(timer);const error=Error(event==='account_error'?'Afspilning her kræver Spotify Premium.':'Spotify-afspilleren kunne ikke starte. Forbind kontoen igen.');reject(error);onChange({...snapshot(),error:error.message});});
   player.connect().then(ok=>{if(!ok){clearTimeout(timer);reject(Error('Spotify-afspilleren kunne ikke forbindes.'));}}).catch(reject);
  });
 }
 return {
  snapshot,prepare:initialize,
  async connect(){
   if(!clientId)throw Error('Spotify mangler opsætning, før du kan forbinde din konto.');
   const verifier=base64url(crypto.getRandomValues(new Uint8Array(64))),state=base64url(crypto.getRandomValues(new Uint8Array(32)));
   const challenge=base64url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)));
   if(!session.setItem(oauthKey,JSON.stringify({verifier,state,createdAt:Date.now(),returnHash:location.hash})))throw Error('Tillad sessionslagring i browseren for at forbinde Spotify.');
   const url=new URL('https://accounts.spotify.com/authorize');url.search=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirectUri(),scope:scopes,state,code_challenge_method:'S256',code_challenge:challenge}).toString();location.assign(url.href);
  },
  async completeLogin(){
   const url=new URL(location.href);if(!spotifyCallback(url.href))return false;
   let saved;try{saved=JSON.parse(session.getItem(oauthKey));}catch{}
   const code=url.searchParams.get('code');session.removeItem(oauthKey);const valid=saved&&saved.state===url.searchParams.get('state')&&Date.now()-saved.createdAt<600000;
   url.searchParams.delete('code');url.searchParams.delete('state');const error=url.searchParams.get('error');url.searchParams.delete('error');if(valid)url.hash=saved.returnHash||'#home';history.replaceState(history.state,'',url.href);
   if(!valid)throw Error('Spotify-login kunne ikke bekræftes. Start forbindelsen igen.');
   if(error)throw Error('Spotify-login blev annulleret.');
   const value=await tokenRequestBody({grant_type:'authorization_code',code,redirect_uri:redirectUri(),client_id:clientId,code_verifier:saved.verifier});
   saveTokens(value);notify();return true;
  },
  setSelection(value){selection=value;queued=false;},
  async play(){await initialize();await player.activateElement?.();await api('me/player',{method:'PUT',body:{device_ids:[device],play:false}});
   if(!queued&&selection){await api('me/player/play?device_id='+encodeURIComponent(device),{method:'PUT',body:selection.type==='track'?{uris:[selection.uri]}:{context_uri:selection.uri}});queued=true;}
   else await player.resume();latest=await player.getCurrentState();notify();
  },
  async pause(){await player?.pause();latest=await player?.getCurrentState();notify();},
  async poll(){if(player){latest=await player.getCurrentState();notify();}},
  async previous(){await player?.previousTrack();},async next(){await player?.nextTrack();},async seek(seconds){await player?.seek(seconds*1000);},
  async logout(){await player?.pause();player?.disconnect();player=null;device=null;tokens=null;latest=null;queued=false;session.removeItem(sessionKey);notify();},
  async library(){const result=await api('me/playlists?limit=25');return (result.items||[]).filter(Boolean).map(p=>({id:p.id,title:p.name,detail:p.owner?.display_name||'Spotify',uri:p.uri,type:'playlist',url:p.external_urls?.spotify}));},
 };
}
