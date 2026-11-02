# Musikafspiller

Tryk **Musik** i kortets overskrift for den store afspiller. Logoet øverst til højre åbner valg af Apple Music/Spotify og konto. Kortet har afspil/pause, forrige/næste sang og, når pladsen tillader det, afspilningsposition. Det følger en rigtig SDK-afspiller; der vises ingen opdigtet sang eller tilsluttet konto.

Den store afspiller har bibliotek, musiklink og en separat officiel indlejret afspiller som reserve. En indlejret afspiller kan ikke fjernstyres af kortets knapper. Den oprettes først, når brugeren åbner den, og fjernes ved lukning. MusicKit/Spotify-afspilning fortsætter ved lukning af den store visning og ved opdatering af andre dashboardkort. Musikken afspilles i den aktuelle browser; widgetten læser ikke automatisk telefonens “Afspiller nu”.

## Apple Music

Fuld afspilning kræver et aktivt Apple Music-abonnement og en MusicKit-nøgle fra en Apple Developer-konto. Apple-login sker i Apples MusicKit-dialog. Dashboardet indsamler ikke Apple-adgangskoden og kopierer ikke Music User Token til sine egne lister eller lagerfelter.

På GitHub Pages konfigurerer ejeren tre repository secrets: `APPLE_MUSIC_TEAM_ID`, `APPLE_MUSIC_KEY_ID` og `APPLE_MUSIC_PRIVATE_KEY`. Brug en MusicKit-aktiveret nøgle fra Apple Developer. Private nøgler må ikke indsættes i chatten, kildekoden eller VITE-variabler. `build:pages` signerer en ES256 developer-JWT med 90 dages gyldighed, fjerner den private nøgle fra Vite-processens miljø og indlejrer kun den offentlige developer-token i den krypterede app. Kør workflowet igen inden udløb for at forny tokenen. Uden konfiguration virker kortets layout og officielle spiller, men direkte afspilning og Apple-login er ikke aktiveret.

Til lokal udvikling kan en allerede signeret developer-token lægges i den git-ignorerede `.env.local` som `VITE_APPLE_MUSIC_DEVELOPER_TOKEN`. Nøglen er til appens MusicKit-adgang; brugeren logger derefter ind med sin egen Apple Music-konto. iPad/Safari kræver en brugerhandling til at starte lyd og tilladelse til Apples loginvindue.

## Spotify

Opret en Spotify Web API-app og registrer den nøjagtige redirect URI `https://emilaet.github.io/Engstien25/`. Sæt repository-variablen `SPOTIFY_CLIENT_ID` til dens offentlige client ID (lokalt: `VITE_SPOTIFY_CLIENT_ID`). Der bruges ingen Spotify client secret i browseren.

Login bruger Authorization Code med PKCE (SHA-256), tilfældig state og en verifier med ti minutters gyldighed. OAuth-kode og state fjernes fra URL'en efter callback. Access-/refresh-token opbevares i sessionStorage, ikke i det vedvarende dashboardlayout. Udløbne access-tokens fornyes. Spotify Premium og app-adgang er nødvendigt for Web Playback SDK; adgangskrav i Spotifys udviklertilstand gælder fortsat. Afspilning overtages først af denne browser, når brugeren trykker Afspil. Log ud pauser musikken, afbryder SDK-enheden og fjerner appens Spotify-session.

## Kontrol

Automatiske tests bruger SDK-mocks til login, pause, kø, næste/forrige sang, fejl og bibliotek. De beviser appens integrationsadfærd, ikke at en rigtig konto har et aktivt abonnement. Endelig kontoprøve kræver ejerens konfiguration og login på den enhed, der skal afspille.
