# UX- og designgennemgang af robotsektionerne

21. november 2026, version 0.3.3.

## Retninger, der er gennemført

- Navigationens brand, menu og nederste Engstien-tekst har hver deres reserverede plads. Den nederste dekorative tekst skjules på lave skærme. Menuen kan rulle inden for sin egen plads ved behov, og den aktive markering følger den korrekte knap også efter rulning.
- Fulde danske sektionsnavne bevares på mobil og computer. Skinnen har tilstrækkelig bredde til “plæneklipper”. Robotternes toppanel komprimeres på iPad, så overskrift og øvrige oplysninger ikke presses ud af skærmen.
- De statiske produktbilleder er fjernet. Begge kameraovergange slutter i husets samme interaktive 3D-scene. Mus og finger roterer kameraet, knibezoom ændrer afstanden, og nulstilling finder stationen igen. Kort åbnes kun efter et udtrykkeligt valg af fanen Kort.
- Den sorte Qrevo 5AE står i stue/alrum mellem planten og glaspartiet. Havevæggen bevarer sin fulde højde i nærvisningen. Den grå Yuka Mini 2 står på den eksisterende græsflade op mod skuret med fronten væk fra indkørslen. Vægge, træbeklædning, gulv og fliser kommer fra den faktiske husmodel.
- Geometrien er ombygget med afrundede kabinetter, sammenhængende støbte flader, fysisk profileret stationsfront, tanke, lidar, optik, hjul, mønster og ladestationer. Materialerne har fine overfladedetaljer og refleksioner. Fast lokal belysning og skygger giver form uden at udskifte omgivelserne.
- Den godkendte materialeretning er bygget med tæt, buet græs ved plæneklipperen og et detaljeret græsmateriale på den eksisterende haveflade. Rødder holdes fri af belægning, plantekasser, skur og ladestation. Instanser og kvalitetsniveauer begrænser mængden af geometri; under kamerabevægelser bruges færre strå, og detaljerne gendannes i hvile.
- Den tidligere grove potteplante er erstattet med forgrenede stængler, individuelt orienterede og buede blade med bladårer, en glat hul keramikkrukke og tredimensionelle jordpartikler. Delene samles i fem draw calls, og materialer og teksturer frigives, når planten fjernes eller ombygges.
- Stuevisningen indrammer både station og plante ud fra deres faktiske geometri. En responsiv synsvinkel holder kameraet foran suitevæggen på smalle skærme. Skurets træstruktur og bræddernes nuancevariation er forfinet.
- Begge produkter passer i nærvisningen på telefon og iPad. Betjeningen ligger uden for selve produktet. Kameraet kan drejes inden for et bredt interval foran den virkelige væg. Brugerens justerede vinkel nulstilles ikke automatisk efter træk.
- Kameraovergangen bevarer sin bevægelse og har en tidsgrænse ved lav billedfrekvens eller genoptagelse af en baggrundsfane. Træk og zoom frigives, selv hvis en langsom renderer ikke når otte billeder.
- Tomme rum-/zone- og statistiksektioner skjules, indtil robotten er koblet til. Ukendt batteri viser ikke en falsk nulprocent-bjælke.
- Ukendte enum-værdier vises som “Ikke oplyst”. Numeriske indstillinger vises kun med gyldige intervaller. Ved tastaturbetjening bevares fokus efter svar fra HA.
- Valgte zoner fjernes fra valget, hvis de bliver utilgængelige. Checkmark er dekorativ, mens aria-pressed formidler valget. Udgåede robotter kan ikke betjenes.
- Indstillingers åbne/lukkede tilstand huskes for hver robot, så de to sider ikke påvirker hinanden.
- Mislykkede kommandoer får en vedvarende lokal fejlbesked og en mulighed for at lukke den. Bekræftelser forsvinder efter seks sekunder. Den faktiske rapporterede status bevares; en afvist kommando vises ikke som et startet arbejde.
- Handlingsknapper har tilstrækkelig tekstkontrast i begge temaer. Tal på skydere bruger dansk talformat.

## Visuel og teknisk afgrænsning

De genererede WebP-billeder og billedlaget er fjernet fra både hjemmesiden og Green-pakken. Produktmodellerne er procedurale præsentationsmodeller ud fra referencerne, ikke producenternes CAD-filer. Detaljer er samlet efter materiale for at begrænse antallet af draw calls; kameraet og den eksisterende renderer deles med huset og Billader. Renderingen går i hvile, når visningen står stille. Der er fortsat ingen simuleret livebevægelse.

Græs- og bladmaterialernes albedokort er genereret til projektet og indlejres i bygget. De ligger på den faktiske 3D-geometri og kræver ingen ekstern billedtjeneste ved brug. De godkendte konceptbilleder bruges alene som forlæg. Synsvinkel, skygger og parallax beregnes fortsat af den fælles 3D-renderer. WebGL-visningen afprøves selvstændigt; konceptbillederne er ikke skærmbilleder af implementeringen.

Producentkonti er ikke blevet tilsluttet. Fysiske robotfunktioner skal afprøves, når Green er installeret. Integrationsgrænser og Mammotion-forbehold er dokumenteret i robot-devices-plan.md.

## Kontroller

Node-tests og målrettede browserkontroller med simuleret HA dækker fejl/tilgængelighed, kamerakontinuitet, kort, fokus, kontrast, menuens overlap og fulde navne på lave skærme samt mobil/iPad. Nye kontroller udfører rigtige musetræk, fingertræk og knibezoom i begge robotvisninger, sammenligner kameraets position og kontrollerer, at scenen stadig er synlig efter overgangen. Desuden kontrolleres de eksisterende funktioner for Billader, menu, skarp 3D-rendering og Green. Dagslys, aftenlys og mobil er gennemgået visuelt.

Kontrollerne omfatter også en simuleret lang forsinkelse mellem animationsbilleder, så kameraets betjening frigives uden at vente på otte billeder. Green-pakken valideres og bygges sammen med udgivelsen.

Kameratesten registrerer start og faktiske kamerapositioner, inden navigationen sendes, så korte overgange kan verificeres uafhængigt af testmaskinens hastighed. Afbrydelsestesten sender to navigationer i samme browserhændelse for at sikre, at den første tur stadig er igang, når den anden starter.

Resultat for materialeretningen: 207 Node-tests og 29 målrettede browserkontroller bestået. De syv kamera- og interaktionskontroller er bekræftet efter den sidste finpudsning af græssets overgang og detaljegrad. Den krypterede webversion har desuden bestået tre kontroller af adgang, indlejret fungerende 3D og mobilkonto-login. Build, Green-validering og lokal pakning er bestået.
