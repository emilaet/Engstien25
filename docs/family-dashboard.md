# Familieforside med dummydata

**Hjem** er landingssiden med huskeliste, handleliste og tømmekalender. **Rum** er den eksisterende 3D-model med alle husets betjeningsmuligheder. Hash-navigation (`#home`, `#rooms`, `#lights`, `#heat`, `#car`) understøtter genindlæsning og browserens tilbageknap. 3D-modellen oprettes først ved første besøg i Rum/lysstyring og rendres ikke, når den er skjult bag Hjem.

## Kilder og nuværende funktioner

- Huskeliste: lokale eksempelopgaver. Nye punkter kan tilføjes, afkrydses, genåbnes og fjernes, når de er klarede.
- Handleliste: Apple Noter er den ønskede fremtidige kilde. Nu er data lokale eksempler. Tilføjelse/afkrydsning påvirker **ikke** Apple Noter.
- Renosyd: kalenderen er **ikke** forbundet til Renosyd. Datoer og beholdersammensætninger genereres relativt til dagen, så demonstrationen viser kommende tømninger. De må ikke bruges som den faktiske tømmekalender.
- Listeændringer gemmes som en ændringsjournal under `engstien-family-v1` og tilhørende `:op:`-nøgler i browserens lokale lager. De synkroniseres mellem åbne faner, men ikke mellem enheder. Den valgfrie [dashboardserver](integrations.md) kan dele lister mellem enheder. Rumindstillinger bruger fortsat deres egen eksisterende nøgle.

Dagsberegninger bruger Europe/Copenhagen og kalenderdage, så de ikke forskydes ved dansk sommer-/vintertid.

## Grænseflade til senere livekilder

`src/family-data.js` ejer data, validering og persistens. `src/family-dashboard.js` ejer visning og interaktion. Dashboardet modtager en provider ved oprettelse, så det ikke selv skal kende Apple- eller Renosyd-login, URL'er eller datalagring.

Providerens asynkrone kontrakt er:

```js
load()                         // -> FamilySnapshot
addItem('tasks'|'shopping',text) // -> opdateret FamilySnapshot
setDone(list,id,boolean)        // -> opdateret FamilySnapshot
editItem(list,id,patch)         // -> opdateret FamilySnapshot
clearCompleted(list)           // -> opdateret FamilySnapshot
undo()                         // -> gendan senest fjernede punkter i denne session
```

Snapshot indeholder `today` som ISO-kalenderdag, `tasks`, `shopping`, `waste`, `sources`, `mode` og `persistence`. Et listepunkt har `id`, `text`, `done`, valgfri `detail` og valgfri ISO-dag `due`. En tømning har `id`, ISO-dagen `date`, en `label` og en liste af fraktionsnøgler fra `src/waste-icons.js`. Kilder er eksplicit mærket som demo i denne version. Ved tilslutning af en liveprovider skal kildebadges og hjælpetekster også skifte til den faktiske forbindelsesstatus, og read-only-kilder skal håndteres tilsvarende.

Apple Noter har ikke en almindelig browserintegration i denne løsning. Undersøg en understøttet bro, fx Apple Genveje til et privat server-/Home Assistant-endpoint. Afklar om synkronisering skal være en- eller tovejs, og hvordan punkt-ID'er og samtidige ændringer håndteres. Der må ikke lægges Apple-sessioner eller hemmeligheder i GitHub Pages-koden.

Renosyd kræver særskilt undersøgelse af den faktiske kalenderadgang. AffaldDK beskriver Renosyd-support, som kan undersøges sammen med den installerede Home Assistant-instans; det er ikke testet for denne adresse. Hvis Renosyd tilbyder en eksport eller et abonnementslink, kan det også vurderes. Login og personlige kalenderlinks hører til på en server/HA, ikke i den statiske hjemmeside.

## Piktogrammer

SVG-filerne i `src/assets/waste` er kopieret uændret fra `briis/affalddk`, commit `541ea68a479cf4d22742811f39c4be8f935557c5`, fra `custom_components/affalddk/images`. De anvender danske affaldssymboler og fraktionsfarver. Kombinerede fraktioner har deres egne kombinerede ikoner. Kilde og hele projektets MIT-licenstekst findes i appens **Datakilder og ikoner**-dialog og i `src/assets/waste/LICENSE.txt`.

Alle ikoner og licenstekster indlejres i den krypterede single-file-udgave, så den publicerede side ikke henter eksterne ikoner efter oplåsning.

## Kontrol

`npm test` kontrollerer blandt andet kalenderdage, persistens, isolering mellem lister, ugyldige input og fejl ved lagring. `npx playwright test` afprøver lister, HTML-escaping, navigation, affaldsikoner, responsive layouts og de eksisterende husfunktioner. `npm run test:preview` afprøver også familieforsiden efter oplåsning og bekræfter fortsat, at den krypterede udgave ikke henter eksterne app-assets.
