# UX-forbedringer efter gennemgangen 1. november 2026

Det nye standardoverblik bruger tre kolonner med hus/kalender/vejr, kamera/bil/tømning og lister/musik. Gemte layouts beholder deres placeringer og mål; **Nyt hverdagsblik** i menuen åbner standarden som et udkast med Fortryd og Gem.

De ti godkendte punkter fra UX-gennemgangen er implementeret i den eksisterende app. Husets geometri, kameraillustrationen og integrationsgrænserne bevares. Ingen ny liveforbindelse er oprettet.

1. **Læsbare widgettilstande.** Mini-vejr viser temperatur og vejrtype samt adgang til den fulde prognose; standard viser tre eller fem perioder efter pladsen. Høje, smalle kort udnytter lodret plads. Mini-kalender viser næste aftale, og større kort viser flere aftaler. Primære labels er større, og Tesla bevarer batteri, mål og effekt.
2. **Mobilprioritering.** Et nyt standardoverblik viser kalender, tømning, vejr og bil før de store hus-/kamerabilleder. Desktop-speciallayouts og eksplicitte mobilvalg bevares. Uden en gemt mobilrækkefølge får også et tilpasset desktoplayout den nye mobilprioritering. Telefonens højde gemmes i `mobileHeightPx`, så en telefonændring ikke krymper desktopkortet.
3. **Fortryd på mobil.** Listeoprydning giver en vedvarende Fortryd-handling over bundnavigation og safe area. Tastaturfokus kan returnere til listen efter gendannelse.
4. **Beskyttet layoutudkast.** Intern navigation skjuler editoren midlertidigt og bevarer udkast og historik. Ændrede udkast gemmes i sessionStorage som `engstien-home-layout-draft-v1`, bundet til den oprindelige gemte version, og gendannes efter genindlæsning. Gem skriver fortsat først til det vedvarende layout; Annuller/Escape forkaster udkastet. Uændrede redigeringssessioner markeres ikke som ugemte.
5. **Navigation med kontekst.** Rum og fane indgår i links som `#rooms/stue/curtains`; Tilbage/Frem gendanner også den relevante rulleposition. Valg af rum/fane ændrer ingen enheder.
6. **Kontrast og betjening.** Dagvisningens afdæmpede tekst og blå vejrtekst er mørkere. Hyppige touchkontroller har større hitareal, og fokusmarkeringer bevares. En fysisk iPad-/Safari- og skærmlæsertest anbefales fortsat før permanent væginstallation.
7. **Datastatus.** Global demo-/delvis forbindelsesstatus, synlig lokal/delt listestatus og sidst kendte bildata ved de primære tal. Ukendte værdier og låst livebetjening bevares.
8. **Kontekstuel editor.** Værktøjerne ligger i headerområdet, med valgt widget og hurtige størrelser. Primært det valgte kort viser håndtag; hover/fokus giver fortsat adgang til andre kort, og touch kan vælge et kort først. Widgets åbner en mindre, valgfri indstillingsboks. Alle fire flytteretninger, tomme pladser, knap-/tastaturalternativer, Fortryd/Gentag og pointercancel er bevaret.
9. **Mobil billader.** Betjeningen står før 3D-forhåndsvisningen. Batteri, mål og Pause/Genoptag kan nås på første skærm. 3D-billedet kan udvides separat.
10. **Valgfrit dagsblik.** Højst tre relevante punkter for i dag/i morgen, med genveje til de eksisterende detaljer. Mobil viser højst to. Funktionen kan skjules via menuens Vis dagsblik og husker valget uden at ændre gridet. Offline-affald bliver ikke præsenteret som en aktuel påmindelse.

Den separate reviewmappe indeholder fortsat de oprindelige før-billeder og koncepttegninger. De er ikke en teknisk specifikation for husets grundplan eller dataintegrationer.
