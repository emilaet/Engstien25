# Forslag: alle forsidens widgets åbner detaljer

Status: **Udkast til godkendelse. Modalerne er ikke implementeret i appen.** Kameraforbedringerne er en selvstændig, bestilt ændring.

Der er 12 widgettyper: ni i standardlayoutet og tre, der kan tilvælges. Et skjult kort skal fortsat være skjult, indtil brugeren tilvælger det i Rediger dashboard.

## Fælles betjening

- Tryk på kortets overskrift eller frie flade for at åbne dets detaljer. Overskriften indeholder en rigtig knap, der også kan bruges med tastatur. Kortet må ikke blive en stor knap omkring andre knapper.
- Afkrydsninger, sliders, afspilning, menuer og direkte genveje bliver på kortet. De åbner ikke samtidig modalen. Et træk i 3D-modellen roterer huset; det åbner ikke en modal.
- I dashboardets redigeringstilstand vælges, flyttes og tilpasses kortet. Ingen detaljer eller enhedskommandoer åbnes ved disse tryk.
- Hver modal har titel, kilde/tilstand, et synligt kryds og fanerne **Overblik**, **Visning** og **Forbindelse**. Overblik åbnes først. Faner uden relevant indhold udelades. Musik er en undtagelse: her åbnes den officielle indlejrede afspiller direkte.
- Overblik samler daglig betjening. Visning styrer, hvad det lille kort viser, med **Gem visning** og **Annuller**. En knap til Rediger dashboard fører til den eksisterende størrelses- og placeringsredigering.
- Forbindelse viser konto/datastatus og sidst opdateret. Teknisk opsætning og kobling til Home Assistant ligger fortsat under Indstillinger. Musikopsætning foretages under Indstillinger; den udvidede musikmodal viser kun den officielle indlejrede afspiller.
- Daglige handlinger, fx pause af musik, sker ved tryk og viser resultat eller fejl. De venter ikke på Gem visning. Sletning og rydning af listepunkter skal kunne fortrydes.
- Desktop/tablet: centreret modal, normalt op til 960 px bred, med egen scroll. Telefon: næsten fuld skærm, fast titel/luk og god plads over bundens sikkerhedsområde. Ingen modalstak.
- Escape/luk gendanner fokus til udløseren. Faner og felter kan bruges med tastatur. Ugemte visningsvalg beskyttes ved lukning.
- **Eksempel**, **Sidst kendte** og **Ikke tilsluttet** forbliver tydelige. En funktion vises kun som aktiv, når den tilsluttede tjeneste/enhed understøtter den.

## Indhold pr. widget

| Widget | Overblik og daglige handlinger | Visningsvalg til det lille kort |
| --- | --- | --- |
| Husoversigt | Stor 3D-/plan-/udevisning, rumvalg og en genvej til rummets styring; hurtig retur til standardudsnit. | Startvisning, startudsnit tæt/oversigt, vis rumstatus og udendørs status. |
| Familiens uge | Dag/uge, kommende aftaler, søgning, filter på kalender og detaljer for en aftale. Åbn/rediger aftaler i Google Kalender med den eksisterende læseadgang i appen. | Valgte kalendere, antal aftaler på kortet, vis heldagsaftaler og sluttidspunkter. |
| Vejret | Time- og flerdøgnsprognose, temperatur/føles som, nedbør, vind/vindstød og solopgang/-nedgang; opdatér manuelt. | Sted, timer/dage som standard, antal perioder og prioritering af vind/regn/føles som. Nye vejrdatafelter kræver udvidelse af adapteren. |
| Hoveddør | Vælg livevisning eller seneste intervalbillede; opdatér billede nu, vis optagetidspunkt, næste opdatering og forbindelsestilstand. | Valgt kamera, live/interval, opdatering hver 1., 5., 10., 30. eller 60. minut eller et eget interval. Kamera er aktuelt en illustration. Beskæring og lyd udgår af forslaget. |
| Tesla / billader | Batteri, mål, effekt, tilslutning og forventet færdigtid; start/pause, opladningsgrænse og ladevindue, når enheden tilbyder dem. | Bil/ladeboks, vis ladeeffekt/færdigtid, batteri som primær værdi. Planlægning med elpriser er en senere mulighed, der kræver elprisdata og understøttet styring. |
| Tømmekalender | Næste tømninger og kalenderoversigt med fraktioner og datoer. | Tre tydeligt forskellige forslag: Enkel (næste tømning), Standard (de næste to) og Detaljeret (flere datoer, fraktioner og påmindelse). Derudover antal tømninger, symboler/tekst, datoformat og påmindelsesfrist. Rigtig Renosyd-forbindelse er endnu ikke oprettet. |
| Huskeliste | Opgavens titel, beskrivelse, ansvarlig, prioritet, deadline og gentagelse; søgning, filter og arkiv/Fortryd. | Standardfilter (åbne/i dag/forsinkede/alle), manuel rækkefølge eller sortering, gruppering efter person/dato/kategori, standardansvarlig, vis deadline/prioritet, håndtering af klarede og antal punkter. Påmindelse i appen kan tilvælges. Flere felter kræver udvidelse af listemodellen. |
| Handleliste | Mængde og enhed, kategori/butik, favoritter/basisvarer, tilføj igen, dublethåndtering, købte varer og Fortryd. | Sortering og kategorirækkefølge, standardenhed/butik, gruppering, vis mængde/kategori, vis/skjul købte, favoritgenvej og antal varer. Apple Noter må først fremstå tilsluttet, når en rigtig bro findes. |
| Musik | Udvid åbner Spotify eller Apple Musics officielle indlejrede afspiller i en stor modal. Udbyderens egne knapper bruges. | Tjeneste, konto og valgt indhold opsættes under Indstillinger → Musik. Musikmodalen indeholder ingen opsætningsfaner. En genvej kan åbne hele tjenesten ved behov. |
| Belysning · kan tilvælges | Rum/lampeliste, tænd/sluk, lysstyrke og scener; farvetemperatur/farve kun på lamper, der tilbyder det. | Medtagne rum, favoritlamper/scener og antal viste rum. |
| Indeklima · kan tilvælges | Målt og ønsket temperatur pr. rum, varmetilstand, justering af måltemperatur; fugt, historik og hjemme/ude-tilstand når data findes. | Medtagne rum, primær temperatur og hvilke ekstraværdier kortet viser. Ingen fiktiv historik ved manglende sensordata. |
| Gardiner · kan tilvælges | Gardiner pr. rum, åbn/stop/luk, position og grupper, når motorerne understøtter det. | Medtagne gardiner/rum, favoritpositioner og vis position/status. Tidsplaner forudsætter, at styringen faktisk er tilsluttet. |

## Første gennemførelse efter godkendelse

1. Fælles modalramme og alle åbne/lukke-/redigeringstilstande. Eksisterende vejr-, kalender-, musik-, kamera- og listevisninger samles i mønsteret.
2. Visningsindstillinger gemmes på den aktuelle skærm uden at ændre layoutets mål eller rækkefølge. Den store husvisning genbruger modellen frem for at starte en ekstra 3D-motor.
3. Enhedskommandoer genbruger Home Assistant-koblingen. Enheder uden skrivbar adgang tilbyder status og en forklaring på, hvad der mangler.
4. Nye listefelter og ekstra vejrdata tilføjes. Tidsplaner, reel Renosyd-kilde, historik og eventuelle påmindelser uden for appen tages særskilt, når datakilde, enhed og platform understøtter dem.

Google Kalender beholder læseadgang. Tilkobling af kamera, Apple Noter, Renosyd og husets enheder kræver deres respektive forbindelser.

## Apple Noter på sigt

Huskeliste og handleliste skal kunne knyttes til hver sin konkrete note. Under Indstillinger foreslås notenavn/link, den valgte bro, synkretning, sidste synkronisering og en tydelig konfliktstatus. Listemodalen viser kilde og åbner den tilknyttede note, når et gyldigt link findes.

Apple Noter tilbyder ikke en almindelig web-API til alle disse handlinger. En bro, fx via Genveje eller en Mac, skal først verificeres med den konkrete note og dens checklister. Indlæsning, afkrydsning og tilbageskrivning aktiveres kun i det omfang, broen faktisk understøtter dem. Indtil da bruges de eksisterende lokale/delte lister med tydelig status.

## Kamera og musik: begrænsninger og ydelse

Intervalbilleder skal vise tidspunktet for det sidst modtagne billede og en fejl ved manglende forbindelse. Opdatering sættes på pause, når skærmen/visningen er skjult, og genoptages efter behov. Live kræver en rigtig kameraforbindelse; den nuværende illustration er ikke en videostream.

En officiel musikindlejring viser det UI og de afspilningsmuligheder, udbyderen tilbyder. Den er ikke hele tjenestens app med alle biblioteks- og kontofunktioner. Login, afspilningsbegrænsninger og samspil med den lille widgets knapper skal verificeres med den valgte tjeneste. Der skal højst være én aktiv lydkilde.
