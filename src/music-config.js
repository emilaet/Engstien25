// These identifiers/tokens are intended for MusicKit's browser SDK. Private
// signing keys and Spotify client secrets must never be included in this file.
export const musicConfig={
 appleDeveloperToken:import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN||'',
 spotifyClientId:import.meta.env.VITE_SPOTIFY_CLIENT_ID||'b17f4a1abb3546f299d0204bdb50156c',
};
