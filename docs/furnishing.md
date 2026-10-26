# Første møbeludkast og løbende rettelser

Modellen indeholder separate, parametriske 3D-objekter. De følger jeres husplan, ikke referencebilledernes andre planløsninger. Alle vægge og åbninger kommer fortsat fra `architecture.js`. Møblerne er stiliserede første udkast, ikke producenternes originale 3D-modeller eller verificerede bestillingsmål.

## Kilder

- Sofa/lænestol/sofagruppe: ejerfoto sendt 26. oktober 2026 går forud for det tidligere forslag om L-sofa. Der er nu en lige, lav beige sofa med brede hynder og armlæn, en separat bred stol, et lyst tæppe og et afrundet bord med bred sokkel. Tidligere ILVA/Bolia-produktlinks bevares som referencer.
- Spisegruppe: ejerfoto samme dag viser en lys blank plade, lamelsokler og seks træstole med buede rygge. Bordpladens præcise materiale og alle mål afventer bekræftelse; den vises som en lys beige overflade.
- Seng: Nordic Dream Nova 180 × 200, bouclé latte, fra ejerens link. 180 × 200 er madrasmålet. De foreløbige ydermål 194 × 218 cm og gavlhøjden 110 cm er modelskøn.
- Køkken: `Samlede tegninger 150926.pdf`, HTH, især siderne 1, 2, 5 og 6. Nordic Essence Natur Eg, bagbord ca. 3252 mm, ø ca. 2042 × 1200 mm og ovn/køl i østnichen. Den skabsintegrerede depotdør er fortsat en reel åbning. Detaljer som vask, greb og apparatfronter er stiliserede.
- Bad, bryggers og entré: HTH Nordic Spirit Hvid Eg, plantegning og udstillingshusbilleder. Sanitets- og skabsdetaljer er foreløbige.
- Børneværelser: Lucas og Sophia er ca. 4 og knap 3 år. Juniorsenge, legetæpper og lav opbevaring er forslag. Der er endnu ikke fastlagt konkrete produktmodeller eller hvilken af de to der har værelse 1/2.
- Kontor, TV-møbel, natborde og dekorationer: foreløbige forslag i lys eg, beige, dæmpet grøn/ler og stål.

## Redigering

Åbn **Rum → Indretning**. Vælg fra listen eller klik direkte på et møbel i modellen. **Vis tættere på** flyver kameraet frem til det valgte møbel, og almindelig rotation/zoom kan stadig bruges. Rummets smart-home-enheder betjenes fortsat fra den almindelige Rum-visning.

Formularen ændrer navn, mål i cm, position relativt til rummets bageste venstre hjørne, rotation, primær farve og materialetype. Gem ændringer med **Gem møbel**. Ikke alle sekundære materialer følger den primære farve: fx bevares ståldetaljer, bordplader og puder som separate overflader. Målene på spisegruppen gælder bordet; stolene har deres egen plads omkring det. Faste skabe og installationer har låste mål og positioner i formularen.

Møbler må ikke placeres med deres footprint uden for det tilknyttede rums gulvpolygon. Standardudkastet kontrolleres også for fri passage gennem døråbningernes midter. Dette er ikke en komplet møbelkollisions-/tilgængelighedsberegning. Kontrollér dørslag og ganglinjer visuelt, især efter flytning og ændring af mål. Et foreløbigt modelmål skal ikke bruges til indkøb eller installation.

**Gendan dette møbel** vender tilbage til den aktuelle kodeversions forslag. Referencebilledet bevares. Møbler og fast inventar kan skjules hver for sig eller samlet via Møbler-knappen. Med møbler vist i snit åbnes de massive have- og østfacadevægge visuelt; fulde vægge eller den tomme model kan altid vælges igen.

## Referencer og næste modelændring

Under **Reference og ændringsønsker** kan der gemmes et produktlink, en tekst og et JPG/PNG/WebP-referencebillede på højst 3 MB pr. møbel. Et link eller billede ændrer ikke automatisk objektets geometri. Skriv fx »gavlen på sove-bed skal være højere og mere afrundet« og vedhæft et produktfoto. Næste rettelse kan udføres i møblets katalogpost eller dets 3D-generator.

**Hent indretningsfil** eksporterer en JSON-fil med alle møbler, mål, materialer, links, noter og lokale referencebilleder. Vedhæft den i chatten, når der ønskes en præcis rettelse. **Indlæs indretningsfil** gendanner et valideret snapshot. JSON-filen må højst være 15 MB; flere store fotos skal reduceres før samlet eksport. Behold gerne filen som backup.

Browserændringer og billeder gemmes kun på den aktuelle enhed. De publiceres ikke i GitHub og sendes ikke til HA eller en AI-tjeneste. Møbelændringer ligger som journaloperationer under `engstien-furniture-v1`; billeder ligger i IndexedDB. Hvis lagring fejler, fortsætter arbejdet i hukommelsen med besked, og eksport er stadig mulig. Denne version deler ikke møbelændringer mellem familiens enheder.

Kun faktisk ændrede felter gemmes som overrides. Nye katalogrevisioner når derfor også en browser, som allerede har gemte møbler, mens ejerens bevidste ændringer bevares. Et gendannet møbel følger igen kataloget. Hvert objekt har et stabilt ID, fx `sove-bed`, `stue-sofa` og `alrum-dining`.

## Kode og kontrol

- `furnishing-data.js`: katalog, mål, kilder, validering og journal.
- `furniture.js`: afrundede puder, gavle, bordplader, stole, skabslåger, sanitetsinventar og materialer.
- `furniture-editor.js`: valg, formular, import og eksport.
- `furniture-references.js`: lokal billedlagring.

Enhedstests kontrollerer rumgrænser, frie dørmidter, isoleret lagring, ugyldige input og opdatering af kataloget uden tab af ejerrettelser. Browserkontroller tester persistence, referencebilleder/import/eksport, objektvalg, mobil/tablet og fortsat rumstyring. Den krypterede Pages-version testes også før udgivelse.
