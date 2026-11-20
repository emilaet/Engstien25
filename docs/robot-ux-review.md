# UX- og designgennemgang af robotsektionerne

20. november 2026.

## Retninger, der er gennemført

- Navigationens brand, menu og nederste Engstien-tekst har hver deres reserverede plads. Den nederste dekorative tekst skjules på lave skærme. Menuen kan rulle inden for sin egen plads ved behov, og den aktive markering følger den korrekte knap også efter rulning.
- Fulde danske sektionsnavne bevares på mobil og computer. Skinnen har tilstrækkelig bredde til “plæneklipper”. Robotternes toppanel komprimeres på iPad, så overskrift og øvrige oplysninger ikke presses ud af skærmen.
- Fotorealistiske nærbilleder er genereret ud fra brugerens produktreferencer: sort Qrevo 5AE i stue/alrum og grå Yuka Mini 2 på græs ved skuret. Hele produktet vises uden beskæring eller tekst hen over produktet.
- Nærbillede, 3D og Kort er separate valg. Husets eksisterende kameraovergang og model er bevaret. Zoomknapper vises ved 3D. Hvis et nærbillede ikke kan indlæses, vises 3D og en forståelig besked.
- Nærbillederne er mærket “Visualisering” og udgiver sig ikke for at være livekameraer. Kort og status kommer fortsat alene fra HA.
- Tomme rum-/zone- og statistiksektioner skjules, indtil robotten er koblet til. Ukendt batteri viser ikke en falsk nulprocent-bjælke.
- Ukendte enum-værdier vises som “Ikke oplyst”. Numeriske indstillinger vises kun med gyldige intervaller. Ved tastaturbetjening bevares fokus efter svar fra HA.
- Valgte zoner fjernes fra valget, hvis de bliver utilgængelige. Checkmark er dekorativ, mens aria-pressed formidler valget. Udgåede robotter kan ikke betjenes.
- Indstillingers åbne/lukkede tilstand huskes for hver robot, så de to sider ikke påvirker hinanden.
- Mislykkede kommandoer får en vedvarende lokal fejlbesked og en mulighed for at lukke den. Bekræftelser forsvinder efter seks sekunder. Den faktiske rapporterede status bevares; en afvist kommando vises ikke som et startet arbejde.
- Handlingsknapper har tilstrækkelig tekstkontrast i begge temaer. Tal på skydere bruger dansk talformat.

## Visuel og teknisk afgrænsning

De to WebP-nærbilleder fylder tilsammen cirka 436 KiB og har faste dimensioner. Den eksisterende 3D-model er en placeringsmodel; Yuka-modellen er justeret til den grå reference med tre kameralinser. Der er fortsat ingen simuleret livebevægelse.

Producentkonti er ikke blevet tilsluttet. Fysiske robotfunktioner skal afprøves, når Green er installeret. Integrationsgrænser og Mammotion-forbehold er dokumenteret i robot-devices-plan.md.

## Kontroller

Node-tests, målrettede browserkontroller med simuleret HA, fejl/tilgængelighed, kamerakontinuitet, kort, fokus, kontrast, menuens overlap og fulde navne på lave skærme samt mobil/iPad. Desuden de eksisterende kontroller for Billader, menu, skarp 3D-rendering og Green. Resultat: 200 Node-tests og 25 målrettede browsertests bestået.
