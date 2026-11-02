import {createPrivateKey,sign} from 'node:crypto';

// MusicKit developer tokens are public browser credentials. The signing key
// stays in the build environment; it is never returned, logged, or bundled.
export function appleDeveloperToken(env=process.env,now=Math.floor(Date.now()/1000)){
 if(env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN)return env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
 const {APPLE_MUSIC_TEAM_ID:team,APPLE_MUSIC_KEY_ID:keyId,APPLE_MUSIC_PRIVATE_KEY:privateKey}=env;
 if(!team&&!keyId&&!privateKey)return '';
 if(!/^[A-Z0-9]{10}$/.test(team||'')||!/^[A-Z0-9]{10}$/.test(keyId||'')||!privateKey)throw Error('Apple Music configuration is incomplete. Set the team ID, key ID and private signing key.');
 let key;try{key=createPrivateKey(privateKey.replace(/\\n/g,'\n'));}catch{throw Error('The Apple Music signing key could not be read.');}
 if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails?.namedCurve!=='prime256v1')throw Error('Apple Music requires an ES256 signing key.');
 const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const input=encode({alg:'ES256',kid:keyId})+'.'+encode({iss:team,iat:now-30,exp:now+90*86400});
 return input+'.'+sign('sha256',Buffer.from(input),{key,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
