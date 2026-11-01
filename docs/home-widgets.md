# Hjem: vejr, kamera, kalender og musik

De godkendte renderinger fra `design-renderinger/downloads/widgets-v2` er implementeret i den eksisterende app. Husets geometri og rumstyring er bevaret.

Standardlayoutet har ni synlige kort: hus, hoveddørskamera og vejr i første række; kalender, affald og bil i anden; huskeliste og handleliste i tredje; musik tilføjes nedenunder. Gridet tilpasser sig bredden på iPad; telefon bruger én kolonne. Egne layouts følger de gemte gridmål. Alle 12 kort har size-container-queries for deres egen bredde og højde; de kompakte regler gælder også gemte speciallayouts. Høje, smalle timeprognoser bruger to rækker, brede lave kalendere kan bruge tre kolonner, og Tesla holder batteri, lademål, effekt og tid samlet i én kolonne. Lister og kalendere har rulleområder, og ekstremt lave kort kan rulles for at nå resterende indhold og handlinger. Telefon bruger altid fuld bredde uden at ændre de gemte breddevalg.

Vejret viser en femdagesprognose eller seks kommende timer med farvede sol-, sky-, måne- og regnsymboler. Valget huskes på enheden. Detaljevinduet har begge visninger. Datoer og timer bruger Europe/Copenhagen, også ved sommertid og midnat. Prognosen er lokal eksempeldata, ikke en tilsluttet vejrtjeneste.

Hoveddørskameraet viser den godkendte fotorealistiske AI-illustration mod vejen, tydeligt markeret som eksempel. Større billede åbner et dialogvindue; fuld skærm benytter browserens mulighed og viser en forklaring, hvis den mangler. Luk og Escape returnerer fokus til åbningsknappen. Der er endnu ingen videostream eller lydforbindelse, og der indgår ingen kamerakoder i klienten.

Kalenderen er forberedt til familiens Google Kalender. Den kompakte udgave viser kommende aktiviteter, og Se hele ugen viser alle eksempelaftaler i de kommende syv dage. Dagknapper filtrerer listen, og tomme dage forklares. Det er ikke familiens rigtige kalender.

`home-widget-data.js` leverer normaliserede snapshots via `createDemoWidgetsProvider().load()`. Senere kan en adapter erstatte eksemplerne; live vejr, Google Kalender og kamera kræver særskilt tilslutning. Vejr, kamera og kalender i `home-widgets.js` bruger fortsat eksempeldata. Musik indlæser Apples afspiller ved brugerens udvid-klik.

Rediger åbner nu direkte redigering på selve dashboardet. Den lille værktøjslinje har Widgets, Fortryd, Gentag, Annuller og Gem dashboard. Den ændrer hverken kortenes bredde eller dashboardets visningsområde. Træk i håndtaget til højre for at ændre bredde, nederst for højde, eller nederste højre hjørne for begge. Kortet og dets indhold tilpasser sig under trækket. Bredder følger tolv kolonner (2–12), og højder følger et 16-pixels raster. Flyttehåndtaget øverst på kortet løfter det under markøren. En synlig pladsholder markerer den præcise placering i gridet, også på tomme pladser og ved bevægelser opad eller til venstre. Andre kort giver plads under trækket, og passende lige store pladser byttes. Små afvigelser nær en række justeres til dens kant. Tomme områder bevares efter gemning. Telefon bruger fuld bredde og lader højde og lodret rækkefølge ændres.

Skjulte widgets fylder ikke under redigering. Widgets-knappen åbner valgfrit vis/skjul, præcise valg, størrelsesforslag og nulstilling. Piletaster på bredde-/højdehåndtag ændrer størrelsen, og på flyttehåndtaget flytter de i fire retninger. Widgets-menuen har også fire klikbare pile som alternativ til at trække. Fortryd/Gentag behandler et helt træk som én ændring. Escape under et træk, pointercancel og mistet pointer capture gendanner tilstanden før trækket. Escape lukker først eventuelle widgetindstillinger, og ellers forkaster det hele udkastet. Gem bevarer den størrelse, der blev vist under redigeringen; luk, Annuller eller navigation til et andet område forkaster udkastet.

Alle layouts bruger samme grid i visning og redigering. `heightPx` gemmer den direkte ændrede højde, og `column`/`row` gemmer placeringen. Telefon har en selvstændig `mobileOrder` ved flytning, så en mobilændring ikke ødelægger desktopplaceringen; gamle speciallayouts beholder deres mål med afrunding til det nye raster. Husets canvas genbruges.

Layoutet gemmes som `engstien-home-layout-v3`. Et urørt v2-standardlayout opdateres til det nye design. Et tilpasset v2-layout bevarer rækkefølge, størrelser og synlighed; kamera, vejr, kalender og musik tilføjes. V1-layoutet kan stadig hentes som et udkast via Tidligere layout. Gamle nøgler slettes ikke.

Tømmekalenderens to næste tømninger vises som separate rækker med fraktioner og dato, også når detaljekalenderen er lukket. Påmindelsen til den nærmeste tømning bevares. Datoerne er fortsat Renosyd-eksempeldata. Se også [redigeringens interaktion og test](dashboard-editing.md).

Vejrets lave kort prioriterer aktuel temperatur og alle fem dage eller seks timer på én række. Vind, føles-som og de øvrige oplysninger findes i den udvidede prognose. Eksempelmarkeringen og udvid-knappen bevares i minimumsvisningen; smalle kort kan skifte prognosetype i den udvidede visning.

Musik er en ny, synlig widget. Den udvides til en dialog med Apples officielle indlejrede afspiller og links til Apple Music. Et eget Apple Music-link kan gemmes lokalt. Der vises ingen opfundet sang- eller afspilningsstatus. Kun sikre links på music.apple.com eller embed.music.apple.com accepteres; sporingsparametre fjernes, og albumsporets i-parameter bevares. En iframe oprettes først på brugerens udvid-klik og fjernes ved lukning, så der ikke er skjult afspilning. Apple Music håndterer selv afspilning, login og bibliotek.

Et eksisterende v3-layout med 11 widgets får musik tilføjet én gang, mens oprindelige størrelser, positioner, synlighed og mobilrækkefølge bevares. Gamle nøgler slettes fortsat ikke.
