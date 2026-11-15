# Udgivelse til Green

## To spor

- **Forhåndsvisning:** Push til main udgiver fortsat den krypterede GitHub Pages-app gennem den eksisterende workflow.
- **Green:** En ændring af `engstien/config.yaml` på main starter Green-udgivelsen. Normale rettelser til udviklingskoden ændrer ikke i sig selv den installerede Green-version.

## Udgiv en færdig rettelse

1. Kør `npm run release:green -- 0.2.1` med et nyt, højere versionsnummer. Scriptet opdaterer package/lock, frontendversion, HA-konfiguration og Docker-versioner.
2. Beskriv ændringen øverst i `engstien/CHANGELOG.md`.
3. Commit og push til main. Ingen adgangskoder eller enhedssnapshots skal med.
4. **Green app release** kontrollerer versioner, kører modul-/servertests og Green-browsertestene, bygger frontend og publicerer en GitHub-release `green-v0.2.1`. Tar-pakken og dens SHA-256-fil offentliggøres sammen, efter testen er bestået.
5. I HA vælges Genindlæs/Søg efter opdateringer i appbutikken, hvis den nye version ikke er fundet endnu. Vælg Opdater på Engstien og gerne backup før opdatering.

En allerede udgivet versions pakke overskrives ikke. Brug et nyt nummer til en ny rettelse. Hvis bygningen fejler, skal fejlen rettes før installation; eksisterende installationer fortsætter med deres version.

## Hvad Green downloader

Appens Dockerfile henter den allerede byggede, versionsbestemte pakke fra projektets offentlige GitHub-release, kontrollerer SHA-256 og lægger den i den officielle Node 24-runtime til maskinens arkitektur. Green foretager ikke npm-installation eller frontendkompilering. Det samme program kan køre på aarch64 og amd64; der følger ingen platformsafhængige npm-runtimepakker med.

Denne distribution kræver ikke en separat container-registry eller login til private packages. GitHub bygger programmet; HA samler automatisk det lille installationsimage på Green. Ved første installation skal runtime og pakke downloades, hvilket kan tage lidt tid.

## Data og genindlæsning

Programmet ligger i `/app`; husstandens gemte data ligger i `/data/dashboard.json`. En ny programversion overskriver ikke datamappen. Serveren lukker igangværende forespørgsler og skriver ændringer til disk, før den stopper. Kold app-backup tager også datamappen med. Afinstallation er anderledes end opdatering og kan slette data.

Frontend og server får samme versions-/build-ID. Åbne dashboards kontrollerer den lokale servers version hvert minut og ved tilbagevenden til fanen. Ved en ny installeret udgave vises **Ny version klar**. Der genindlæses ikke automatisk midt i arbejdet. Knappen er låst, mens en dialog/redigering eller gemning/kommando stadig er aktiv.

Rollback kræver både den ønskede programversion og data, den kan læse. Brug HA's backup/gendannelse, hvis en ny version senere ændrer dataformat. Det er ikke tilstrækkeligt altid at installere en gammel kodepakke oven på nyere data.

## Lokal kontrol

`npm run check:green`, `npm test`, `npm run build` og `npx playwright test browser-tests/green-app.spec.js` dækker versionskonsistens, proxyadgang, installationens stier, bevarelse af data, import, rettigheder og opdateringsbesked. `node scripts/bundle-green.mjs` bygger releasefilen efter frontendbygningen. Brug samme `APP_BUILD` til begge trin.

Rodens Dockerfile er til lokal containerkontrol. Dockerfile i `engstien/` er selve HA-installationsvejen og henter den udgivne pakke. Fysisk Green-, Safari- og Matter-afprøvning er stadig nødvendig i hjemmet.
