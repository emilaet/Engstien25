export const defaultMusicUrl='https://music.apple.com/dk/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb';
export const musicLinkKey='engstien-apple-music-link-v1';
export function musicLink(value){
 let url;try{url=new URL(String(value).trim());}catch{return null;}
 if(url.protocol!=='https:'||!['music.apple.com','embed.music.apple.com'].includes(url.hostname)||url.username||url.password||url.port)return null;
 const clean=new URL('https://music.apple.com'+(url.pathname==='/'?'/dk/new':url.pathname));
 const track=url.searchParams.get('i');if(track&&/^\d+$/.test(track))clean.searchParams.set('i',track);
 const embeddable=/^\/[a-z]{2}\/(album|playlist|song)\/[^/]+(?:\/[^/]+)?\/?$/i.test(clean.pathname);
 return {url:clean.href,embedUrl:embeddable?clean.href.replace('https://music.apple.com','https://embed.music.apple.com'):null};
}

export function spotifyLink(value){
 let url;try{url=new URL(String(value).trim());}catch{return null;}
 if(url.protocol!=='https:'||url.hostname!=='open.spotify.com'||url.username||url.password||url.port)return null;
 const match=url.pathname.match(/^\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([a-zA-Z0-9]{22})\/?$/);
 if(!match)return null;
 const [,type,id]=match;
 return {url:`https://open.spotify.com/${type}/${id}`,embedUrl:`https://open.spotify.com/embed/${type}/${id}`,uri:`spotify:${type}:${id}`,type,id};
}

export function musicTime(seconds){
 const n=Math.max(0,Math.floor(Number(seconds)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
}

export function safeArtwork(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}
