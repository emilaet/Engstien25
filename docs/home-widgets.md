# Hjem: vejr, kamera og kalender

De godkendte renderinger fra `design-renderinger/downloads/widgets-v2` er implementeret i den eksisterende app. Husets geometri og rumstyring er bevaret.

Standardlayoutet har otte synlige kort: hus, hoveddørskamera og vejr i første række; kalender, affald og bil i anden; huskeliste og handleliste i tredje. Lodret iPad bruger to kolonner, og telefon bruger én. Egne layouts følger de gemte gridmål.

Vejret viser en femdagesprognose eller seks kommende timer med farvede sol-, sky-, måne- og regnsymboler. Valget huskes på enheden. Detaljevinduet har begge visninger. Datoer og timer bruger Europe/Copenhagen, også ved sommertid og midnat. Prognosen er lokal eksempeldata, ikke en tilsluttet vejrtjeneste.

Hoveddørskameraet viser den godkendte fotorealistiske AI-illustration mod vejen, tydeligt markeret som eksempel. Større billede åbner et dialogvindue; fuld skærm benytter browserens mulighed og viser en forklaring, hvis den mangler. Luk og Escape returnerer fokus til åbningsknappen. Der er endnu ingen videostream eller lydforbindelse, og der indgår ingen kamerakoder i klienten.

Kalenderen er forberedt til familiens Google Kalender. Den kompakte udgave viser kommende aktiviteter, og Se hele ugen viser alle eksempelaftaler i de kommende syv dage. Dagknapper filtrerer listen, og tomme dage forklares. Det er ikke familiens rigtige kalender.

`home-widget-data.js` leverer normaliserede snapshots via `createDemoWidgetsProvider().load()`. Senere kan en adapter erstatte eksemplerne; live vejr, Google Kalender og kamera kræver særskilt tilslutning. UI'en i `home-widgets.js` henter ikke data direkte fra eksterne tjenester.

Rediger dashboard åbner et panel med vis/skjul for alle 11 widgets. Vælg et kort eller en række i panelet for at ændre bredde/højde eller flytte tidligere/senere. Træk i kortenes håndtag, eller brug håndtagets piletaster, for at ændre rækkefølgen. Gem dashboard gemmer udkastet; Annuller, luk eller Escape forkaster det. Skjulte widgets er dæmpede under redigering og vender tilbage med deres indstillinger, når de vises igen.

Layoutet gemmes som `engstien-home-layout-v3`. Et urørt v2-standardlayout opdateres til det nye design. Et tilpasset v2-layout bevarer rækkefølge, størrelser og synlighed; de tre nye widgets tilføjes. V1-layoutet kan stadig hentes som et udkast via Tidligere layout. Gamle nøgler slettes ikke.
