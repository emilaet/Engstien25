# Gratis kontolagring med Supabase

Appen bliver på GitHub Pages. Supabase Free leverer login og en database med brugerens dashboardprofil. Projektets URL og publishable key i `src/supabase-account.js` er offentlige forbindelsesoplysninger. De giver ingen adgang til private profiler uden et gyldigt brugerlogin. Der bruges ingen service_role-nøgle, secret key eller databaseadgangskode i appen, GitHub eller backup.

## Opsæt projektet

1. Opret et projekt i en Free-organisation og en EU-region. Vælg ingen betalte tilvalg.
2. Åbn **SQL Editor → New query**, indsæt hele [setup.sql](../supabase/setup.sql), og vælg **Run**. Scriptet kan køres igen uden at slette eksisterende opsætninger.
3. Under **Authentication → Users → Add user → Create new user** oprettes den bruger, der skal logge ind i Engstien-appen. Brug en privat adgangskode, og markér e-mailen som bekræftet, hvis formularen tilbyder det. Supabase-administratorkontoen er separat fra denne appbruger. Appen tilbyder ikke offentlig brugeroprettelse.
4. Efter udgivelsen åbnes **Indstillinger → Skærm og dashboard → Din Engstien-konto** i appen. På computer findes login også under Forbindelser. Log ind med appbrugerens e-mail og adgangskode. Loginfeltet på telefonen tillader bevidst indtastning; almindelige dashboardkontroller åbner fortsat ikke tastaturet.
5. På en konto uden en gemt profil gemmes den aktuelle browsers opstilling. En konto med en profil henter den automatisk, også i en privat browsersession. Efter login skal status være **Opstillingen er gemt fælles for huset**.

Samme appkonto på flere enheder giver samme opstilling. Forskellige appkonti har separate profiler. Mobilens rækkefølge, højder, synlighed og listevisning gemmes særskilt med profilen. På computeren åbner **Indstillinger → Skærm og dashboard → Tilpas mobildashboard** en 390 px telefon-preview. Gemning her ændrer ikke iPad-layoutet. De samme felter følger kontoen til telefonen; der skal ikke køres ny SQL ved denne opgradering. Login opbevares i `sessionStorage` og genbruges i den aktuelle browsersession. Log ud fjerner loginoplysningerne. Refresh-tokens indgår aldrig i profil eller backup.

## Hvis login afvises

**E-mail eller adgangskode er forkert** er et svar fra Supabase Auth. Kontrollér, at appbrugerens e-mail findes under **Authentication → Users** i det rigtige projekt. Databasens adgangskode, den krypterede hjemmesides adgangskode og Supabase-administratorkontoens adgangskode er separate fra appbrugerens login. Del ingen af adgangskoderne i chat eller kode. Efter et afvist forsøg bevarer appen e-mailen og tømmer adgangskodefeltet, så et nyt forsøg er enkelt. Produktionslogin kan kun bekræftes med ejerens egen appkonto.

## Hvad synkroniseres?

Tesla flyttes ved opgraderingen til bjælken ved vejret. Det gamle kort kan tilvælges igen i dashboardredigeringen; øvrige gemte placeringer bevares.

Widgetrækkefølge, placering, størrelser, synlighed, widgetternes visningsvalg, dag/aften/auto, læsetæthed og dagsblikkets synlighed. Usendte layoutudkast synkroniseres ikke. Offlineændringer bevares i en lokal kø for den konkrete konto. En revisionskonflikt kræver et bevidst valg mellem kontoens og den lokale opstilling.

Huskelistens og handlelistens **indhold** bruger fortsat deres lokale lagring eller den eksisterende Node-/Notes-kilde. Det er ikke en del af dashboardprofilen. Automatisk Apple Notes-overførsel og Home Assistant er separate integrationer, som endnu ikke er tilsluttet. Musik- og kalenderlogin følger deres eksisterende forbindelser.

## Adgang og validering

`dashboard_profiles` har RLS og tillader kun læsning af rækken, hvor `user_id = auth.uid()`. Direkte skrivning fra klientroller er afvist. Funktionen `save_dashboard_profile` kræver et brugerlogin, bruger altid dets ID og kontrollerer revisionen under en rækkelås. Funktionen accepterer intet bruger-ID fra klienten. Anonyme roller kan hverken læse profiler eller kalde skrivefunktionen.

Den faktiske SQL afprøves i en lokal Postgres-motor med to brugere, anonym adgang, revisionskonflikter og kontosletning. Browserforløbet tester to isolerede browsersessioner og kontoskift med en simuleret Supabase-HTTP-grænse. Produktionslogin kræver ejerens private adgangskode og skal derfor bekræftes af ejeren i appen.

## Gratisplan

Der oprettes ingen betalt server eller betalt database i denne opsætning. Supabases gratisplan har forbrugsgrænser og kan sætte et inaktivt projekt på pause. Der er ingen automatisk opgradering eller betaling i appens kode. Kontroller eventuelle ændringer i udbyderens planvilkår direkte i Supabase.

## Home Assistant senere

Den valgfrie Node-server understøttes fortsat og bruger sin eksisterende lokale lagring og adgangskode. På dens adresse har serverens profil forrang. Supabase giver ikke i sig selv adgang til hjemmets lokale Home Assistant.
