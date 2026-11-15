// Supervisor authenticates the user and strips spoofed user headers. Do not
// trust those headers from a LAN client or another container.
export function ingressContext(req,{trustedAddress='172.30.32.2'}={}){
 const address=String(req.socket.remoteAddress||'').replace(/^::ffff:/,'');
 if(address!==trustedAddress)return null;
 const prefix=req.headers['x-ingress-path'];
 if(typeof prefix!=='string'||!/^\/api\/hassio_ingress\/[A-Za-z0-9_-]+\/?$/.test(prefix))return null;
 return {base:prefix.replace(/\/$/,'')+'/',user:String(req.headers['x-remote-user-id']||prefix).slice(0,256)};
}
export function sameIngressOrigin(req){
 if(!req.headers.origin)return true;
 try{
  const origin=new URL(req.headers.origin),host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().toLowerCase();
  return !/[\s/@\\]/.test(host)&&['http:','https:'].includes(origin.protocol)&&origin.host===host;
 }catch{return false;}
}
