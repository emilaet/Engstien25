# Robotter i Engstien

Implementeret 20. november 2026. Sider og HA-forbindelse er afprøvet mod en simuleret Home Assistant. Fysisk funktion og de præcise muligheder afventer opsætning af Green og tilføjelse af robotterne.

## Modeller og placering

- **Sort Roborock Qrevo 5AE**, allerede i Roborock-appen. Den store tømnings-/vaskestation står ved væggen mellem stue og alrum, efter markeringen på plantegningen.
- **Mammotion Yuka Mini 2 RTK Vision, 800 m²**, endnu ikke købt. [Brugerens produktlink](https://www.bauhaus.dk/mammotion-yuka-mini-2-rtk-vision-robotplaeneklipper-800-m). Stationen står på græs ved skuret med fronten væk fra indkørslen.

Begge har eget menupunkt, mobilvisning og en kameraovergang til stationen i husets eksisterende 3D-model. Standardvisningen er et fotorealistisk nærbillede, genereret ud fra brugerens produktreference. Nærbillederne er mærket Visualisering. 3D og Kort kan vælges separat. Modellerne er proceduralt tegnede præsentationsmodeller; de er ikke producenternes CAD-filer. De viser stationernes placering, også når robotten arbejder. Der simuleres ikke en live position.

## Hvad siderne kan

Start, pause, fortsæt, hjem, stop og batteri vises efter robottens faktiske HA-egenskaber. Ukendte værdier står som en tankestreg. Manglende forbindelse låser betjeningen, og tidligere hentede batteridata markeres som sidst kendte.

**Roborock:** valg af kortlagte rum, lokalisering, sugestyrke, rengøringstype, moppeintensitet/-rute, gennemgange, kort/etage, tømning, moppevask, tørring, tømningsstyrke, lydstyrke, børnesikring, forstyr ikke, statuslys og opladning uden for spidsbelastning. Areal, varighed, fejl og vedligeholdelsessensorer kan tilknyttes.

**Mammotion:** valg af klippezoner og kørsel af gemte opgaver fra den tilknyttede Mammotion-enhed. Klippemønster, rute, hastighed, vinkel, sporafstand, kantklipning, regnindstillinger, ladegrænse og lydstyrke kan tilknyttes. Klippehøjde vises kun, hvis den konkrete model tilbyder en tilgængelig HA-number-entitet. En mekanisk højdejustering kan ikke fjernstyres. Areal, varighed, fejl, regn, knivtid og signal kan vises.

Listen er dashboardets understøttede koblinger, **ikke et løfte om at Qrevo 5AE og Yuka Mini 2 tilbyder alle funktionerne**. Ukoblede og utilgængelige indstillinger vises ikke som aktive funktioner. Valg og talgrænser hentes fra HA frem for at være gættet i appen.

Fanen **Kort** viser et kortbillede fra en tilknyttet HA-image- eller camera-entitet. Kortet hentes først, når fanen åbnes, og opdateres ved næste HA-opfriskning, når HA rapporterer et nyt kortbillede. Det kan også opdateres med knappen. Det er ikke en editor til at tegne rum eller sikkerhedsgrænser.

## Når Green er klar

1. Installer Green og opdater Home Assistant. Installer Engstien-appen fra dette repositories app-katalog som beskrevet i [Green-vejledningen](../engstien/DOCS.md). Åbn Engstien gennem Home Assistant; den lokale HA-forbindelse og login håndteres af Green.
2. Gå i **Home Assistant → Indstillinger → Enheder og tjenester → Tilføj integration → Roborock**. Brug Roborock-kontoens e-mail og den kode, integrationen beder om. Producentlogin og adgangskoder skal ikke indtastes i Engstien.
3. Gennemfør kortlægning i Roborock-appen. Opret HA-områder som Stue og Alrum, og brug Roborock-integrationens områdeopsætning til at knytte kortsegmenterne til dem. Engstien viser kun områder, der er knyttet til den valgte robots kort. Den officielle integration understøtter ikke en vilkårlig rengøringsrækkefølge af rum.
4. Åbn **Robotstøvsuger → forbindelsesikonet** i Engstien på en computer. Kobl hovedenheden til `vacuum.…` og de ønskede hjælpesensorer, valg og stationskontakter til de tilbudte felter. Gemning sender ingen fysisk kommando. Prøv derefter start, pause og hjem i siden.
5. Mammotion opsættes først, når plæneklipperen findes. Gennemfør først producentens installation, kort og sikkerhedsgrænser. Vælg derefter HA-integrationen på baggrund af forbeholdene nedenfor. Tilknyt dens `lawn_mower.…` i **Robotplæneklipper → forbindelsesikonet**. Gemte opgaver og zoner findes automatisk blandt entiteter fra samme HA-enhed og samme Mammotion-integration. Øvrige indstillinger tilknyttes i felterne.
6. Kontroller de virkelige enheders respons, status, batteri, kort og rapporterede indstillinger. Gentag med en afbrudt HA-forbindelse: ingen fysiske kommandoer må kunne sendes. Telefonens daglige betjening bruger knapper, valg og skydere; koblinger sættes op på computeren.

Der kræves ikke et betalt Home Assistant Cloud-abonnement til lokal adgang. Producenternes eventuelle abonnementer og vilkår er særskilte forhold.

## Integrationernes grænser

### Roborock

Den [officielle HA-integration](https://www.home-assistant.io/integrations/roborock/) dokumenterer støtte til Qrevo-familien. De præcise entiteter for Qrevo 5AE afhænger af modellen, firmwaren og HA-versionen. Kort og dele af opsætningen bruger cloud, så integrationen er ikke en garanti for fuld offline drift. Første kortlægning, nogle specialfunktioner og producentopdateringer kan fortsat kræve Roborock-appen.

### Mammotion og “community”

En community-integration er skrevet og vedligeholdt af uafhængige udviklere, ikke af Mammotion. Den fundne løsning er [Mammotion-HA](https://github.com/mikey0000/Mammotion-HA), installeret gennem HACS. Dens bibliotek [PyMammotion](https://github.com/mikey0000/PyMammotion) genkender udtrykkeligt `YUKA_MINI2`. Det bekræfter modellens genkendelse, men garanterer ikke alle funktioner på hver variant og firmware.

**PyMammotions egen README advarer om risiko for permanent kontospærring ved uofficiel API-adgang.** Det er projektets oplysning. Denne ændring installerer ikke integrationen og forbinder ikke en Mammotion-konto. Den faktiske forbindelse vælges sammen med brugeren, når hardware sættes op. Projektets anbefaling om en ekstra delt konto til Wi-Fi kan mindske samtidige loginproblemer; den ophæver ikke den nævnte risiko.

Dashboardet kan ikke love fuld funktionslighed med Mammotion-appen. Kortredigering, grænser, kalibrering, opdateringer og funktioner uden et HA-interface bliver fortsat i producentappen. Engstien styrer alene det, HA faktisk tilbyder og som er koblet til enheden.

## Teknisk afgrænsning

Kommandoer bruger en fast liste af HA-services og gemte, typekontrollerede enhedskoblinger. Der er ingen fri producentkommando eller vilkårlig service/URL i robotvisningen. Serveren kontrollerer forbindelse, katalogrevision, funktioner, enum-valg og talgrænser før afsendelse. Mammotion-zoner og opgaver skal tilhøre den valgte enhed.

Kortbilleder går gennem den autentificerede dashboardserver, også under Green-ingress. HA-nøgler og korttokens sendes ikke til browseren. Billedproxyen accepterer kun den gemte kortentitet, PNG/JPEG/WebP og højst 8 MiB. Dashboard, andre enhedskoblinger og de separate mobil-/iPad-opstillinger bevares ved opdatering.
