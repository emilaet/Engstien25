# Udemiljø

Åbn **Rum → Full**. Vælg **Have** eller **Indkørsel**, eller træk for at rotere frit. Nulstil bevarer den valgte udevinkel. **3D**, **Plan** og dashboardets husoversigt beholder deres indendørs visninger.

Udemiljøet følger de godkendte konceptbilleder: sammenhængende lyse 60 cm fliser, vestterrasse med retvinklet indhak, et separat L-bed ved den store haveterrasse, spiseplads til seks, lounge, grill, opbevaring, krukker, græs og enkelte flerstammede træer. Der er ingen baghæk. Huset, vinduerne, døråbningerne, skuret og carporten bruger fortsat de oprindelige tegninger.

Indkørslen ligger uden for carportens åbne østside og stiger 1 meter over 5 meter (20 %), som oplyst af ejeren. Fliserne under carporten og terrasserne er plane; forhavens græs følger indkørslens niveauer. Haveomrids og møbelplaceringer er konceptplaceringer, ikke nye landmålerkoter.

Geometri og placeringer deles via `src/outdoor-layout.js`. Terrasseindhak er reelle polygonudsnit. Terrænets højde og flisernes verdenskoordinater bevarer niveau og fugemønster på tværs af overgange. Beplantning og møbler bruger instanser og delte materialer; modellen tilføjer ingen kontinuerlig renderløkke. De eksisterende udelys-ID'er og lysstyring bevares.

Udemøblerne er præsentationsobjekter, adskilt fra den redigerbare indendørs møbelliste. Ingen nye Home Assistant-enheder eller kontoforbindelser oprettes.
