# Engstien 25

Browserbaseret 3D-prototype til husoversigt på vandret vægtablet og computer. Alle enheder og ladeoplysninger er **simulerede**. Der er ingen forbindelse til Home Assistant, Tesla eller OK.

## Start

Node.js 22.12+ eller 24 og npm er nødvendige.

```sh
cd /workspace/Engstien25
npm ci --cache /tmp/engstien-npm-cache
npm run dev -- --port 5173
```

Åbn appen via din udviklingsklients portvisning eller din lokale browsers adresse til udviklingsserveren. Serveren lytter på port 5173. Ved lokal installation bruges projektmappen i stedet for `/workspace/Engstien25`.

## Betjening

- Kort tryk på gulvet: sluk alle lamper i rummet hvis mindst én er tændt; ellers tænd alle.
- Hold 650 ms, højreklik eller tryk på rumnavn/listen: rummenu.
- Rummenu: separate loftslys og bordlampe, lysstyrke og gulvvarmens måltemperatur.
- Stuemenu: tre separate rullegardiner med 0 % = lukket og 100 % = åbent.
- Træk roterer, musehjul/to fingre zoomer. Husknappen nulstiller kameraet.
- Ladeoversigten demonstrerer pause/start, målprocent og pris. Estimat antager 75 kWh og konstant 11 kW; ingen faktisk telemetri.

Rumindstillinger gemmes i browserens localStorage. Aktuelle temperaturer og bilstatus er statiske testdata. Lysstyrke er en fælles simuleret værdi for rummet; individuel lampedæmpning er ikke implementeret. Rummene har to eksempellamper hver, som senere skal erstattes af en faktisk enhedsliste.

## Kontrol

```sh
npm test
npm run build
npx playwright test
```

Browsertestene bruger `/usr/bin/chromium` i cloudmiljøet. Justér `playwright.config.js` til din browserinstallation, hvis du kører dem andetsteds. De verificerer WebGL, betjening, bevaret tilstand, rumtryk/hold/rotation samt responsive layouts. Enhedstestene kontrollerer lysgrupper, isolation mellem rum, modeloverlap og ladeberegning.

## Model og begrænsninger

`src/house.js` gemmer rumkoordinater i meter, navne og testtilstand separat fra rendering. Planen er manuelt fortolket fra `Floorplan.png`; rumgrænser, åbninger og ydermål skal afstemmes yderligere. Arealangivelser er fra tegningen og kan afvige fra de forenklede rektangler. Højder, vinduesmål og møbler er foreløbige, ikke en udførelsesmodel. Tag/loft er skjult i dashboardet; loftshældning er endnu ikke modelleret. Køkkenet er en forenklet fortolkning af HTH-materialet, ikke en fuld gengivelse. Soveværelse og sofa er stiliserede pladsholdere, ikke præcise produktmodeller fra de oplyste links.

`src/scene.js` bygger separate Three.js-objekter til rum, inventar og gardiner. Modellen er genereret fra data, ikke et færdigt GLB-aktiv. GLB-eksport, rumvandring og møbelredigering kommer senere. Den aktuelle visning skalerer til mindre skærme; enhedens faktiske ydelse bør prøves før valg af vægtablet.

## Videre plan

1. Afstem grundmodel og kameravinkel med ejeren, og ret mål/åbninger/materialer.
2. Tilpas lamper og varmezoner til el- og VVS-planen. Afklar gulvvarmesystem, Shelly, Matter/Thread og Zigbee-enheder.
3. Installér Home Assistant og implementér en adapter fra de lokale tilstande/handlinger til faktiske entiteter. Authentication skal håndteres sikkert, ikke gemmes i kildekode eller browserens localStorage.
4. Undersøg adgang og integrationsmuligheder til Tesla og den valgte OK-ladeboks. Afklar kWh-pris, tariffer og batterikapacitet; manglende data skal vises som ukendte.
5. Tilføj præcise møbelmodeller, redigering, GLB-eksport, gemte kameravinkler og mulighed for at gå ind i rummene.

Indflytning er forventet 15. september 2027. Første version kan afprøves før hardware og Home Assistant er installeret.

## Adgangskodebeskyttet GitHub Pages-preview

Workflowet `.github/workflows/pages.yml` bygger en enkelt HTML-fil med indlejret JavaScript, model og skrifttyper. Hele filen krypteres med StatiCrypt, før den publiceres. Pages modtager kun `.preview/site/index.html` og `.nojekyll`, aldrig rå fotos, PDF, modeldata eller ukrypterede app-filer. Der er én fælles adgangskode og ingen brugere. Browseren låser op lokalt, og siden kræver adgangskoden igen efter genindlæsning. En forkert kode åbner ikke appen.

Første opsætning på GitHub:

1. Behold kildekode-repositoryet privat. Sidekryptering beskytter ikke filer i et offentligt repository. Hvis din GitHub-plan ikke understøtter Pages fra et privat repository, skal vi vælge en anden løsning; gør ikke repositoryet offentligt for at løse det.
2. Under **Settings → Secrets and variables → Actions → New repository secret** oprettes `PREVIEW_PASSWORD`. Brug den fælles adgangskode, I ønsker. Der er intet minimumskrav; en kort kode er lettere at gætte. Skriv den ikke i kildekode, issues, Actions-inputfelter eller chatten.
3. Under **Settings → Pages → Build and deployment → Source** vælges **GitHub Actions**. Hvis GitHub beder om tilladelse til Actions eller et Pages-miljø, skal repositoryets ejer aktivere det.
4. Gå til **Actions → Password-protected preview → Run workflow** på `main`. Efter vellykket build og deploy findes den faktiske adresse i deployment-resultatet og under **Settings → Pages**.

Fremtidige ændringer i appen på `main` genudgiver automatisk previewet. Efter ændring af adgangskoden i secret skal workflowet køres igen. Ændringen tilbagekalder ikke kopier, som en person allerede har låst op eller downloadet. Dette er krypteret statisk deling, ikke serverbaseret login eller en beskyttelse til live Home Assistant-adgang.

Lokalt kan den krypterede udgave bygges med `npm run build:pages`, når `PREVIEW_PASSWORD` er sat sikkert i procesmiljøet. Kommandoen fejler uden kode, og ukrypterede mellemprodukter fjernes. `npm run test:preview` bruger en tilfældig, midlertidig testkode og kontrollerer forkert/rigtig kode, fungerende 3D, ingen eksterne app-assets og afvisning af build uden kode. Testkoden publiceres eller udskrives ikke.
