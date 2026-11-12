import {test,expect} from '@playwright/test';

async function config(page,apple=true,spotify=false){await page.route('**/src/music-config.js*',route=>route.fulfill({contentType:'application/javascript',body:'export const musicConfig='+JSON.stringify({appleDeveloperToken:apple?'test-public-developer-token':'',spotifyClientId:spotify?'test-public-client-id':''})}));}
async function appleSdk(page,{denied=false}={}){await page.addInitScript(({denied})=>{
 const events={},calls=[];window.musicCalls=calls;
 const kit={isAuthorized:false,playbackState:3,currentPlaybackTime:28,currentPlaybackDuration:190,nowPlayingItemIndex:0,queue:{nextPlayableItemIndex:1},nowPlayingItem:null,
  addEventListener:(name,callback)=>{events[name]=callback;},
  authorize:async()=>{calls.push('authorize');if(denied)throw Error('Login blev annulleret.');kit.isAuthorized=true;emit('authorizationStatusDidChange');return 'private-user-token';},
  setQueue:async selection=>{calls.push(['queue',selection]);setTrack('DOG HOUSE','Drake, Julia Wolf & Yeat');},
  play:async()=>{calls.push('play');kit.playbackState=5;emit('playbackStateDidChange');},
  pause:()=>{calls.push('pause');kit.playbackState=4;emit('playbackStateDidChange');},
  skipToNextItem:async()=>{calls.push('next');kit.nowPlayingItemIndex=1;setTrack('Næste sang','Næste kunstner');},
  skipToPreviousItem:async()=>{calls.push('previous');kit.nowPlayingItemIndex=0;setTrack('DOG HOUSE','Drake, Julia Wolf & Yeat');},
  seekToTime:async seconds=>{calls.push(['seek',seconds]);kit.currentPlaybackTime=seconds;emit('playbackTimeDidChange');},
  stop:()=>{calls.push('stop');kit.playbackState=8;emit('playbackStateDidChange');},
  unauthorize:async()=>{calls.push('logout');kit.isAuthorized=false;emit('authorizationStatusDidChange');},
  api:{music:async path=>{calls.push(['api',path]);return {data:{data:[{id:'p.personal',attributes:{name:'Min egen spilleliste'}}]}};}},
 };
 function emit(name){events[name]?.({});}
 function setTrack(name,artistName){kit.nowPlayingItem={attributes:{name,artistName,artwork:{url:'https://artwork.test/{w}/{h}.png'},durationInMillis:190000}};emit('nowPlayingItemDidChange');}
 window.MusicKit={PlaybackStates:{playing:5},configure:async options=>{calls.push(['configure',options]);},getInstance:()=>kit};window.mockMusicKit=kit;
 },{denied});await page.route('https://artwork.test/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#76546d"/></svg>'}));}
async function connectApple(page){await page.locator('.music-card .music-account-button').click();const accounts=page.getByRole('dialog',{name:'Musiktjeneste og konto'});await accounts.getByRole('button',{name:'Forbind Apple Music',exact:true}).click();await expect(accounts.getByRole('button',{name:'Log ud af Apple Music'})).toBeVisible();await page.keyboard.press('Escape');}

test('Without setup there is no fake account or song; the provider logo selects accounts and persists',async({page})=>{
 const requests=[];page.on('request',r=>{if(/music\.apple|sdk\.scdn/.test(r.url()))requests.push(r.url());});await config(page,false);await page.goto('/');const card=page.locator('.music-card');await expect(card.locator('.music-connect-state')).toBeVisible();await expect(card.getByRole('button',{name:'Afspil musik'})).toHaveCount(0);await expect(card.locator('.music-open')).toHaveCount(0);expect(requests).toEqual([]);
 await card.locator('.music-account-button').click();const accounts=page.getByRole('dialog',{name:'Musiktjeneste og konto'});await expect(accounts).toContainText('MusicKit');await accounts.getByRole('button',{name:'Spotify',exact:true}).click();await expect(accounts.getByRole('button',{name:'Spotify',exact:true})).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Escape');await expect(card.locator('.spotify-logo')).toBeVisible();await expect(card.locator('.music-account-button')).toBeFocused();await page.reload();await expect(card.locator('.spotify-logo')).toBeVisible();expect(requests).toEqual([]);
});

test('Apple login controls actual SDK playback, seek, next and previous without a footer expansion button',async({page})=>{
 await config(page);await appleSdk(page);await page.goto('/');await connectApple(page);const card=page.locator('.music-card');await card.getByRole('button',{name:'Afspil musik'}).click();await expect(card.locator('[data-music-title]')).toHaveText('DOG HOUSE');await expect(card.locator('[data-music-artist]')).toHaveText('Drake, Julia Wolf & Yeat');await expect(card.getByRole('button',{name:'Sæt musik på pause'})).toBeEnabled();await card.getByRole('button',{name:'Næste sang'}).click();await expect(card.locator('[data-music-title]')).toHaveText('Næste sang');await card.getByRole('button',{name:'Forrige sang'}).click();await expect(card.locator('[data-music-title]')).toHaveText('DOG HOUSE');await card.getByRole('slider',{name:'Afspilningsposition'}).fill('60');await expect(card.locator('[data-music-elapsed]')).toHaveText('1:00');await card.getByRole('button',{name:'Sæt musik på pause'}).click();await expect(card.getByRole('button',{name:'Afspil musik'})).toBeEnabled();expect(await page.evaluate(()=>musicCalls.filter(c=>Array.isArray(c)&&c[0]==='queue').length)).toBe(1);
 const stored=await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}));expect(stored).not.toContain('private-user-token');
});

test('The full player shares live playback and library; closing and rerendering do not stop audio',async({page})=>{
 await config(page);await appleSdk(page);await page.goto('/');await connectApple(page);const card=page.locator('.music-card');await card.getByRole('button',{name:'Afspil musik'}).click();await card.getByRole('button',{name:'Udvid musik'}).click();const dialog=page.getByRole('dialog',{name:'Musik',exact:true});await expect(dialog.locator('[data-music-title]')).toHaveText('DOG HOUSE');await dialog.getByRole('button',{name:'Mit bibliotek',exact:true}).click();await dialog.getByRole('button',{name:/Min egen spilleliste/}).click();expect(await page.evaluate(()=>musicCalls.filter(c=>Array.isArray(c)&&c[0]==='queue').at(-1)[1])).toEqual({playlist:'p.personal'});
 await dialog.getByRole('button',{name:'Vælg musiktjeneste og konto',exact:true}).click();await page.keyboard.press('Escape');await expect(dialog.getByRole('button',{name:'Vælg musiktjeneste og konto',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(card.getByRole('button',{name:'Udvid musik'})).toBeFocused();await expect(card.getByRole('button',{name:'Sæt musik på pause'})).toBeVisible();await page.getByRole('textbox',{name:'Ny vare på handlelisten',exact:true}).fill('Musiktest');await page.getByRole('button',{name:'Tilføj vare',exact:true}).click();await expect(card.locator('[data-music-title]')).toHaveText('DOG HOUSE');await expect(card.getByRole('button',{name:'Sæt musik på pause'})).toBeVisible();expect(await page.evaluate(()=>musicCalls.includes('stop'))).toBe(false);
});

test('Denied Apple login keeps controls inactive and logout stops playback and clears authorization',async({page})=>{
 await config(page);await appleSdk(page,{denied:true});await page.goto('/');await page.locator('.music-card .music-account-button').click();const accounts=page.getByRole('dialog',{name:'Musiktjeneste og konto'});await accounts.getByRole('button',{name:'Forbind Apple Music',exact:true}).click();await expect(accounts.locator('[role=status]')).toContainText('annulleret');await page.keyboard.press('Escape');await expect(page.locator('.music-card [data-music=play]')).toBeDisabled();
 await page.evaluate(()=>{mockMusicKit.authorize=async()=>{mockMusicKit.isAuthorized=true;};});await connectApple(page);await page.locator('.music-card [data-music=play]').click();await page.locator('.music-card .music-account-button').click();await accounts.getByRole('button',{name:'Log ud af Apple Music'}).click();await expect(accounts.getByRole('button',{name:'Forbind Apple Music',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.music-card [data-music=play]')).toBeDisabled();expect(await page.evaluate(()=>musicCalls.includes('stop')&&musicCalls.includes('logout'))).toBe(true);
});

test('The transport remains inside the smallest cards and scales to tall and wide layouts',async({page})=>{
 await config(page);await appleSdk(page);await page.setViewportSize({width:1194,height:834});await page.goto('/');await connectApple(page);const card=page.locator('.music-card');await card.locator('[data-music=play]').click();const issues=[];
 for(const width of [2,3,4,6,12])for(const height of [132,196,340,532]){await card.evaluate((c,{width,height})=>{c.style.setProperty('--widget-desktop-span',width);c.style.setProperty('--widget-desktop-column','1');c.style.setProperty('--widget-desktop-rows',Math.round((height+12)/16));},{width,height});await page.evaluate(()=>new Promise(requestAnimationFrame));const bad=await card.evaluate(c=>{const r=c.getBoundingClientRect();return [...c.querySelectorAll('button,input,.music-now')].filter(e=>e.getClientRects().length).filter(e=>{const b=e.getBoundingClientRect();return b.left<r.left-1||b.right>r.right+1||b.top<r.top-1||b.bottom>r.bottom+1;}).map(e=>e.getAttribute('aria-label')||e.className);});if(bad.length)issues.push({width,height,bad});}expect(issues).toEqual([]);
 await page.setViewportSize({width:375,height:812});await card.getByRole('button',{name:'Udvid musik'}).click();const dialog=page.getByRole('dialog',{name:'Musik',exact:true});await expect(dialog.getByRole('button',{name:'Sæt musik på pause'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
