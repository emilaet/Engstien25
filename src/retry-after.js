export function retryAfterMillis(value,now=Date.now()){
 const text=String(value??'').trim();
 return /^\d+$/.test(text)?Number(text)*1000:Number.isFinite(Date.parse(text))?Math.max(0,Date.parse(text)-now):60000;
}
