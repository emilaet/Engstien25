# Fælles dashboardopsætning

GitHub Pages er en statisk, krypteret hjemmeside. Adgangskoden åbner appen; den opretter ingen bruger eller konto. GitHub Pages kan derfor ikke selv gemme ændringer centralt. Den gratis Supabase-forbindelse gemmer nu profiler efter kontologin; se [opsætning af Supabase](supabase.md). Uden kontologin starter en privat browser uden det lokale layout.

Projektets Node-dashboardserver har nu en fælles profil for husstanden. Efter login under **Indstillinger → Forbindelser** hentes profilen automatisk. Home Assistant behøver ikke være tilsluttet for at dele dashboardet. Serveren skal være online på en fast adresse, og alle enheder skal bruge dens adresse. Node-serveren er et alternativ til den gratis Supabase-lagring. På dens adresse bruges serverens eksisterende login og profil.

Profilen omfatter:

- Widgetrækkefølge, placering, størrelser og synlighed.
- Mobilens separate bredder (50 eller 100 %), højder, rækkefølge, synlighed og kompakte listevisning.
- Alle widgetters visningsindstillinger og planlagte Notes-koblinger.
- Dag/aften/auto, læsetæthed og dagsblikkets synlighed.

Node-serveren har én profil for huset. Supabase har en privat profil for hver appkonto. Telefonen bruger profilens mobilopsætning, så den stadig passer til skærmen. Musik- og kalenderlogin, adgangskoder, tokens, møbelbilleder og usendte layoutudkast indgår ikke. Enhedskatalog og lister har deres eksisterende separate serverlagring.

## Tilpas telefonen fra computeren

Åbn **Indstillinger → Skærm og dashboard → Tilpas mobildashboard**. Telefon-previewen viser 390 px bredde; vælg widgets, visning, bredde, højde og rækkefølge. Hver widget kan fylde **50 %** eller **100 %**. To halvbreddekort deler en række; et kort i fuld bredde begynder under rækken. Ved forskellige højder begynder næste række under det højeste kort. Vælg **Gem dashboard**, eller **Annuller** for at forlade kladden. Skift mellem **iPad / computer** og **Mobil** i redigeringsbjælken for at arbejde med hver opstilling. Nulstilling gælder kun den valgte opstilling. Begge gemmes på samme konto efter login, uden at mobilvalg ændrer iPad-placeringerne.

På telefonen starter oversigten med kalender og musik i halv bredde, elpriser i fuld bredde, to listekort og et kamerakort. De tre prikker → **Visningsindstillinger → Bredde på mobil** ændrer også bredden direkte på telefonen. Halvvisningen viser de vigtigste tal og åbner hele widgetten ved tryk. Kortene og dagsblikket har ingen indvendig scroll på mobil; elprisernes timebjælker kan fortsat rulles vandret. Vejr og Tesla ligger i toppen, og tømninger åbnes fra dagsblikket. Andre kort kan tilvælges. Når huskortet er skjult, indlæses 3D-modellen først ved behov.

## Flyt den nuværende opstilling

1. Åbn det nuværende dashboard i den browser, hvor den ønskede opstilling findes. Vælg **Indstillinger → Skærm og dashboard → Hent backup**. Backup indeholder nu også widgetindstillinger.
2. Start serveren som beskrevet i [integrationsvejledningen](integrations.md). Ved hosting skal appen bygges med `npm ci && npm run build`, startes med `npm run server` og have `DASHBOARD_HOST=0.0.0.0`. Hostingens HTTPS-proxy kræver `COOKIE_SECURE=true`. Vælg en privat `DASHBOARD_PASSWORD` i hostingens miljøindstillinger.
3. Brug et vedvarende datalager til `DASHBOARD_DATA`, eksempelvis `/data/dashboard.json`, og én serverproces. Et midlertidigt filsystem mister opsætningen ved genudrulning. Gem også HA-konfigurationen vedvarende, når den senere tilsluttes.
4. Åbn den nye serveradresse, log ind og indlæs backup under **Skærm og dashboard**. Importen viser en bekræftelse, fordi enhedskataloget også gendannes. Del ikke backup offentligt; den indeholder husets opsætning.
5. Kontrollér status **“Opstillingen er gemt fælles for huset”**. En ny privat browsersession på samme serveradresse henter derefter samme profil efter login. En iPhone-webapp skal gemmes fra denne nye adresse.

Browserlager på GitHub-adressen kan ikke læses automatisk fra en anden serveradresse. Backupflytningen bevarer det eksisterende layout. En server uden profil overtager den første indloggede browsers gemte opstilling; en server med profil hentes til nye browsere uden at blive erstattet af deres standardlayout.

## Fejl og samtidige ændringer

Gemte ændringer sendes automatisk efter en kort pause. Uden forbindelse bevares ændringer lokalt og forsøges sendt igen ved næste opdatering. Et åbent layoutudkast erstattes aldrig af en opdatering fra serveren. Ved samtidige gemninger afviser serveren et gammelt revisionsnummer. **Skærm og dashboard** tilbyder derefter at hente husets profil eller bevidst bruge den lokale opstilling for huset. Der sker ingen skjult overskrivning.

Profilens API er `GET/PUT /api/settings/profile` under serverens eksisterende sessionslogin. API-svar caches ikke; skrivninger kræver samme origin og korrekt revision. Data gemmes i serverens datafil og er derfor stadig til stede efter en genstart. Sessioner skal logges ind igen efter servergenstart.

Automatiske tests dækker to isolerede browsermiljøer, revisionskonflikter, offlineændringer, servergenstart og beskyttelse af åbne udkast. Offentlig hosting og fysiske iPhone-enheder skal afprøves ved den faktiske opsætning.
