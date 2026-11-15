// Ingress gives each installation a path. API calls stay on that same origin.
export function apiPath(path,base=typeof document==='undefined'?'/':document.querySelector('meta[name="engstien-base"]')?.content||'/'){
 if(!path.startsWith('/api/'))throw Error('Ugyldig API-sti.');
 if(!/^\/(?:api\/hassio_ingress\/[A-Za-z0-9_-]+\/)?$/.test(base))throw Error('Ugyldig app-sti.');
 return base+path.slice(1);
}
