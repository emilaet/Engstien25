# Engstien 25

Browserbaseret 3D-prototype til husoversigt på vandret vægtablet og computer. GitHub Pages bruger **simulerede** data. En valgfri lokal dashboardserver kan dele familielister og læse Tesla-/ladeboksdata via Home Assistant; forbindelsen er ikke konfigureret endnu. Se [opsætning og datakilder](docs/integrations.md).

## Start

Node.js 22.12+ eller 24 og npm er nødvendige.

```sh
cd /workspace/Engstien25
npm ci --cache /tmp/engstien-npm-cache
npm run dev -- --port 5173
```

Åbn appen via din udviklingsklients portvisning eller din lokale browsers adresse til udviklingsserveren. Serveren lytter på port 5173. Ved lokal installation bruges projektmappen i stedet for `/workspace/Engstien25`.

## Familieforside

**Hjem** åbner familiens overblik med en redigerbar huskeliste, en handleliste med Apple Noter som planlagt kilde og en Renosyd-eksempelkalender med danske affaldspiktogrammer. Lister kan redigeres, ryddes og gendannes med Fortryd. Listeændringer gemmes på den enkelte enhed og deles mellem faner; Apple Noter og Renosyd er endnu ikke tilsluttet. **Rum** åbner den eksisterende husmodel. Se [dataarkitektur og kildebegrænsninger](docs/family-dashboard.md).

## Indretning

Der vises et første møbleret udkast efter ejerens billeder og produktlinks samt HTH-tegningerne. Sofaen er lige med en separat bred lænestol, og spisegruppen har seks træstole. Børneværelserne har foreløbige juniorsenge og lav opbevaring. Mål, produkter og rumfordeling skal fortsat afstemmes.

I **Rum → Indretning** vælges et møbel i listen eller direkte i modellen. Her kan navn, mål, rotation, placering, farve og materiale ændres. Fast inventar har låste mål/placeringer i formularen. Produktlink, referencebillede og ønsker til næste modelopdatering gemmes pr. møbel. **Hent indretningsfil** eksporterer disse oplysninger inklusive billeder; filen kan vedhæftes i chatten eller indlæses igen. Ingen automatisk billedgenkendelse eller modelændring ud fra links er tilsluttet.

**Møbler** viser/skjuler hele inventaret. Alle ydervægge bevares også med møbler. Snitvisningen sænker væggene ensartet til 1,2 m; **Vægge** viser alle vægge i fuld højde. Geometrien og åbningerne i grundplanen ændres ikke. Se [møbeldata, kilder og begrænsninger](docs/furnishing.md).

## Betjening

På **Hjem** åbner **••• → Rediger dashboard** et fast grid, hvor alle syv kort kan flyttes og få ny bredde/højde. Brug trækhåndtag, pileknapper eller piletaster. Gem, annuller eller gendan standardlayoutet; indstillingerne gemmes på denne enhed.

I **Rum** folder pilen ved hvert rum en menu ud med separate lamper, lysstyrke, varme og eventuelle gardiner. Rumnavnet åbner fortsat den fulde rummenu.

Menuen består af **Hjem**, **Rum** og **Billader**. Lys og varme styres under Rum. **Billader** flyver kameraet frem til OK-boksen til venstre for skurdøren. Den grønne ring pulserer ved simuleret opladning og bliver afdæmpet på pause. Reduceret bevægelse understøttes.

- Rumlabels er skjult som standard. Et valgt rum får sin egen label under justering; et gulvtryk markerer rummet og folder enhederne ud i listen. **Aa** viser eller skjuler alle rumnavne manuelt.
- Gyldne gulve og gule statusfelter viser tændt lys. Afdæmpede gulve og grå statusfelter viser slukket lys. Rumlisten viser også delvist tændte rum, fx **1/2 tændt**.
- **Tænd alt lys** og **Sluk alt lys** styrer samtlige lamper i huset, inklusive separate bordlamper. Temperaturer, gardiner og gemt lysstyrke ændres ikke.
- Kort tryk på gulvet: markér rummet og åbn dets enheder i højremenuen. Trykket ændrer ingen enhedstilstand.
- Hold 650 ms, højreklik eller tryk på rumnavn/listen: vælg og fold rummet ud. Alle muligheder åbner den fulde rummenu.
- Rummenu: separate loftslys og bordlampe, lysstyrke og gulvvarmens måltemperatur.
- Stuemenu: tre separate rullegardiner med 0 % = lukket og 100 % = åbent.
- Træk roterer, musehjul/to fingre zoomer. Husknappen nulstiller kameraet.
- Ladeoversigten demonstrerer pause/start, målprocent og pris. Estimat antager 75 kWh og konstant 11 kW; ingen faktisk telemetri.

Rumindstillinger gemmes i browserens localStorage. Aktuelle temperaturer er testdata. Ladetilstand og pause gemmes separat og kan afprøves via scenarier; ukendte data vises som manglende. Lysstyrke er en fælles simuleret værdi for rummet; individuel lampedæmpning er ikke implementeret. Rummene har to eksempellamper hver, som senere skal erstattes af en faktisk enhedsliste.

## Kontrol

```sh
npm test
npm run build
npm run test:browser
npm run test:preview
```

Browsertestene bruger `/usr/bin/chromium` i cloudmiljøet. Sæt `CHROMIUM_PATH` ved en anden lokal browserinstallation. CI installerer Playwright Chromium. De verificerer WebGL, betjening, bevaret tilstand, rumtryk/hold/rotation samt responsive layouts. Enhedstestene kontrollerer lysgrupper, isolation mellem rum, modeloverlap og ladeberegning.

## Model og begrænsninger

Modellen vises nu med et første møbeludkast og den faste billader ved skuret. Møbler-knappen giver fortsat en tom visning til kontrol af vægge og åbninger. **Plan** viser en ortografisk plantegning, og **Vægge** skifter mellem snit i 1,2 m og fuld højde.

`src/architecture.js` samler vægforløb, åbninger og rumkonturer, aflæst fra `Floorplan.png`. `src/structure.js` genererer vægge med rigtige huller, dørblade, bueslag og vinduesrammer. `src/house.js` gemmer rumidentitet og testtilstand. Forskydninger ved kontor/entré og depot er med i gulvpolygonerne. Højden går fra 2,4 til 3,1 m efter facadetegningen. De almindelige vinduers præcise højder og karmmål er stadig omtrentlige; se [geometrigennemgangen](docs/geometry-review.md) for kilder, adgangsveje og usikkerheder.

`src/scene.js` samler visningen. Modellen er genereret fra data, ikke et færdigt GLB-aktiv. Møbelredigering er implementeret på de parametriske modeller. GLB-eksport og egentlig rumvandring kommer senere. Enhedens faktiske ydelse bør prøves før valg af vægtablet. Gardinbetjening er bevaret som testdata, men fysiske gardiner er fjernet sammen med inventaret.

## Videre plan

1. Afstem grundmodel og kameravinkel med ejeren, og ret mål/åbninger/materialer.
2. Tilpas lamper og varmezoner til el- og VVS-planen. Afklar gulvvarmesystem, Shelly, Matter/Thread og Zigbee-enheder.
3. Home Assistant er installeret. Konfigurér serverens læseadapter, og implementér senere styring af de faktiske rumenheder. Authentication skal håndteres sikkert, ikke gemmes i kildekode eller browserens localStorage.
4. Undersøg adgang og integrationsmuligheder til Tesla og den valgte OK-ladeboks. Afklar kWh-pris, tariffer og batterikapacitet; manglende data skal vises som ukendte.
5. Tilføj præcise møbelmodeller, redigering, GLB-eksport, gemte kameravinkler og mulighed for at gå ind i rummene.

Indflytning er forventet 15. september 2027. Dashboardet kan afprøves med dummydata før tilslutning af hardware.

## Adgangskodebeskyttet GitHub Pages-preview

Workflowet `.github/workflows/pages.yml` bygger en enkelt HTML-fil med indlejret JavaScript, model og skrifttyper. Hele filen krypteres med StatiCrypt, før den publiceres. Pages modtager kun `.preview/site/index.html` og `.nojekyll`, aldrig rå fotos, PDF, modeldata eller ukrypterede app-filer. Der er én fælles adgangskode og ingen brugere. Browseren låser op lokalt, og siden kræver adgangskoden igen efter genindlæsning. En forkert kode åbner ikke appen.

Første opsætning på GitHub:

1. Repositoryet er gjort offentligt efter ejerens valg for at aktivere Pages. Kildekode, tegninger og billeder i GitHub er derfor offentlige; adgangskoden beskytter kun det krypterede preview. Læg aldrig personlige live-data eller hemmeligheder i repositoryet.
2. Under **Settings → Secrets and variables → Actions → New repository secret** oprettes `PREVIEW_PASSWORD`. Brug den fælles adgangskode, I ønsker. Der er intet minimumskrav; en kort kode er lettere at gætte. Skriv den ikke i kildekode, issues, Actions-inputfelter eller chatten.
3. Under **Settings → Pages → Build and deployment → Source** vælges **GitHub Actions**. Hvis GitHub beder om tilladelse til Actions eller et Pages-miljø, skal repositoryets ejer aktivere det.
4. Gå til **Actions → Password-protected preview → Run workflow** på `main`. Efter vellykket build og deploy findes den faktiske adresse i deployment-resultatet og under **Settings → Pages**.

Fremtidige ændringer i appen på `main` genudgiver automatisk previewet. Efter ændring af adgangskoden i secret skal workflowet køres igen. Ændringen tilbagekalder ikke kopier, som en person allerede har låst op eller downloadet. Dette er krypteret statisk deling, ikke serverbaseret login eller en beskyttelse til live Home Assistant-adgang.

Lokalt kan den krypterede udgave bygges med `npm run build:pages`, når `PREVIEW_PASSWORD` er sat sikkert i procesmiljøet. Kommandoen fejler uden kode, og ukrypterede mellemprodukter fjernes. `npm run test:preview` bruger en tilfældig, midlertidig testkode og kontrollerer forkert/rigtig kode, fungerende 3D, ingen eksterne app-assets og afvisning af build uden kode. Testkoden publiceres eller udskrives ikke.
