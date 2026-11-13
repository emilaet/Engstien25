# Fælles designregler for widgets

Alle almindelige kort bruger tokens i `src/widget-controls.css`:

- Indvendig afstand: 20 px på computer, 18 px på telefon. Eksplicit gemte bredder/højder og venstremenu bevares. Standardens store lister får mere højde; lave og kompakte lister bruger et resumé med adgang til hele listen.
- Overskrifter: Jakarta, 17 px, vægt 500. Små kort tilpasser skriftstørrelsen via eksisterende container queries.
- Titelikon: 28 px rund baggrund, 17 px stregikon og 10 px afstand til titlen; 24 px i lave kort. Handle- og huskeliste bruger et checkmark. Tesla bruger ladeikonet.
- Trepriksmenu: 16 px synligt ikon, mindst 44 × 44 px trykflade. Overskrifter reserverer en separat plads til menuen. Hover og tastaturfokus bevarer en tydelig markering.
- Kompakt liste: 68 px, ikon og titel centreret lodret, ingen separat “Se alle”-knap. Titlen åbner hele listen. Den almindelige liste beholder sin knap og sine handlinger.
- Tesla: overskrift, ladestatus, batterital, fremskridt, ladeinformation og datakilde har egne pladser. Status flytter til en ny linje ved smal bredde. Status lægges ikke længere oven i indstillinger via et pseudo-element.
- Store vejrkort med lav højde bruger fortsat to kolonner. Der reserveres kun menuplads, hvor menuen faktisk ligger.

Ved ændringer i fælles kortgeometri køres widget-responsiveness og widget-polish. De kontrollerer gemte bredder/højder, telefon/tablet, overlap, vandret rulning og kompakte lister. En ny regel bør rette den fælles geometri frem for at skjule en handling eller reducere dens trykflade.

# Totalpris for elektricitet

Standardprofilen er DK1, **Dinel (foreløbigt oplyst af ejeren)** og **OK El · Højt forbrug**, med 0 øre/kWh i variabelt elaftaletillæg. Tillægget er et redigerbart opsætningsvalg, ikke en aflæsning af brugerens kontrakt. Et eventuelt individuelt handels-/balancetillæg indtastes i øre/kWh inkl. moms under Indstillinger → Widgets → Elpriser. Faste abonnementer indgår ikke i en marginal kWh-pris.

Beregningsrækkefølgen er:

`(spot ekskl. moms + nettarif + Energinet system + Energinet transmission + elafgift + elaftaletillæg ekskl. moms) × 1,25`

Hvis moms slås fra, vises summen før moms tydeligt som ekskl. moms. Brugerens tillæg omregnes fra øre inkl. moms, så moms aldrig tælles to gange.

Spotpriser hentes fra [Elprisen lige nu](https://www.elprisenligenu.dk/elpris-api). Nettariffer, systemtariffer og elafgift hentes fra [Energi Data Service / DatahubPricelist](https://www.energidataservice.dk/tso-electricity/DatahubPricelist). Der kræves ingen konto eller nøgle. Kort, søjler, farver, valg af time og dagens gennemsnit bruger samme totalberegning. Den udvidede visning viser alle prisdele og moms; tryk på en time skifter prisopdelingen til den time.

DataHub-opslaget bruger følgende C-forbrugstariffer (D03):

| Netselskab | GLN | ChargeTypeCode |
| --- | --- | --- |
| Dinel | 5790000610099 | TCL>100_02 |
| Konstant | 5790000704842 | C_FBTNTR_B + C_FBTNTR_R |
| N1 | 5790001089030 | CD |
| Radius | 5790000705689 | DT_C_01 |
| Cerius | 5790000705184 | 30TR_C_ET + 30RE_C_ET |

Identifikatorer og DataHub-format er krydskontrolleret med den offentlige [Energi Data Service-integration](https://github.com/MTrab/energidataservice/tree/master/custom_components/energidataservice/tariffs/energidataservice). Ingen numeriske net-/afgiftssatser er hardkodet. Satser vælges efter gyldighedsdato og lokal time i Europe/Copenhagen; vinter/sommer og tidsafhængige tariffer kommer dermed fra udgiveren. Overlappende revisioner af samme afgift lægges aldrig sammen. Data med manglende eller modstridende satser må ikke blive til en totalpris.

Tariffer caches separat pr. netselskab i højst to døgn, genhentes normalt efter 12 timer og vises som sidst kendte ved genbrug eller fejl. Hver times gyldighed kontrolleres også på cachede satser. En udløbet elafgift genbruges ikke i et nyt år. Netværksfejl begrænser genforsøg; vejr og de øvrige widgets venter ikke på priskilderne. Manglende tariffer giver “Totalprisen afventer nettarif og afgifter”, aldrig en skjult tilbagevenden til spotpris.

Det administrerede testmiljø blokerer både OKs hjemmeside og tarif-API'et. Direkte adgang til de aktuelle satser og browser-CORS er derfor ikke verificeret her. Modul-/browsertests bruger syntetiske DataHub-svar; tallene er **ikke** Dinels officielle satser. Kontrolscenariet med 0,76 kr. spot inkl. moms → 1,15 kr. total dokumenterer regnerækkefølgen, ikke et bekræftet livepris-match.

## Tilpasning til små kort og tarifkilder

`widget-refinement.css` samler de sidste regler for rækker, små kort og SVG-menuer. Menupunkternes prikker tegnes geometrisk omkring midten, med 16 px SVG i widgetten og 20 px i Hjem-menuen; begge beholder mindst 44 px trykflade. Listenavne og noter har normal bogstavafstand, 1,5 i linjehøjde og 12 px luft over/under punkter. Ingen tekstmaskering bruges i listerne.

Lave lister viser titel og antal tilbage; tryk åbner hele listen. Korte kalenderkort viser næste aftale og åbnes fra overskriften. Små vejrkort viser aktuelle forhold; prognosen findes via udvid. Små elpriskort viser totalprisen og åbner søjlerne i den fulde visning. Korte kameraer bruger billedet som baggrund med læsbare kontroller ovenpå. Store kort viser flere detaljer med rulning ved behov. Standardens store desktoplister er 308 px høje; individuelle pixelmål bevares.

Affaldspiktogrammerne indgår også i overblikket øverst. Genvejen åbner en dialog med alle kommende afhentninger, uanset om den separate widget er skjult. Dialogen kan fjerne den separate widget fra Hjem uden at fjerne genvejen. Renosyd-datoerne er fortsat udtrykkeligt eksempler.

Tarifdata læses i det format, som den offentlige datakilde leverer, herunder numeriske decimalstrenge. Udløbne og annullerede versioner fjernes før validering, så en historisk række uden pris ikke slår aktuelle tariffer ud. Ved fejl oplyses, om spot- eller tarifkilden mangler. Der opfindes ingen manglende satser.

Ved produktion bygger `scripts/prepare-electricity-tariffs.mjs` en valideret Dinel-kopi fra den offentlige kilde. `build-preview.mjs` validerer kopien igen og indlejrer den **inde i den krypterede app**. Browseren forsøger stadig at opdatere direkte, men kan falde tilbage til denne bekræftede kopi ved CORS, timeout eller rate limits. Kopien gælder kun for sit netselskab, sin datogyldighed og højst syv dage efter kontrollen. Både skat og net skal være gyldige, ellers vises manglende totalpris. Den natlige, beståede udgivelse fornyer kopien. Der publiceres ingen separat, ukrypteret fil med appdata.

Den krypterede browsertest kontrollerer konkret, at totalprisen vises, selv om tarif-API'et returnerer 503. Den samlede størrelseskontrol dækker 11 bredder × 6 højder × 3 skærmstørrelser for alle 13 widgets; separate kontroller sikrer læsbare hovedoplysninger i de laveste mobilkort.

Tarifudgiveren sender forespørgsler sekventielt og respekterer HTTP 429 / Retry-After. En allerede valideret kopi deles mellem GitHub-kørsler, så en nylig udgivelse ikke giver nye opslag. Browserens cooldown gemmes også lokalt og gælder ved manuelle genforsøg og genindlæsning. En frisk tarifkopi genbruges i 12 timer, også når den kom med den krypterede app.

En utilgængelig ekstern kilde må ikke blokere UI-rettelser. Hvis ingen gyldig kopi findes, offentliggøres der ingen eksempel- eller gættede tariffer; appen viser manglende totalpris med datakildens fejl. GitHub markerer dette med en tydelig kildeadvarsel. Den natlige kontrol forsøger at opdatere igen. Fungerende tests må fortsat aldrig springes over eller maskeres.
