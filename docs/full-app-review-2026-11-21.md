# Gennemgang af hele Engstien 25 · 21. november 2026

Gennemgangen dækker Hjem, alle widgets og deres størrelser, mobil/iPad, rumstyring, 3D/indretning, billader, robotter, konto, synkronisering, indstillinger og integrationer. Fem separate faglige gennemgange har bidraget: UX/brugerforløb, visuelt design/tilgængelighed, performance/3D, kode-/integrationsrobusthed og testdækning. Kilderne er sammenholdt med 20 aktuelle skærmbilleder, browserforløb og reproducerbare Node-målinger.

## Konkrete rettelser

| Område | Problem og rettelse |
| --- | --- |
| Kontosynk | Et forsinket valg af fælles profil eller konfliktopslag kunne overskrive tilstanden efter logout/kontoskift. Svar kontrolleres nu mod den aktuelle kontogeneration, før profil, revisionsnummer eller konflikt anvendes. Fem regressioner dækker de overlappende forløb. |
| Spotify | Et sent token-refresh kunne genetablere sessionen efter logout. SDK-callbacks og forsinkede afspilningssvar afgrænses til den aktuelle session; logout fjerner den lokale session inden afventning af afspilleren. |
| Headerdato | 30-sekunders opdateringen fjernede datoens fulde/korte HTML og lod det tilgængelige navn stå på den gamle dato. Én fælles opdatering bevarer begge varianter og opdaterer aria-label, også over københavnsk midnat. |
| Lister | “Tillad tilføjelse” låste også afkrydsninger i den udvidede liste. Eksisterende lokale punkter kan nu færdigmarkeres uafhængigt af tilføjelsesvalget. Importerede Notes-lister forbliver skrivebeskyttede. |
| Mobilkonto | Kontoindgangen findes nu under Forbindelser på telefonen ligesom på computeren. Avancerede adgangsnøgler er stadig en computeropgave. |
| Mobilkalender | Førstegangslogin kunne ende uden kalenderliste eller Gem-knap. Telefonen bruger nu det samme kalendervalg som desktop; client-ID-konfigurationen vises kun på computeren. |
| Kontrast | Widgetdialogens Gem- og Tilføj-knapper bruger palettens korrekte tekstfarve. Advarsler bruger et semantisk token, som tilpasses mørke flader og bevarer mørkerød tekst på gule huskelister. De små menuprikker bevarer størrelse og 44 px trykflade med forbedret kontrast. |
| Mobilnavigation | De korte navne Hjem/Rum/Billader beholder 12 px tekst; de lange robotnavne bruger fortsat deres tilpassede 10 px og to linjer. |
| Små musikkort | Den sekundære konto-/statuslinje kunne rage ud ved 196 px. Kompaktvisningen prioriterer titel og transportknapper; yderligere oplysninger findes fra overskriften og den fulde afspiller. |

## Hastighed og hukommelse

- Græs- og bladmaterialerne komprimeres tabsfrit fra samlet **7.293.949 til 4.901.034 bytes**, en reduktion på **32,81 %**. Begge har samme 1254 × 1254 pixels; SHA-256 af den dekodede RGBA er identisk før/efter. Kilde-PNG'er og deres provenance bevares. Ingen 3D-detaljer eller billedpixels er reduceret.
- De 162.312 græsinstanser bygges først, når plæneklipperen eller hele haven åbnes. Rum/Hjem/Billader/Støvsuger undgår dermed den indledende allokering af **12,34 MB instansbuffere** og cirka **0,46–0,75 sekunders Node-CPU-arbejde**. Første åbning af haven foretager arbejdet én gang; senere besøg genbruger det.
- Positions-, matrix-, farve- og geometriske hashes er identiske før/efter. Kvalitetsvalg, græskanter og den interaktive scene bevares.
- Plantematerialet beregner ikke længere et proceduralt 512²-billede, når det indlæste albedobillede skal bruges. Det fjerner cirka **46–72 ms** dobbeltarbejde pr. plante i de indledende Node-prøver.

Den eksisterende hurtige mobilbetjening uden 3D, servercache for HA, genbrug af kort/geometri og rendering i hvile er bevaret. Der indføres ingen ny betalt tjeneste.

Målingerne bruger lokal Chromium/SwiftShader og er ikke en fysisk iPad-benchmark. Baseline i et produktionsbuild: Rum FCP ca. 1,42 s, første native 3D ca. 8,24 s; mobil Rum FCP ca. 0,30 s uden model; Indstillinger FCP ca. 0,41 s. Netværket er lokalt, eksterne vejrudsigts-/prisdata er kontrollerede testsvar. Enkelte browsermålinger varierer; byte- og geometrihashes er de præcise, reproducerbare gevinster.

## Prioriterede forbedringsforslag

| Prioritet | Forslag | Hvorfor / afgrænsning |
| --- | --- | --- |
| 1 | Et eksplicit vægskærmsforvalg til iPad uden rulning | Standardvisningen på 1194 × 834 kræver omkring 230 px ekstra rulning i den gennemgåede tilstand. Et forvalg kan vise de vigtigste data på én skærm. Brugerens gemte layout bør bevares, indtil et nyt udkast gemmes. |
| 1 | Robotternes vigtigste handlinger før den store 3D-visning på mobil | 490 px hero-kort skubber Start/Til station ned under første skærm. Bevar det store interaktive nærbillede og tilbyd en kompakt status-/handlingsrække ovenover. |
| 1 | Tydeligere betydning af Start efter valg af rum eller klippezone | Den primære Start-knap starter generelt arbejde, mens en separat knap bruger valgte områder. Lad den primære tekst/handling følge valget, eller kald den tydeligt “Start overalt”. Afprøves med den konkrete HA-integration før fysisk brug. |
| 1 | Konsekvent “sidst kendt/afventer data” for alle koblede lys | Ekstra lys håndterer ukendte værdier, men ankrede modellamper kan bevare gammel on/off og få en for sikker status i rum-/husoversigten. Følg kilde/friskhed hele vejen fra HA-aflæsning til optælling og captions. |
| 1 | Et konkret Green- og Notes-forløb | Saml installation, backup/flytning, kontologin og den valgte iPhone-genvej. Forklar forskellen mellem lokale lister, valgt note og faktisk modtaget Notes-indhold. Et generisk “Åbn Noter” beviser ikke, at den viste liste er koblet til en bestemt note. |
| 2 | Kalenderen bør vælge reelt kommende aftaler | Kompaktkortet kan vise dagens første aftale efter dens sluttid. Bevar start/slut som tidsstempler, og brug et fælles udvalg af igangværende/kommende aftaler; fuld kalender kan stadig vise dagens historik. |
| 2 | Et valgfrit før-Green-dashboard | Fremhæv live vejr/elpriser og egne lister; saml planlagte forbindelser og reducer store eksempelvisninger. Bevar den nuværende opstilling, medmindre brugeren vælger forvalget. |
| 2 | Mere ro i kildeangivelser og dagsblik | Kameraeksemplet har flere samtidige Eksempel/Illustration-mærker. Ét samlet mærke er nok. Mange gamle påmindelser bør få en kort optælling og en tydelig genvej til hele listen. |
| 2 | Fysisk iPhone/iPad-afprøvning | Afprøv hjemmeskærmsstart, rotation, safe areas, genoptagelse efter lås, eksternt login, Notes-genvej og svagt netværk. Chromium i relevante størrelser dokumenterer ikke alle Safari-/iOS-særheder. |
| 3 | Gradvis oprydning i CSS og hovedmodul | Saml komponenttilstande og semantiske tokens frem for flere override-lag. Del hovedmodulet efter funktion med små ændringer og regressioner. En stor omskrivning er ikke nødvendig for de konkrete gevinster ovenfor. |
| 3 | Afslut ressourcehåndtering ved mislykket 3D-start | Normal navigation genbruger renderer korrekt. Ved gentagne opstartsfejl bør et egentligt dispose-forløb også rydde observers, listeners og WebGL-ressourcer. |

## Test og evidens

Hele den eksisterende browserpakke køres som baseline, og alle modul-/servertests køres igen. Konkrete fejl og gamle testsetup-forudsætninger følges op med målrettede genkørsler. Nye regressioner dækker kontoskift, Spotify-logout, udskudt græsallokering, mobilkalendervalg, headerdato, knapkontrast og afkrydsning uden tilføjelse.

Testopdateringer bevarer brugerintentionen: fulde lister vælges eksplicit, når in-place-scroll testes; et skjult mobilkort vises gennem editoren før drag; mobilhøjder sammenlignes med den faktiske udgangsstørrelse; automatiske dagsblikændringer testes ikke som en uafhængig, statisk side. Et forældet flertydigt DOM-selectorvalg erstattes af den konkrete synlige handling.

RLS/SQL-, pris-/tarif-/DST-, kontoadskillelses-, HA-capability- og native 3D-kontroller bevares. Tests med Google, Spotify og HA bruger kontrollerede svar. Den konkrete fysiske robot/hub og automatisk Apple Notes-overførsel er endnu ikke prøvet i det færdige hus.

Sessionens rå logs, 20 skærmbilleder, kontrastmålinger, profileringsdata og tabsfri pixelbeviser ligger i `/workspace/artifacts/full-audit-2026-11-21/`. De er dokumentation af den afprøvede app, ikke konceptbilleder.
