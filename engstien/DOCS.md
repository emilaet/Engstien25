# Installation

1. I Home Assistant åbnes **Indstillinger → Apps → Appbutik → ⋮ → Repositories**. Ældre versioner kalder Apps for Tilføjelser/Add-ons.
2. Tilføj `https://github.com/emilaet/Engstien25`.
3. Vælg **Engstien 25 → Installér → Start → Åbn webgrænseflade**. Tilvælg Vis i sidepanelet, hvis det ønskes.
4. Første start opretter en ny lokal husstandsopsætning. Eksportér backup fra GitHub-udgaven under **Indstillinger → Skærm og dashboard** og indlæs den i Green-appen, hvis den eksisterende opstilling skal flyttes. Forskellige opstillinger flettes ikke automatisk.

Appen bruger HA's ingress og er i denne første version kun tilgængelig for HA-administratorer. Der eksponeres ingen ekstra netværksport. Ingen adgangsnøgle skal indtastes i Engstien. Den private Supervisor-nøgle bliver på serveren.

## Tilføj en enhed

Par Matter-enheden i **Home Assistant Companion** på iPhone. I Engstien vælges **⋯ → Indstillinger → Rum og enheder → Tilføj fra Home Assistant**. Vælg enheden, rummet og dens funktion. Vælg enten en eksisterende kontrol, fx Loftslys, eller Ny enhed i rummet. Gemning sender ingen kommando.

Ekstra lys, varmezoner, gardiner og kontakter får kontroller i rummet. Sensorer og øvrige typer viser status; kamera/video, musik, robotfunktioner og Tesla-kommandoer aktiveres ikke blot ved import. En enhed, der er frakoblet eller utilgængelig, låses. Ekstra enheder opretter ikke automatisk 3D-objekter.

## Opdatering

Når en ny version er udgivet, vises **Opdater** på appens HA-side. Vælg gerne backup før opdatering. Appen genstarter kortvarigt. Et allerede åbent dashboard viser **Ny version klar → Genindlæs**. Afslut åbne dialoger og gem et dashboardudkast før genindlæsning.

Appens `dashboard.json` og øvrige driftsdata ligger i `/data`. De erstattes ikke af en image-opdatering. HA's app-backup medtager datamappen. Pakken bruger kold backup, så serveren stoppes og skriver ventende ændringer færdigt inden kopiering. Afinstallation kan slette data; tag backup først. Opbevar ikke Supervisor-nøgler i en backup eller GitHub-fil.

## Mobil og adgang hjemmefra

Åbn via Home Assistant Companion eller HA-sidepanelet. Et bogmærke direkte til en midlertidig `/api/hassio_ingress/…`-adresse er ikke en varig selvstændig loginadresse. Brug HA's normale adresse og login. Denne pakke eksponerer ikke en separat offentlig Engstien-adresse.

Fjernadgang følger din HA-adgang, fx en allerede opsat privat VPN eller HA Cloud. Et betalt Cloud-abonnement er ikke nødvendigt til lokal brug. Apple TV's Apple Hjem-fjernadgang giver ikke i sig selv adgang til Engstien.

## Afgrænsning

Pakken udfører ikke Matter-parring; det gør HA Companion. Apple TV 4K 3. gen. 128 GB kan levere Thread-netværket. Apple Noter, Renosyd, bil og ladeboks kræver deres særskilte datakilder. Eksisterende demoenheder er fortsat eksempler, indtil de er koblet. Fysisk installation og de konkrete enheders respons skal afprøves på Green.
