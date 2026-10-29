# Implementering af det godkendte design

Det visuelle udgangspunkt er de seks godkendte renderinger fra 29. oktober 2026. Implementeringen bruger den eksisterende interaktive Three.js-model; ingen AI-genererede husbilleder er indsat i appen.

## Plan og bygning

- `architecture.js` og møblernes grundplaceringer er uændrede. Vægge, rumkonturer, dørslag og vinduespartier følger fortsat `Floorplan.png` og de tidligere HTH-kontroller.
- Walk-in har den eksisterende adskillelse mod køkkenet og den åbne passage til soveværelset. Der er ikke indført en tværvæg fra konceptbillederne.
- Ladeboksen beregnes fortsat fra `shed-door` på skurets østside. Set fra carporten sidder den til venstre for døren. Dens placering er ikke ændret.
- Carporten har et fladt, synligt tag over det oprindelige omrids `[1717,739]` til `[2247,1267]` i plantegningens pixelkoordinater. Der er stadig kun to endestolper på den åbne side. Taghøjden er en modeltilnærmelse, ikke et konstruktionsmål.
- **Tag** skjuler/viser carporttaget. **Plan** og ladeboksens nærbillede skjuler det midlertidigt for at give indblik; tagvalget bevares ved retur. Husets eget tag/loft vises fortsat ikke.

## Lys og aftenvisning

`lighting-data.js` definerer armaturernes identitet, placering, farvetemperatur, styrke og rækkevidde. Soveværelsets `lampe` er venstre sengelampe, `lampeRight` er højre, og `loft` er loftslys. Alle kan tændes og dæmpes uafhængigt. Armaturerne følger de faktiske møbler ved ændret placering.

`room-lighting.js` giver glød i selve pæren/skærmen samt afstands- og overfladeafhængigt, varmt lys på vægge, gulve og møbler. Sengelamperne har kort rækkevidde; loftslyset har højere styrke og større rækkevidde. Individuel dæmpning kombineres med rummets fælles lysstyrke. Stue, alrum og køkken deler lys, fordi der ikke er vægge mellem zonerne. Terrassens lysbidrag passerer kun via de faktiske gulvgående glasåbninger. Et slukket eller nul-dæmpet armatur giver ingen glød. Valg af rum ændrer ikke dets belysning.

Dette er en afgrænset realtime-tilnærmelse til vægtablets, ikke path tracing eller fuld global illumination. Op til seks relevante kilder pr. overflade giver fast shaderomkostning uden 29 globale punktlys og dyre kubiske skyggekort. Eksisterende dagslysskygger bevares. Materialer deles inden for samme rum; slukkede kilder springer de tunge shaderberegninger over. De nye materialer følger også snit-/fuld-væg-valget. Smågenstande giver endnu ikke individuelle skygger fra alle lamper, og spejle viser ikke dynamiske refleksioner. Den valgte tablets grafikprofil bør afprøves ved installationen.

**Dag- og aftenvisning** kan sættes til Auto, Dag eller Aften. Auto beregner solens højde lokalt for Hørning (56.087 N, 10.037 E) og bruger en gradvis overgang i tusmørket. Det kræver ikke vejrdata, netværk eller geolokationsadgang. Indendørs lamper følger altid deres egne tilstande. Det manuelle valg gemmes på enheden. Tid og kalender bruger Europe/Copenhagen.

## Brugerflade og bevaring af data

- Varme hvide flader om dagen; varm koksgrå om aftenen. Rav angiver aktivt lys, grøn opladning og terrakotta påmindelser. Symboler, tekst og kontaktstilling supplerer farverne.
- Hjem indeholder husmodellen, næste tømning, familielister og lademål. Den samme WebGL-canvas flyttes mellem Hjem, Rum og Billader; der oprettes ikke flere renderere. Oversigtskameraet indrammer både hus og carport på smalle og brede skærme uden at nulstille brugerens manuelle zoom.
- Tre prikker åbner fortsat redigering af gridet. Husoversigt er tilføjet som ottende kort. Eksisterende syv-korts layouts får den nye husoversigt uden tab af gemt rækkefølge eller mål på de tidligere kort.
- Rum åbner sine enkelte enheder i højre side. Sengelamper har separate kontakter og dæmpere; fælles rumstyring og husets tænd/sluk-knapper bevares.
- Billader har tydeligt lademål, hurtige målvalg og en pause/genoptag-knap. Læseadgang og utilgængelige målinger låser fortsat kommandoer. Den eksisterende grønne puls afhænger af bekræftet hjemmeladning.
- Gamle lampetilstande, lysstyrke, varme, gardiner, møbelreferencer og familielister bevares. Når en nul-dæmpet lampe tændes igen, gendannes en synlig lysstyrke. Den nye højre sengelampe starter slukket. Dæmpning gemmes pr. enhed i samme journal og synkroniseres mellem faner.
- GitHub-versionen bruger fortsat demoenheder. Ingen Tesla-, OK-, Apple Noter- eller Renosyd-forbindelse er oprettet som del af designændringen.

## Kontrol

Browsertestene kører serielt, så samtidige software-renderere ikke konkurrerer om testmaskinens CPU. Automatiske tests dækker den oprindelige arkitektur, carporttagets omrids/visning, uændret laderplacering, særskilte sengelamper, lysfald, lokale materialelyskilder, soltider, migrering af gamle data og layouts, browserbetjening, mobil/tablet og den krypterede Pages-version. Visuel kontrol supplerer testene i både dag- og aftenscene.
