# Udemiljø

Åbn **Rum → Ude**. Vælg **Have** eller **Indkørsel**, eller træk for at rotere frit. Nulstil bevarer den valgte udevinkel. Udemiljøet er også synligt omkring huset i **3D**, **Plan** og dashboardets husoversigt.

Udemiljøet følger de godkendte konceptbilleder: sammenhængende lyse 60 cm fliser, udvidet rektangulær vestterrasse, et L-bed på græsset langs flisernes indvendige vinkel ved den store haveterrasse, spiseplads til seks, lounge, grill, opbevaring, krukker, græs og enkelte flerstammede træer. Der er ingen baghæk. Huset, vinduerne, døråbningerne, skuret og carporten bruger fortsat de oprindelige tegninger.

Indkørslen ligger uden for carportens åbne østside og stiger 1 meter over 5 meter (20 %), som oplyst af ejeren. Fliserne under carporten og terrasserne er plane; forhavens græs følger indkørslens niveauer. Haveomrids og møbelplaceringer er konceptplaceringer, ikke nye landmålerkoter.

Geometri og placeringer deles via `src/outdoor-layout.js`. De tidligere terrasseindhak er flisebelagt. Den lange plantekasse følger hjørnet mellem gangstriben og loungens terrasse med en 2 cm samling, som rummer kassens metalrand; begge arme står på græs. Den lille plantekasse ved vestterrassen står også uden for fliserne. Plantekassen langs carporten er fjernet. Terrænets højde og flisernes verdenskoordinater bevarer niveau og fugemønster på tværs af overgange. Beplantning og møbler bruger instanser og delte materialer; modellen tilføjer ingen kontinuerlig renderløkke.

Havens små pullerter er erstattet af tre sorte op/ned-væglamper på de markerede murfelter: til højre for det smalle stuevindue, til venstre for det store glasparti og mellem glaspartiet og badeværelsesvinduet. De styres samlet af **Rum → Ude → Væglamper**, inklusive den gemte lysstyrke. Varme lysaftryk ligger på murværkets yderside og klippes sammen med væggene i 3D/Plan. Der tilføjes ingen ekstra lyskilder med skyggekort. Den tidligere `entre.lights.ude` flyttes til `outside.lights.wall` med gemt tilstand, dæmpning og eventuel enhedskobling. **Spots i carporten** styrer seks indbyggede spots separat via `outside.lights.spots`. Der er dermed ni udendørs lysplaceringer og fortsat ingen fritstående havelamper.

En hvid Model Y med sorte fælge står bakket ind i venstre carportplads, set fra vejen. Den bruger nu en detaljeret, licenseret GLB af den oprindelige Model Y-generation, med hvid lak, sorte fælge og synligt ladekabel til venstre baghjørne. Bilen står på det plane flisegulv med bagenden mod skuret. [Kilde, licens og optimering](model-y-asset.md). Hele bilgruppen inklusive stik og kabel skjules i Billader-nærbilledet og gendannes i 3D/Plan/Ude. Dag/aften ændrer scenens belysning; billaderkortet har ingen fade-gradient i top eller bund.

Viewerens overskrift, undertitel, lysforklaring og knapper optager egne felter uden for selve 3D-canvas. De følger tekstombrydning og skærmbredde i almindeligt layout.

Udemøblerne er præsentationsobjekter, adskilt fra den redigerbare indendørs møbelliste. Ingen nye Home Assistant-enheder eller kontoforbindelser oprettes.

Den 16. november 2026 blev forslaget godkendt med plantekassen helt op ad flisernes vinkel, stadig på græsset. En stor hængeparasol med 3,3 m kvadratisk lys dug, mørk sidemast og tung fod står ved spisepladsens ydre kant. Parasollen, puderne, den foldede plaid, frugtskålen og de to lanterner er statiske, delte geometrier/materialer. Lanternens lys er en beskeden materiale-glød i aftenvisning og giver ingen nye lyskilder, skyggekort eller animationer. Ude-kameraet indrammer også den udvidede flade og parasollens top.


I 0.3.4 erstattes de grove potteblade med en hortensia og et lille oliventræ i hule, drejede keramikkrukker. Et lille blomsterarrangement står på spisebordet. Plantekasserne får tynde buede blade, separate lavendelstilke og mange små kronblade. Både nærvisningen ved plæneklipperen og den fulde have har instanser af buet græs med kvalitetsafhængig tæthed; belægning, huset, skuret og stationen holdes fri. Bløde kontaktskygger under møbler og krukker supplerer solens skygger. Alle eksisterende placeringer og fliseafgrænsninger bevares.
