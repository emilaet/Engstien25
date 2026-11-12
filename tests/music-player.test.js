import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {spotifyLink,musicTime,safeArtwork} from '../src/music-link.js';
import {appleDeveloperToken} from '../scripts/apple-music-token.mjs';
import {createApplePlayer} from '../src/music-apple.js';
import {createSpotifyPlayer} from '../src/music-spotify.js';

test('Spotify links accept only official track, album and playlist URLs and remove tracking',()=>{
 const id='37i9dQZF1DXcBWIGoYBM5M';assert.deepEqual(spotifyLink(`https://open.spotify.com/intl-da/playlist/${id}?si=tracking`),{url:`https://open.spotify.com/playlist/${id}`,embedUrl:`https://open.spotify.com/embed/playlist/${id}`,uri:`spotify:playlist:${id}`,type:'playlist',id});
 for(const url of ['javascript:alert(1)','https://open.spotify.com.evil.test/playlist/'+id,'http://open.spotify.com/playlist/'+id,'https://user:pass@open.spotify.com/playlist/'+id,'https://open.spotify.com/playlist/short','https://open.spotify.com:123/playlist/'+id])assert.equal(spotifyLink(url),null);
 assert.equal(musicTime(188.6),'3:08');assert.equal(musicTime(-20),'0:00');assert.equal(safeArtwork('javascript:alert(1)'),'');assert.equal(safeArtwork('https://user:pass@image.test/x'),'');
});

test('The build signs a verifiable ES256 MusicKit token without exposing the private key',()=>{
 const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),pem=privateKey.export({type:'pkcs8',format:'pem'}),now=1800000000;
 const token=appleDeveloperToken({APPLE_MUSIC_TEAM_ID:'ABCDEFGHIJ',APPLE_MUSIC_KEY_ID:'1234567890',APPLE_MUSIC_PRIVATE_KEY:pem},now),[header,body,signature]=token.split('.');
 assert.deepEqual(JSON.parse(Buffer.from(header,'base64url')),{alg:'ES256',kid:'1234567890'});const payload=JSON.parse(Buffer.from(body,'base64url'));assert.equal(payload.iss,'ABCDEFGHIJ');assert.equal(payload.exp,now+90*86400);assert.equal(verify('sha256',Buffer.from(header+'.'+body),{key:publicKey,dsaEncoding:'ieee-p1363'},Buffer.from(signature,'base64url')),true);assert.ok(!token.includes('PRIVATE KEY'));
 assert.equal(appleDeveloperToken({}),'');assert.throws(()=>appleDeveloperToken({APPLE_MUSIC_TEAM_ID:'ABCDEFGHIJ'}),/incomplete/);
});

test('Apple playback follows actual SDK state, queues selected music once, and survives authorization denial',async t=>{
 const original=globalThis.window;t.after(()=>{globalThis.window=original;});const calls=[],events={};
 const kit={isAuthorized:false,playbackState:3,nowPlayingItem:null,currentPlaybackTime:0,currentPlaybackDuration:200,nowPlayingItemIndex:0,queue:{nextPlayableItemIndex:1},addEventListener:(name,cb)=>{events[name]=cb;},authorize:async()=>{kit.isAuthorized=true;},setQueue:async q=>calls.push(q),play:async()=>{kit.playbackState=5;kit.nowPlayingItem={attributes:{name:'Real track',artistName:'Artist',artwork:{url:'https://image.test/{w}x{h}.jpg'}}};},pause:()=>{kit.playbackState=4;},skipToNextItem:async()=>{kit.nowPlayingItemIndex=1;},skipToPreviousItem:async()=>{kit.nowPlayingItemIndex=0;},seekToTime:async n=>{kit.currentPlaybackTime=n;},stop:()=>{kit.playbackState=8;},unauthorize:async()=>{kit.isAuthorized=false;}};
 globalThis.window={MusicKit:{PlaybackStates:{playing:5},configure:async()=>{},getInstance:()=>kit}};const changes=[],player=createApplePlayer({developerToken:'public-token',onChange:s=>changes.push(s)});player.setSelection({url:'https://music.apple.com/dk/playlist/example/pl.example'});
 await assert.rejects(player.play(),/Forbind/);assert.equal(player.snapshot().playing,false);await player.connect();await player.play();assert.equal(player.snapshot().title,'Real track');assert.equal(player.snapshot().playing,true);assert.equal(player.snapshot().artwork,'https://image.test/300x300.jpg');await player.pause();assert.equal(player.snapshot().playing,false);await player.play();assert.equal(calls.length,1);await player.seek(42);assert.equal(player.snapshot().position,42);await player.next();assert.equal(player.snapshot().canPrevious,true);await player.logout();assert.equal(player.snapshot().connected,false);kit.authorize=async()=>{throw Error('Denied');};await assert.rejects(player.connect(),/Denied/);assert.equal(player.snapshot().connected,false);assert.ok(changes.length>0);
 const missing=createApplePlayer({developerToken:'',onChange:()=>{}});await assert.rejects(missing.connect(),/opsætning/);
});

test('Spotify callback validates state before token exchange and consumes the original authorization code',async t=>{
 const keys=['window','location','history','fetch'],original=Object.fromEntries(keys.map(k=>[k,globalThis[k]]));t.after(()=>{for(const k of keys)globalThis[k]=original[k];});
 const data=new Map(),sessionStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 globalThis.window={sessionStorage};globalThis.location={origin:'https://dashboard.test',pathname:'/Engstien25/',href:'https://dashboard.test/Engstien25/?code=original-code&state=valid-state'};globalThis.history={state:null,replaceState:(_,__,url)=>{location.href=url;}};
 data.set('engstien-spotify-oauth-v1',JSON.stringify({state:'valid-state',verifier:'verifier',createdAt:Date.now(),returnHash:'#home'}));const requests=[];
 globalThis.fetch=async(url,options)=>{requests.push({url,body:Object.fromEntries(options.body)});return {ok:true,json:async()=>({access_token:'access',refresh_token:'refresh',expires_in:3600})};};
 const player=createSpotifyPlayer({clientId:'public-client',onChange:()=>{}});assert.equal(await player.completeLogin(),true);assert.equal(requests[0].body.code,'original-code');assert.equal(requests[0].body.code_verifier,'verifier');assert.equal(requests[0].body.redirect_uri,'https://dashboard.test/Engstien25/');assert.equal(player.snapshot().connected,true);assert.ok(!location.href.includes('code='));assert.equal(data.has('engstien-spotify-oauth-v1'),false);await player.logout();assert.equal(data.has('engstien-spotify-session-v1'),false);
 location.href='https://dashboard.test/Engstien25/?code=bad&state=forged';data.set('engstien-spotify-oauth-v1',JSON.stringify({state:'original',verifier:'private-verifier',createdAt:Date.now()}));await assert.rejects(player.completeLogin(),/bekræftes/);assert.equal(requests.length,1);
});

 test('Spotify callbacks restore only a recent matching local route before app initialization',async()=>{const {spotifyReturnHash}=await import('../src/music-spotify.js'),now=2000000,saved={state:'matching-state',createdAt:now-1000,returnHash:'#settings/connections'},url='https://dashboard.test/?code=one-use&state=matching-state';assert.equal(spotifyReturnHash(url,saved,now),'#settings/connections');for(const invalid of [{...saved,state:'other'},{...saved,createdAt:now-600000},{...saved,createdAt:now+1},{...saved,returnHash:'https://other.test/'}])assert.equal(spotifyReturnHash(url,invalid,now),null);assert.equal(spotifyReturnHash('https://dashboard.test/',saved,now),null);});
