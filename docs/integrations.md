# Datakilder, Tesla og drift

GitHub Pages er fortsat en krypteret demo. Den indbyggede Pages-udgave kontakter ingen integrationsserver og indeholder ingen HA- eller bilhemmeligheder. Rum er altid simulerede i denne version. Home Assistant er installeret hos ejeren; den konkrete forbindelse konfigureres senere.

## Lokal dashboardserver

Den valgfrie Node-server kan dele familielister mellem enheder og læse udvalgte Tesla-/ladeboksentiteter fra Home Assistant. Den kan køres på en separat maskine ved HA; den er ikke et HA-add-on og skal ikke installeres inde i HA OS-terminalen. Brug Node 24 eller en version med `--env-file-if-exists`.

1. Kør `npm ci` og `npm run build` i projektmappen.
2. Kopiér `server/config.example.env` til `.env` i projektroden, og vælg dashboardserverens adgangskode. Filen er ignoreret af Git. Del ikke kode eller token i chatten.
3. Kør `npm run server`. Standardadressen er `http://127.0.0.1:4174` på servermaskinen. Under **Datakilder** logges ind med dashboardserverens egen kode. En gyldig session genbruges efter genindlæsning.
4. Til andre enheder på hjemmenetværket kan `DASHBOARD_HOST=0.0.0.0` anvendes sammen med lokal firewall. Brug HTTPS via en betroet proxy eller VPN til varig drift; ved HTTPS sættes `COOKIE_SECURE=true`. Serveren må ikke eksponeres direkte via routerens port-forwarding.

Serveren har én fælles adgangskode, HttpOnly/SameSite-sessioncookies med 12 timers levetid, loginbegrænsning og kontrol af Origin på skrivehandlinger. Den er en lille lokal prototype, ikke en komplet offentlig loginplatform. Sessioner nulstilles ved genstart. Der findes ingen live kommandoer til Tesla, ladeboks, lys, varme eller gardiner.

Lister gemmes i `.local-dashboard/data.json`. Tag backup af den mappe, begræns adgang til maskinen, og brug én serverproces pr. datafil. Første start indeholder tydeligt beskrevne eksempelopgaver og varer, som kan redigeres eller fjernes. Serverlister er ikke Apple Noter. De opdateres straks efter egne handlinger og ellers hvert 30. sekund på andre enheder. Ved fejl beholdes de viste punkter med fejlbesked; fejlede handlinger bliver ikke meldt som gemt og sættes ikke i en skjult offlinekø.

Lokale browserdata og serverdata sammenflettes ikke automatisk ved tilslutning. Standarddemoens rum/lister bruger en journal med uafhængige ændringer, så samtidige faner ikke erstatter hele hinandens øjebliksbilleder. Journalen har endnu ingen automatisk komprimering; langvarig drift kræver databaselagring/komprimering med samtidighedskontrol. Ved fuldt/blokeret lager fortsætter demoen i hukommelsen med tydelig besked.

## Tesla via Home Assistant

Batteriprocent kan læses via HA's Tesla Fleet-integration, hvis bilen og ejerens konto giver adgang. Den konkrete HA/Tesla-opsætning kan kræve Tesla-applikationsregistrering, rettigheder og eventuel Fleet API-betaling. Dette projekt opretter ingen Tesla-konto, registrerer ingen applikation og har ikke testet ejerens bil. Se [HA Tesla Fleet](https://www.home-assistant.io/integrations/tesla_fleet/) og [Teslas Fleet API](https://developer.tesla.com/docs/fleet-api).

Konfigurér først HA-integrationen, og kontrollér værdierne i **Udviklerværktøjer → Tilstande**. I serverens `.env` sættes `HA_URL`, et HA-token og de relevante entitets-ID'er. Tokenet er kun i servermiljøet og sendes aldrig til browseren. HA-tokenets reelle rettigheder bestemmes af HA-kontoen; serverens læsebegrænsning gør ikke i sig selv tokenet til et read-only-token.

| Variabel | Forventet måling |
| --- | --- |
| `TESLA_BATTERY_ENTITY` | Batteriprocent, tal 0–100; kræves for aktivering |
| `TESLA_STATUS_ENTITY` | `charging`/`on`, `stopped`/`off`, `complete`, `disconnected`, `starting` eller `asleep` |
| `TESLA_TARGET_ENTITY` | Bilens lademål i procent |
| `TESLA_POWER_ENTITY` | Målt effekt med enheden `W` eller `kW` |
| `TESLA_ENERGY_ENTITY` | Sessionsenergi med enheden `Wh` eller `kWh` |
| `TESLA_REMAINING_ENTITY` | Valgfri bilrapporteret resttid i `min`/`minutes` eller `h`/`hr` |
| `CHARGER_STATUS_ENTITY` | Separat status fra **hjemmets ladeboks**, `on`/`charging` ved aktiv opladning |

Hvis HA bruger andre statusnavne, opret en HA-template med de forventede værdier. Brug ikke bilens generelle charging-sensor som ladeboksstatus: bilen kan lade ude. Grøn puls kræver bekræftet hjemmeboksstatus, rapporteret inden for fem minutter. Det kan give konservativt slukket puls på integrationer med langsom opdatering.

REST-aflæsningen følger dashboardets opdatering hvert 30. sekund i synlig browser. Serveren læser HA's kendte tilstande; den sender ikke wake-up- eller ladehandlinger til bilen. Det garanterer ikke, at HA's egen Tesla-integration aldrig vækker bilen eller bruger betalte API-kald. Batterimålinger over 15 minutter mærkes som sidst kendte data; tidspunktet er HA-målingens tidspunkt, ikke blot tidspunktet for HTTP-hentningen. Ved fejl beholdes sidst kendte data i serverhukommelsen med offline-status. Flere klienter poller separat; ratebegrænset servercache er et næste driftstrin ved flere skærme.

Ukendte tal bliver `—`. Enhedsløse effekt-/energisensorer bruges ikke til beregning. Ukendt kapacitet giver ingen opdigtet resttid; bilrapporteret resttid foretrækkes. Demoestimatet bruger 75 kWh og 90 % virkningsgrad. Prisen er stadig et demoeksempel: der findes ingen OK-afregning eller tariffintegration. Live start/stop og ændring af målprocent er låst, indtil den faktiske kommandovej, feedback og fejlhåndtering er implementeret og afprøvet.

## Apple Noter og Renosyd

Apple Noter er den valgte kilde og er ikke erstattet af Påmindelser. Ingen Apple-integration er aktiveret. Næste skridt er at afprøve en understøttet genvej på en Apple-enhed og vælge en-/tovejs synkronisering med vedvarende punkt-ID'er og konfliktregler. Indtil da er serverens fælles handleliste selvstændig.

Renosyd-kalenderen er fortsat eksempeldatoer og eksempelbeholdere, også på serveren. [AffaldDK](https://github.com/briis/affalddk) beskriver Renosyd-support, men opslag, login, adresse og de korrekte fraktioner er ikke verificeret her. Konfigurér/test kalenderen i HA eller en reel kalendereksport, før den betegnes som live. Personlige kalenderlinks og login skal blive på serveren.

## Kontrol og udrulning

`npm test` tester blandt andet sessionslogin, fælles lagring/genstart, isoleret fortrydelse, CSRF, enheder, cached bildata og skrivebeskyttelse. `npm run test:browser` kontrollerer betjening, flersynk, hukommelsesfallback, datoskift, ladetilstande og hvile-rendering. `npm run test:preview` tester den krypterede udgave med en kort, tilfældig testkode. GitHub Actions kører alle tre før offentliggørelse med den rigtige Pages-secret.

Der er ikke konfigureret nogen live forbindelse, før ejeren har indsat og afprøvet de faktiske entiteter på den lokale server. Vægtablet, enhedernes præcise liste, reelle målinger, sensorernes opdateringsrytme og internetudfald skal stadig afprøves i hjemmet.
