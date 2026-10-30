# Rumstyring · godkendte UX-renderinger

Designkilder: de fem renderinger i designgrenen under `downloads/rum-ux/`. Implementeringen bruger den eksisterende model og samme rum- og enhedsidentiteter.

Et rum vælges i modellen eller via den søgbare rumoversigt. Hele højrepanelet bliver rummets arbejdsområde. Overskriften, fanerne og de fælles handlinger bliver stående, mens selve indholdet kan rulles uden synlige scrollbjælker. På vandret iPad er panelet 410 CSS-pixels; smallere tablets bruger 350–375 pixels, og telefonen stabler panel og model.

Fanerne afspejler data: Lys kræver lamper, Varme kræver temperaturer, Gardiner kræver navngivne gardiner. Soveværelset har tre lamper og ingen gardinfane. Stuen har tre selvstændige gardiner. Tab-fokus og piletaster følger ARIA-tabmønstret. Valg af rum giver fokus til den nye overskrift; tilbage til oversigten giver fokus til søgning.

Lyskort har separate kontakter og dæmpere. En gemt fælles rumdæmpning indregnes i de viste individuelle niveauer. Første individuelle justering flytter den fælles faktor til de enkelte niveauer, så andre lampers faktiske lys bevares, og den nye skyder angiver et absolut niveau. Rummets fælles tænd/sluk ændrer ikke varme eller gardiner. Temperaturen justeres med ±0,5 °C eller 18/22/24-graders forvalg og begrænses til 16–28 °C. Varmebehov beregnes ud fra eksempeltemperaturerne; det er ikke aflæsning af en fysisk ventil.

Gardinernes demo simulerer bevægelse med 2 procentpoint hvert 200 ms. Åbn/Luk kan stoppes pr. gardin; en manuel positionsændring stopper den pågældende bevægelse. Samlet åbning/lukning starter alle rummets gardiner. Positioner gemmes ved stop, slutposition og undervejs. Bevægelse i et andet rum fortsætter, mens man skifter fane eller rum. Det er lokale demoændringer, ikke kommandoer til Home Assistant.

Overskrifter er altid neutral varm grå (`#34332f`) eller varm hvid (`#f2f0e7`). Aktive lamper, udvalgte gardiner og styring anvender ravgult; ingen valgregel må gøre rum- eller enhedsoverskrifter grønne.

Startudsnit i Rum beregnes fra selve husets aftryk, så carporten ikke trækker Plan og 3D væk fra rummene. Full bruger samme hus som centrum med plads til taget. Kameraberegningen bruger det aktuelle modelpanels størrelse, også straks efter navigation fra Hjem; manuel zoom og rotation bevares indtil nulstilling eller et nyt visningsvalg.

Plan bruger nu kun 15 cm vandret frigang omkring husets indvendige aftryk, mens 3D bruger op til 98 % af kamerabredden. Carport og terrasse må beskæres. Hjems separate, lille planoversigt beholder sit eget udsnit.
