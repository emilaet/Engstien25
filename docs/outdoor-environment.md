# Udemiljø

Åbn **Rum → Ude**. Vælg **Have** eller **Indkørsel**, eller træk for at rotere frit. Nulstil bevarer den valgte udevinkel. Udemiljøet er også synligt omkring huset i **3D**, **Plan** og dashboardets husoversigt.

Udemiljøet følger de godkendte konceptbilleder: sammenhængende lyse 60 cm fliser, vestterrasse med retvinklet indhak, et separat L-bed ved den store haveterrasse, spiseplads til seks, lounge, grill, opbevaring, krukker, græs og enkelte flerstammede træer. Der er ingen baghæk. Huset, vinduerne, døråbningerne, skuret og carporten bruger fortsat de oprindelige tegninger.

Indkørslen ligger uden for carportens åbne østside og stiger 1 meter over 5 meter (20 %), som oplyst af ejeren. Fliserne under carporten og terrasserne er plane; forhavens græs følger indkørslens niveauer. Haveomrids og møbelplaceringer er konceptplaceringer, ikke nye landmålerkoter.

Geometri og placeringer deles via `src/outdoor-layout.js`. Terrasseindhak er reelle polygonudsnit. Terrænets højde og flisernes verdenskoordinater bevarer niveau og fugemønster på tværs af overgange. Beplantning og møbler bruger instanser og delte materialer; modellen tilføjer ingen kontinuerlig renderløkke.

Havens små pullerter er erstattet af tre sorte op/ned-væglamper på de markerede murfelter: til højre for det smalle stuevindue, til venstre for det store glasparti og mellem glaspartiet og badeværelsesvinduet. De styres samlet af **Entré → Udelys ved terrasse og carport**, inklusive den gemte lysstyrke. Varme lysaftryk ligger på murværkets yderside og klippes sammen med væggene i 3D/Plan. Der tilføjes ingen ekstra lyskilder med skyggekort. Den eksisterende enhedsnøgle `entre.lights.ude` og dæmpningen bevares; kun de tre facadeplaceringer indgår nu i lyslayoutet.

En hvid, stiliseret 2023 Tesla Model Y med sorte fælge står bakket ind i venstre carportplads, set fra vejen. Bilen har modelårets separate forlygter og panoramaglastag. Den står på det plane flisegulv med bagenden mod skuret og et synligt ladekabel til ladeporten ved venstre baghjørne. Bilen er let 3D-geometri og kræver ingen ekstern model-download. Billaderens nærkamera står ved siden af den optagede parkeringsplads. Dag/aften ændrer scenens belysning; billaderkortet har ingen fade-gradient i top eller bund.

Udemøblerne er præsentationsobjekter, adskilt fra den redigerbare indendørs møbelliste. Ingen nye Home Assistant-enheder eller kontoforbindelser oprettes.
