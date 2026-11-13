# Fælles dashboardopsætning

GitHub Pages er en statisk, krypteret hjemmeside. Adgangskoden åbner appen; den opretter ingen bruger eller konto. GitHub Pages kan derfor ikke selv gemme ændringer centralt. En privat browser starter uden det lokale layout.

Projektets Node-dashboardserver har nu en fælles profil for husstanden. Efter login under **Indstillinger → Forbindelser** hentes profilen automatisk. Home Assistant behøver ikke være tilsluttet for at dele dashboardet. Serveren skal være online på en fast adresse, og alle enheder skal bruge dens adresse. Denne ændring opretter eller udgiver ingen server og er derfor ikke aktiveret som cloudlagring på GitHub Pages.

Profilen omfatter:

- Widgetrækkefølge, placering, størrelser og synlighed.
- De separate højder og rækkefølger til mobilvisningen.
- Alle widgetters visningsindstillinger og planlagte Notes-koblinger.
- Dag/aften/auto, læsetæthed og dagsblikkets synlighed.

Der er én profil for huset, ikke individuelle brugerprofiler. Telefonen bruger profilens mobilopsætning, så den stadig passer til skærmen. Musik- og kalenderlogin, adgangskoder, tokens, møbelbilleder og usendte layoutudkast indgår ikke. Enhedskatalog og lister har deres eksisterende separate serverlagring.

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
