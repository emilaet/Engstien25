# Kontrol af vægge, døre og vinduer

Grundlaget er `Floorplan.png` i originalopløsning (2466 × 1392). De mørke, gennemgående væglinjer og dørernes bueslag er aflæst separat fra møbler og skabe. Placeringer gemmes som kildepixel i `src/architecture.js`, så de kan kontrolleres direkte mod tegningen. Skalaen er ca. 76 pixel/meter ud fra de målsatte 2,9 m dybe rum. Rastertegningen giver ikke millimeterpræcision.

Krydskontrol:

- `Facader.png`: små vinduer på bagsiden, fuldhøjt smalt havevindue, det store havepartis fire fag og overlys, almindelige bad/bryggers-vinduer og vinduer i den højre gavl.
- `Facade fra SV.png`: lav side 2,4 m og høj haveside 3,1 m. Vægtoppene følger nu dette fald; tag og loft vises ikke.
- `Visualisering fra haven mod hus .png` og `udstillingshus/stue fra gang.jpg`: det store glasparti og det smalle havevindue går til gulvet. Terrassedøren er et fag i glaspartiet, ikke en separat smal vægåbning.
- `udstillingshus/badeværelse 1 fra soeværelse.jpeg`, `fra kontor mod gang.jpeg` og `bryggers fra entre.jpeg`: understøtter adgang mellem rummene. Udstillingshuset er ikke autoritativt for jeres walk-in eller rumstørrelser.
- HTH-PDF side 1 og 5: depotadgang er en 600 mm skabsintegreret dør i køkkenets østside. Den er vist som en åbning med egetræsfarvet dørblad, mens skabsinventaret er fjernet.

## Adgangsveje

| Forbindelse | Udførelse |
| --- | --- |
| Stue → walk-in | Dør i suitens sydvæg; åbner ind i walk-in |
| Walk-in → soveværelse | Åben passage ved enden af den korte skillevæg; intet opdigtet dørblad |
| Soveværelse → bad 1 | Dør i badets østlige væg; ingen dør direkte fra stuen |
| Soveværelse → stue | Lukket væg, ingen ekstra åbning |
| Køkken → depot | Skabsintegreret dør fra vest |
| Gang → værelse 1 | Dør ved rummets sydøstlige hjørne |
| Gang → værelse 2 | Dør ved rummets sydvestlige hjørne |
| Gang → bad 2 | Dør i badets nordvæg |
| Entré → bryggers | Dør i bryggersets østvæg; ingen dør fra gangen |
| Gang → kontor | Dør i kontorets vestvæg nær nordhjørnet |
| Gang ↔ entré | Åben forbindelse uden tværvæg |
| Terrasse → alrum | Venstre fag i det store haveparti; udadgående dør |
| Ude → entré | Indadgående dør i have-/ankomstfacaden |
| Carport → skur | Dør i skurets østside nær nordhjørnet |

Væggen ved entré/kontor forskydes ved den viste skabsniche. Værelse 1 har en indhak-form omkring depot og højskabszone. Gulvene er polygoner, så disse områder hverken overlapper eller efterlader huller. Den stiplede, valgfrie alkove i stuen er ikke bygget som væg. Køkken/alrum/stue er åbent sammenhængende.

## Vinduer

- Bagside: ét i bad 1, **to** i soveværelse, ét i walk-in, ét bredt i køkken og ét bredt i værelse 1. Der er intet ekstra bagvindue i værelse 2.
- Højre gavl: vinduer i værelse 2 og kontor.
- Venstre gavl: et stuevindue med brystning.
- Havefacade: et smalt, gulvgående stuevindue; et fire-fags gulvgående terrasseparti med overlys; almindelige vinduer i bad 2 og bryggers; entrédør.

Alle åbninger er skåret gennem væggenes faktiske 3D-geometri. Vinduer har separate højder for bund og overkant; der ligger ikke længere massiv væg bag glasfladerne.

## Det, som stadig er omtrentligt

Placeringer og forbindelser er aflæst fra planen, men karmenens præcise lysningsmål og almindelige vinduers brystnings-/overkantshøjder er ikke målsat i det tilgængelige materiale. De er derfor visuelt estimeret; almindelige vinduer står foreløbigt med brystning ca. 0,9 m. Højden 3,1 m på havepartiet er baseret på facadehøjden, ikke et vinduesskema. Døråbningsbredder er målt på rastertegningen og dørblade er vist ca. 70° åbne for læsbarhed; bueslag angiver retning. Depotets korte afgrænsning mod højskabene er delvist skjult af skabssymboler og er markeret `inferred` i data. Carportens væg-/stolpehøjde er foreløbigt 2,2 m.

## Tom model og inspektion · opdateret med møbeludkast

I den tidligere kontrolversion blev alle løse møbler og inventar fjernet. Den aktuelle version har et separat møbeludkast, som kan skjules med Møbler-knappen; der er fortsat ingen biler eller gardinmodeller. Der er kun gulve, vægge, åbninger, døre/vinduesrammer og en enkel terrasse/carport. Smart-home-menuernes testdata er bevaret; gardinsliders flytter ikke en fysisk gardinmodel i denne tomme visning.

**Plan** skifter til ortografisk visning ovenfra. **Vægge** skifter mellem et vandret snit i 1,2 m og fulde vægge. Snitflader har synlige topflader, og både vinduer og døre følger snittet. Den fulde geometri bevares i begge tilstande.

Automatiske kontroller verificerer adgangsgrafen, ubrudte/lukkede vægforløb, at alle åbninger er inden for deres vægge og ikke overlapper, at 3D-raycasts kan passere gennem åbningerne uden at ramme en væg, samt at gulvpolygonerne dækker huset præcis én gang. Visuel kontrol af plantegning og fuld 3D-visning supplerer testene.

## Billader og carportstolper

Efter ejerens rettelse er den midterste stolpe på carportens åbne side fjernet; de to endestolper er bevaret. Der er tilføjet en stiliseret OK-ladeboks efter ejerens fotoreferencer: mørk, afrundet front med en grøn statusring. Den sidder på skurets østvendte ydervæg, til venstre for døren set fra carporten. Placeringen beregnes ud fra den eksisterende `shed-door`-åbning, så den følger med ved senere rettelser af dørens position. Montagehøjde og kabinetmål er foreløbige illustrationstal, ikke installationsmål.

Menuen består nu af Hjem, Rum og Billader. Lys og varme betjenes inde i Rum. Ældre links med `#lights` og `#heat` åbner også Rum. Billader animerer kamera og fokuspunkt frem til boksen over ca. 1,45 sekund og gendanner de fulde skurvægge under nærbilledet. Ved retur til Rum gendannes snit-/væghøjdevalget. Under simuleret opladning pulserer ringen grønt; på pause er den afdæmpet. Med systemindstillingen reduceret bevægelse er kameraskiftet øjeblikkeligt og den grønne ring konstant.

Alle væggrupper bevares i både møbleret og tom model. Snitvisningen klipper vægge og åbninger ensartet ved 1,2 m; fuld væghøjde viser hele facaderne. Ingen facade skjules automatisk for at vise møbler. Automatisk møbelkontrol verificerer afgrænsning til de tilknyttede rum og frie dør-/passagemidter; den er ikke en fuldstændig kollisionskontrol af alle dørslag, skabslåger og ganglinjer. Se [indretningsdokumentationen](furnishing.md).


## Godkendt redesign · 29. oktober 2026

Husets væg-/åbningsdata og møbelplaceringer er bevaret uændret under redesignet. Konceptbilledernes forskudte ladeboks, gårdrum og ekstra walk-in-væg er ikke indført. Carportens oprindelige omrids har fået et synligt, fladt tag, mens endestolper og skurvægge er bevaret. Tag-knappen, planvisning og ladeboksens nærbillede giver mulighed for at se under taget. Taghøjde og detaljering er foreløbige illustrationstal. Se [designimplementeringen](design-implementation.md).
