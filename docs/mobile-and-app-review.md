# Gennemgang af Engstien 25 · 12. november 2026

Denne gennemgang omfatter Hjem og widgets, rumstyring, udemiljø, billader, indretning, indstillinger, datalagring, integrationer og mobilvisning. De konkrete rettelser nedenfor er implementeret. Forslagstabellen er til ejerens gennemgang; den er ikke en bestilling på flere ændringer.

## Rettet i denne omgang

| Område | Resultat |
| --- | --- |
| Rum | Søgefeltet er fjernet. De 14 indendørs rum samt **Ude** vælges direkte. Tilbage til oversigten giver tastaturfokus til det senest valgte rum. |
| Udelys | **Rum → Ude** har separate kontakter/dæmpere til tre væglamper og seks spots i carporten samt fælles tænd/sluk. Gamle udelysindstillinger og enhedskoblinger flyttes fra Entré. |
| Temperatur | Ude tælles ikke med i indetemperaturen. Det forhindrer en ugyldig `NaN`-værdi i overblikket. |
| Rumknapper | Opdatering af 3D-visningens hjælpetekst kan ikke længere overskrive tænd/sluk-knapperne i rummets bund. |
| Dag/aften | En menu i appens stil erstatter systemets native popup. Den understøtter touch, piletaster, Escape og synligt aktivt valg. |
| Indretning | Rumvalg flytter kameraet til rummet; møbelvalg flytter det til møblet. På telefonen justeres mål og placering med plus/minus. |
| Vejr | Udvidet prognose viser kilden og tidspunktet én gang. |
| Mobil | Daglig betjening og indstillingssider viser ingen tekstfelter på telefonen, også i liggende format. Avanceret opsætning foretages på computer/tablet. Rum og Ude kan styres uden først at hente 3D. |
| iPhone | Manifest, et nyt grønt e₂₅-ikon, browserfavicon, hjemmeskærmsmetadata og safe-area-layout er tilføjet. Loginbeskyttelsen er uændret; adgangskoden kan stadig kræve tastaturet. |
| Apple Noter | Sikker JSON-import af begge lister og en valgfri servermodtager er implementeret. Importerede lister er skrivebeskyttede og viser seneste dato. Ændringer foretages i Notes. |
| Opdateringer | Skift mellem desktop og telefon opdaterer listeknapperne korrekt. Notes-kilde og tidspunkt opdateres uden at erstatte hele dashboardet eller slette en uafhængig desktopkladde. |

## Forslag til næste omgang

Prioritet 1 giver mest værdi for den daglige brug. Prioritet 2 forbedrer klarhed og sammenhæng. Prioritet 3 handler om vedligeholdelse og længere tids drift.

| ID | Prioritet | Sted | Forslag og begrundelse |
| --- | --- | --- | --- |
| F1 | 1 | Apple Noter | Færdiggør og afprøv den konkrete iPhone-genvej samt en online modtager og telefonens serveradgang, når Home Assistant er klar, som aftalt. Manuel import er klar, men automatisk overførsel og Apples indbyggede tjekbokse er endnu ikke verificeret. Behold tidspunktet for sidst modtagne indhold. |
| F2 | 1 | iPhone/hjemmeskærm | Afprøv på din faktiske iPhone: åbning fra ikon, rotation, tilbagevenden efter låst skærm, filvalg, Notes-link, musiklogin og langsomt netværk. Chromium i telefonstørrelse kan ikke bekræfte Safaris særlige adfærd. |
| F3 | 1 | Kalender/vægskærm | Afslut Google-client-ID og kontologin. Et fælles offentligt client-ID i buildet kan bruges på alle enheder; en lokalt gemt opsætning på computeren overføres ikke automatisk til telefonen. Ved varig vægskærmsdrift bør en server/HA fornye kalenderadgang, så browserens korte tokenlevetid ikke kræver gentagne login. |
| F4 | 2 | Musik | Lad den store musikmodal starte direkte i den officielle indlejrede afspiller, og behold kontoopsætning i Indstillinger. Den nuværende store visning har stadig dashboardets afspiller og et særskilt foldbart område til den officielle afspiller. En embed er ikke hele tjenestens app, og afspilning dér synkroniseres ikke automatisk med dashboardknapperne. |
| F5 | 2 | Hoveddør | Erstat illustrationens lydmarkering med de ønskede visninger **Live** og **Billede hvert 1./5./10./30. minut**, når et rigtigt kamera er tilsluttet. Vis seneste billedtid og forbindelsesfejl. Den nuværende kameramodal viser stadig et eksempelbillede. |
| F6 | 2 | Tømmekalender | Tilføj et enkelt valg mellem **Næste tømning** og **Detaljeret oversigt**. Kompakt visning bør bevare dato og affaldstype; detaljer kan vise næste flere tømninger. Renosyd skal forbindes og kontrolleres for adressen før livebrug. |
| F7 | 2 | Hjem på mobil | Tilbyd et tydeligt hverdagslayout med kalender, Notes-lister og næste tømning øverst. Kamera, husoversigt og bil kan placeres længere nede. Det eksisterende redigerbare layout kan allerede bruges manuelt; et gemt forvalg vil gøre opsætningen lettere. |
| F8 | 2 | Læsbarhed | Gennemgå små kildeangivelser og sekundær tekst på den fysiske skærm. Brug komfortvisningen og større tekst, hvor oplysninger skal kunne læses på afstand. Kontroller også trykflader og kontrast i både dag og aften. |
| F9 | 3 | Drift med flere skærme | Saml HA-aflæsninger i en kort servercache eller abonnement, så hver telefon/tablet ikke starter de samme forespørgsler. Afprøv samtidig offline/online, strømudfald og gendannelse af serverdata. |
| F10 | 3 | Vedligeholdelse/hastighed | Saml de mange historiske CSS-lag og opdel den store hovedfil pr. funktion. Gør det gradvist med relevante skærmbilleder og tests. 3D bør fortsat være valgfri på telefonen og hvile, når intet ændrer sig. Mål på din faktiske enhed før flere grafiske effekter tilføjes. |
| F11 | 2 | Indretning | Bevar møbellisten åben, når man filtrerer på et rum. I dag lukker listen efter rumvalget, så man skal åbne den igen for at vælge et andet møbel. Det kan spare et tryk ved hvert skift. |

Valgfrit separat forslag: **Husk denne enhed i 30 dage** ved login, med en tom afkrydsningsboks som standard. Det kan mindske indtastning ved åbning fra hjemmeskærmen, men ændrer adgangskontrollen og er ikke implementeret. Den automatiske godkendelseskontrol krævede særskilt godkendelse fra ejeren til denne ændring.

## Kontrol og afgrænsning

Der køres i denne omgang alle modul-/servertests, hele browserpakken samt adgangskodetestene. Fejl fra den fulde kørsel rettes og genprøves med de berørte filer. Fremtidige mindre ændringer skal fortsat kun køre relevante lokale tests og de otte kritiske forløb ved udgivelse; den fulde pakke bevares til natlig/manuelt valgt kontrol. Se [testpolitikken](testing.md).

Browserscenarier kontrollerer blandt andet genindlæsning, navigation, touch-layout, kamerafokus, skrivefelter, HTML-escaping, datamigration og bevaret adgangskodebeskyttelse. Vejr og eksterne kontoforløb bruger kontrollerede testsvar. Det beviser ikke, at en rigtig Apple-, Google-, Spotify- eller HA-konto er forbundet. Apple Notes-broen er beskrevet i [opsætningsvejledningen](apple-notes.md).

Skærmbilleder fra arbejdet findes i sessionens `artifacts/mobile-audit-2026-11-12/`. Vejr og indlæste noter på disse billeder er testdata. iOS/WebKit og det færdige hus er ikke fysisk afprøvet her.

Generelle designreferencer: [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [WCAG 2.2: Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) og [WCAG: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html). De er retningslinjer for næste gennemgang, ikke en påstand om en gennemført WCAG-certificering.

## Resultat af denne gennemgang

138 modul-/servertests og 127 forskellige browserforløb er bestået, inklusive en ekstra kontrol af liggende iPhone. Den første browserkørsel blev afbrudt efter 98 forløb; resten samt de berørte tests er kørt færdige særskilt. Begge adgangskodetests er også bestået med de nye ikoner. Hele den store pakke skal ikke køres ved hver mindre ændring fremover.
