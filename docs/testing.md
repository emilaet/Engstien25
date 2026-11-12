# Hurtig validering og fuld regression

En lille ændring skal ikke vente på hele 3D-browserpakken.

- Lokalt køres de relevante browserfiler for det ændrede område. Eksempel: `npx playwright test browser-tests/charger.spec.js` for lys og navigation ved billaderen. Ved ændringer i logik køres også de hurtige modul-/servertests med `npm test`.
- Ved push til main kører GitHub modul-/servertests, **otte kritiske browserforløb** og adgangskodetestene. Derefter bygges og udgives den krypterede app. En fejl stopper udgivelsen.
- Den fulde browserpakke køres automatisk hver nat og kan vælges manuelt i workflowets **full_suite**-felt. Den natlige kontrol udgiver ingen ny app og afbryder ikke en igangværende udgivelse.
- Ved større ændringer i navigation, lagring, 3D-motor, integrationer eller mange widgets vælges den fulde kontrol før udgivelse.

`npm run test:smoke` bygger appen og kører de eksisterende tests mærket `@smoke`. Det omfatter Hjem/Rum-navigation, lister og genindlæsning, redigering, Indstillinger, Spotify-login fra Hjem/Indstillinger og billaderens overgang/dag/aften. Testene er genbrugt fra den fulde pakke og bliver ikke vedligeholdt som kopier.

`npm run test:browser` kører fortsat alle browserforløb. `npm run test:preview` kontrollerer adgangskoden og det selvstændige krypterede build; de kontroller bevares ved hver udgivelse.

Smokekontrollen er et bevidst mindre sikkerhedsnet end hele pakken. Målrettet lokal kontrol og den natlige gennemgang supplerer den. Der bruges ingen generelle retries eller `continue-on-error` til at skjule fejl.
