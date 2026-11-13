# Widgetmenuer, samlet opsætning og elpriser

Alle 13 widgets har en diskret trepriksmenu. Menuen bruger små prikker og en større trykflade, så den er let at ramme på telefonen. Den tilbyder visningsindstillinger, åbning af widgetten og adgang til den samlede opsætning. Lokale lister har også handlingen Fjern købte/klarede.

Under **Indstillinger → Widgets** findes visningsvalg og datakilde for hver widget. Forbindelser til Google, musik og Home Assistant bruger fortsat den eksisterende forbindelsesopsætning; der gemmes ingen nye adgangskoder i widgetindstillingerne.

| Widget | Visningsvalg |
| --- | --- |
| Husoversigt | Indetemperatur og antal rum med lys |
| Vejret | Dage/timer og vind |
| Kalender | Antal aftaler og tidspunkt/person |
| Hoveddør | Ønsket billede/live/interval samt interval. Kameraet er endnu ikke tilsluttet; indstillingerne aktiverer ingen rigtig videostrøm. |
| Billader | Ladeeffekt og resterende tid |
| Belysning | Antal rum eller lysgrupper |
| Indeklima | Gennemsnit, laveste eller højeste rumtemperatur |
| Gardiner | Procent eller åben/lukket/delvist åben |
| Huskeliste og handleliste | Liste eller kun titel, afkrydsede punkter, tilføjelse i modal, ønsket datakilde og Apple-notens navn |
| Tømmekalender | Enkel/detaljeret og affaldssymboler |
| Musik | Albumcover og afspilningslinje |
| Elpriser | 4/5/6 synlige timer, moms, gennemsnit og DK1/DK2 |

## Kompakte lister

**Kun titel · åbn ved tryk** reducerer kortet til 68 px og frigør plads i gridet. Den fulde liste åbnes ved tryk på titlen. En lokal liste kan få nye punkter i modalen, også på iPhone. Feltet får først fokus, når brugeren trykker i det; de øvrige mobilsider beholder betjening uden skrivefelter. Visningstilstanden og andre widgets' indstillinger gemmes uafhængigt.

Importerede Notes-lister er stadig skrivebeskyttede. Valg af Apple Noter og notens navn er en forberedelse til den aftalte Home Assistant/Genveje-opsætning. Det opretter ikke i sig selv en Apple-kontoforbindelse. Begge lister kan fortsat indlæses fra en Notes-fil; se [vejledningen](apple-notes.md).

## Elpriser

Priser hentes fra [Elprisen lige nus offentlige API](https://www.elprisenligenu.dk/elpris-api), uden konto eller nøgle. Hørning bruger DK1 som standard. Diagrammet viser dagens timer og morgendagens timer, hvis de er offentliggjort. Det starter ved den aktuelle time, og resten kan nås ved vandret rulning.

Prisen er en **spotpris**, med eller uden 25 % moms efter valget. Nettarif, afgifter og elaftaletillæg indgår ikke. Kvartérpriser vægtes sammen til komplette timegennemsnit. Negative priser bevares, og tidsberegningen håndterer døgn på 23/25 timer i København.

Grøn, gul og rød sammenligner lave, mellem og høje priser i forhold til resten af dagen. Beløbet står også ved hver søjle. Farverne er ikke en grænse for, om den samlede elregning er billig eller dyr.

Data gemmes pr. prisområde og dato. Normalt hentes højst én ny prisoversigt pr. 30 minutter på hver enhed. En manglende morgendagsoversigt er ikke en fejl i dagens priser. Ved fejl begrænses automatiske genforsøg til højst én gang i minuttet; en blokeret elpristjeneste holder ikke vejr og de øvrige widgets tilbage. Ved netværksfejl markeres dagens cache som sidst kendte data; gamle døgn bliver aldrig vist som dagens aktuelle pris. Uden gyldige data vises manglende forbindelse og Prøv igen.

Det administrerede udviklingsmiljø blokerer API-domænet. Beregninger og UI er kontrolleret med faste, offentligt formaterede testsvar; et rigtigt livekald er ikke verificeret her.

## Kompatibilitet og kontrol

Eksisterende layouts med 7, 8, 11 eller 12 widgets bevares ved migrering. Elpriser tilføjes én gang; gamle widgetmål og gemte placeringer nulstilles ikke. Kompakt listevisning beregnes særskilt, så den almindelige listehøjde kan gendannes ved skift tilbage.

Kontrol af denne ændring bruger de hurtige modul-/servertests og de berørte browserforløb samt den krypterede udgave. Den store samlede browserpakke er ikke nødvendig ved hver ændring.
