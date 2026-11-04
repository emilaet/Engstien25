# Indstillinger og enhedsplan

Åbn **••• → Indstillinger**. Siden har Overblik, Rum og enheder, Forbindelser og Skærm og dashboard. Direkte links som `#settings/devices` og `#settings/connections` kan genindlæses. Den særskilte Rediger-knap, Tag, grafikprofiler og de gamle Datakilder-/hjælp-menuindgange er fjernet. **Rediger dashboard**, **Indretning**, **Møbler** og **Vægge** findes fortsat i menuen.

## Før huset er klar

Kataloget indeholder de 50 enheder, der allerede er repræsenteret i appens model og widgets. Alle begynder som **Planlagt**; dette er ikke en verificeret installationsliste. Gennemgå navn, rum og type, tilføj det der mangler, og markér uønskede enheder som udgået. Der er 14 indendørs rum samt Carport og bil og Udeområder. Et nyt katalogobjekt har ikke automatisk en 3D-model; eksisterende modelobjekter har stabile ankre, der bevares ved omdøbning og katalogflytning.

Planen gemmes lokalt som `engstien-devices-v1`. Ved manglende lagring vises en besked; eksport virker fortsat. Samtidige faner og serverklienter bruger revisionskontrol: et gammelt åbent redigeringsvindue får en fejl frem for at overskrive nyere ændringer. Luk det gamle vindue, vælg **Hent seneste opsætning**, og gennemgå ændringen igen.

## Flyt til installationen

**Skærm og dashboard → Hent backup** eksporterer en valideret JSON-fil med enhedskatalog, koblinger, dashboardlayout og visningsvalg. Adgangskoder, HA-tokens, Spotify-/Apple-konti og private nøgler indgår ikke. Møbler og referencebilleder har deres egen eksport under Indretning. Import kontrollerer fil, typer, rum, ID'er, koblinger og layout før gemning; en erstatning bekræftes særskilt. Et importeret layout anvendes efter genindlæsning.

På GitHub Pages er selve dashboardet stadig en krypteret statisk app. Der sendes ingen HA-token til Pages, og ingen HA-adgangsnøgle kan indtastes der. Kør den eksisterende Node-dashboardserver ved Home Assistant, og åbn dens adresse for at få rigtig HA-adgang. Log ind under **Indstillinger → Forbindelser** med dashboardserverens egen adgangskode.

Ved første serverlogin hentes serverens katalog. Browserens tidligere lokale plan bevares. Den kan overføres eksplicit under Skærm og dashboard, efter bekræftelse; der sker ingen automatisk sammenfletning. Gemte koblinger deles derefter via serverens datafil.

## Forbind Home Assistant

Angiv HA's adresse og en langlivet adgangsnøgle under Forbindelser på dashboardserveren. Tokenet sendes kun til samme server og gemmes i `.local-dashboard/ha-connection.json`, oprettet med filrettigheder 0600. Git ignorerer mappen. Serveren sender ikke tokenet tilbage til browseren eller med i backup. Eksisterende `HA_URL`/`HA_TOKEN`-miljøvariabler understøttes også. GUI-konfiguration går forud for disse ved genstart, indtil konfigurationen ændres. En eksplicit afbrydelse gemmes også og genaktiverer ikke miljøforbindelsen ved genstart.

Serveren henter tilstande via REST og forsøger at hente område-, device- og entitetsnavne via HA's WebSocket-registre. Hvis registrene ikke kan læses, bruges de almindelige entitetsnavne stadig. Responsen til dashboardet er begrænset til de understøttede typer og udvalgte navne, målinger og kapabiliteter; kamera-URL'er og øvrige HA-attributter videregives ikke. Status hentes normalt hvert 30. sekund med kort servercache; **Hent enheder igen** opdaterer eksplicit.

## Kobl og afprøv

Åbn en enhed under Rum og enheder. Vælg blandt kompatible HA-funktioner; forslag sorteres efter rum/navn, og tekniske ID'er vises ved siden af. Hvert match vælges og gemmes af brugeren. Der sendes ingen kommando ved søgning, navigation, valg eller gemning.

Lys bruger én primær funktion, varme en `climate`-funktion og gardiner en `cover`-funktion. Ladeboks og bil har separate koblinger til start/stop, status og relevante målinger. Sensorer og batteri/energi-funktioner er læseadgang. Samme primære HA-funktion kan ikke tilknyttes flere aktive enheder ved et uheld. Sekundære målinger kan deles.

**Afprøv** åbner en særskilt bekræftelse med enhed, rum og handling. Først **Send kommando** sender en rigtig HA-servicehandling. Serveren accepterer kun en kendt, gemt primærkobling og tilladte handlinger for den konkrete type. Lysstyrke, temperaturgrænser og gardinfunktioner valideres mod enhedens kapabiliteter. En accepteret kommando vises som sendt, ikke som en garanteret fysisk ændring; den rapporterede tilstand hentes bagefter.

Eksisterende modellerede lamper, varmezoner og gardiner bruger de gemte koblinger i Rum-visningen. En tænd/sluk-lampe får ingen dæmper. Manglende forbindelser/enheder låser den koblede betjening. Ukendte temperatur- og positionsdata bliver ikke erstattet med opdigtede liveværdier. Ukoblede enheder forbliver demo. Nye katalogobjekter kan aflæses og afprøves i Indstillinger; nye 3D-placeringer kræver en separat modelændring. Bilvisningens eksisterende HA-læseadapter bevares, og nye bil-/ladeboksmålinger kan komme fra katalogets koblinger.

En fysisk installation, HA-rettigheder, rigtige målinger og enheders respons skal stadig afprøves i huset. De automatiske tests bruger en simuleret HA og den rigtige dashboardserver.
