import {test,expect} from './fixtures.js';

for(const start of ['/#home','/#settings/connections'])test('Spotify PKCE login binds the callback, controls playback, refreshes expired access, and logs out locally '+start,{tag:'@smoke'},async({page})=>{
 test.setTimeout(150000);const tokenRequests=[],apiRequests=[];
 await page.route('**/src/music-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'export const musicConfig={appleDeveloperToken:"",spotifyClientId:"public-client-id"}'}));
 await page.addInitScript(()=>{
  window.spotifyCalls=[];
  window.Spotify={Player:class{
   constructor(){this.listeners={};this.state={paused:true,position:0,duration:200000,disallows:{},track_window:{current_track:{name:'Spotify-sang',artists:[{name:'Kunstner'}],album:{images:[]}}}};window.spotifyTestPlayer=this;}
   addListener(name,callback){this.listeners[name]=callback;}
   async connect(){queueMicrotask(()=>this.listeners.ready?.({device_id:'dashboard-device'}));return true;}
   async activateElement(){spotifyCalls.push('activate');}
   async getCurrentState(){return this.state;}
   async resume(){spotifyCalls.push('resume');this.state.paused=false;this.emit();}
   async pause(){spotifyCalls.push('pause');this.state.paused=true;this.emit();}
   async nextTrack(){spotifyCalls.push('next');this.state.track_window.current_track.name='Spotify næste';this.emit();}
   async previousTrack(){spotifyCalls.push('previous');this.state.track_window.current_track.name='Spotify-sang';this.emit();}
   async seek(ms){spotifyCalls.push(['seek',ms]);this.state.position=ms;this.emit();}
   disconnect(){spotifyCalls.push('disconnect');}
   emit(){this.listeners.player_state_changed?.(this.state);}
  }};
 });
 await page.route('https://accounts.spotify.com/authorize*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>Spotify authorization endpoint</p>'}));
 await page.route('https://accounts.spotify.com/api/token',async route=>{
  const body=new URLSearchParams(route.request().postData());tokenRequests.push(Object.fromEntries(body));await route.fulfill({json:{access_token:'session-access',refresh_token:'session-refresh',expires_in:body.get('grant_type')==='authorization_code'?0:3600}});
 });
 await page.route('https://api.spotify.com/v1/**',async route=>{
  apiRequests.push({url:route.request().url(),method:route.request().method(),body:route.request().postData()});
  if(route.request().url().includes('/me/player/play?'))await page.evaluate(()=>{spotifyTestPlayer.state.paused=false;spotifyTestPlayer.emit();});
  await route.fulfill({status:204,body:''});
 });
 await page.goto(start);if(start.includes('settings')){await page.getByRole('button',{name:'Åbn musik og konto →'}).click();await page.locator('.music-full-provider [data-music=accounts]').click();}else await page.locator('.music-card .music-account-button').click();let accounts=page.getByRole('dialog',{name:'Musiktjeneste og konto'});await accounts.getByRole('button',{name:'Spotify',exact:true}).click();await accounts.getByRole('button',{name:'Forbind Spotify',exact:true}).click();await expect(page).toHaveURL(/^https:\/\/accounts\.spotify\.com\/authorize\?/);
 const authorization=new URL(page.url());expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');expect(authorization.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);const state=authorization.searchParams.get('state');expect(state.length).toBeGreaterThanOrEqual(40);expect(authorization.searchParams.has('client_secret')).toBe(false);
 await page.goto('http://127.0.0.1:5173/?code=one-use-code&state='+encodeURIComponent(state));if(start.includes('settings')){await expect(page).toHaveURL(/#settings\/connections$/);await expect(page.getByRole('heading',{name:'Indstillinger',exact:true})).toBeVisible();await expect(page.locator('#scene canvas')).toHaveCount(0);await page.getByRole('button',{name:'Hjem',exact:true}).click();}const card=page.locator('.music-card');await expect(card.getByRole('button',{name:'Afspil musik'})).toBeEnabled();await expect(page).not.toHaveURL(/code=/);expect(tokenRequests[0].code).toBe('one-use-code');expect(tokenRequests[0].code_verifier.length).toBeGreaterThanOrEqual(43);
 await card.getByRole('button',{name:'Afspil musik'}).click();await expect(card.locator('[data-music-title]')).toHaveText('Spotify-sang');await expect(card.getByRole('button',{name:'Sæt musik på pause'})).toBeEnabled();expect(tokenRequests.some(r=>r.grant_type==='refresh_token')).toBe(true);expect(apiRequests.find(r=>r.url.includes('/me/player/play?')).body).toContain('spotify:playlist:');
 await card.getByRole('button',{name:'Næste sang'}).click();await expect(card.locator('[data-music-title]')).toHaveText('Spotify næste');await card.getByRole('button',{name:'Forrige sang'}).click();await expect(card.locator('[data-music-title]')).toHaveText('Spotify-sang');await card.getByRole('button',{name:'Sæt musik på pause'}).click();await expect(card.getByRole('button',{name:'Afspil musik'})).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('engstien-spotify-session-v1'))).toBeNull();await card.locator('.music-account-button').click();accounts=page.getByRole('dialog',{name:'Musiktjeneste og konto'});await accounts.getByRole('button',{name:'Log ud af Spotify'}).click();await page.keyboard.press('Escape');await expect(card.getByRole('button',{name:'Afspil musik'})).toHaveCount(0);await expect(card.locator('.music-connect-state')).toBeVisible();expect(await page.evaluate(()=>sessionStorage.getItem('engstien-spotify-session-v1'))).toBeNull();expect(await page.evaluate(()=>spotifyCalls.includes('disconnect'))).toBe(true);
});
