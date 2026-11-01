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
