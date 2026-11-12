# Apple Noter → familiens dashboard

Huskelisten og handlelisten redigeres i Apple Noter. På telefonen viser dashboardet kun punkterne; **Åbn Noter** åbner Notes-appen. Dashboardet skriver aldrig tilbage til en note.

Der er to muligheder. JSON-import virker nu på den eksisterende GitHub Pages-side. Automatisk overførsel er forberedt i dashboardserveren, men kræver en modtager, som er online, samt opsætning og afprøvning af en genvej på din iPhone. Din Mac behøver dermed ikke være tændt. Vi venter efter dit valg med den automatiske modtager, til Home Assistant sættes op. Mobilens adgang til den beskyttede server afprøves samtidig; filimporten kræver ikke serverlogin.

## Første afprøvning uden server

1. Opret to noter med entydige navne, fx **Engstien · Huskeliste** og **Engstien · Handleliste**. Brug almindelige linjer, én ting pr. linje.
2. Opret en genvej i **Genveje** på iPhone. Find hver note ved dens præcise titel. Hent notens brødtekst og konvertér den til almindelig tekst. Kontrollér, at kun den ønskede note bliver valgt.
3. Opret en **Ordbog** med `version` som tallet `1`, `tasks` som huskelistens tekst og `shopping` som handlelistens tekst. Tilføj `tasksTitle` og `shoppingTitle` med de to titler, så en eventuel første titellinje kan fjernes. Tilføj gerne `updatedAt` med den aktuelle dato formateret som ISO 8601.
4. Gem ordbogen som JSON i en fil, fx `noter.json`, i Filer. Handlingsnavne og konvertering til JSON kan variere med iOS-versionen; sammenlign filen med [eksemplet](../examples/apple-notes.snapshot.json).
5. Åbn dashboardet, tryk **Indlæs Noter** ved en af listerne, og vælg filen. Begge lister opdateres samlet. Tidspunktet vises som **Sidst modtaget**.

Det er en import, ikke automatisk synkronisering. Uden dashboardserver gemmes filens indhold kun på den enhed, hvor den indlæses. En Mac, der kun er tændt indimellem, er ikke en pålidelig modtager for løbende opdateringer.

### Afkrydsninger

Almindelig tekst fra Notes kan miste informationen om, hvilke af Apples indbyggede tjekbokse der er afkrydset. Det er ikke afprøvet med din konto/iOS-version. Dashboardet antager derfor ikke, at en almindelig linje er en kendt, uafkrydset tjekboks.

Eksplicitte tekstmarkeringer understøttes: `[ ] Mælk`, `[x] Kaffe`, `☐ Brød` og `☑ Æg`. En genvej, der faktisk kan udlæse status, kan også sende et array med `{ "text": "Mælk", "done": false }`. Først efter kontrol på din iPhone kan vi afgøre, hvordan dine eksisterende Notes-tjeklister bedst overføres.

## Automatisk overførsel via en modtager

Den valgfrie Node-server kan modtage noterne fra iPhone og dele dem med dashboardets andre enheder. Brug serverens egen dashboardudgave på samme adresse; den statiske Pages-udgave kontakter ikke denne server. Opsætning findes i [integrationsvejledningen](integrations.md).

1. Kør dashboardserveren på en maskine, der normalt er online, fx en NAS eller en separat maskine ved Home Assistant. En online modtager er endnu ikke sat op for dig.
2. Opret en tilfældig nøgle på mindst 32 tegn som servervariablen `NOTES_SYNC_TOKEN`. Gem den privat i serverens `.env` og i din genvej. Del den ikke i GitHub eller chatten. Nøglen giver kun adgang til at indsende lister; den giver ikke adgang til at læse data eller styre huset.
3. Sørg for en betroet HTTPS-adresse, som telefonen kan nå, eventuelt gennem en privat VPN. Serverens normale sessionslogin beskytter stadig dashboardets læseadgang.
4. I genvejen erstattes fil-lagring med **Hent indhold af URL**: `POST https://din-dashboardserver/api/notes/import`, JSON som anmodningens indhold og headeren `Authorization: Bearer DIN_PRIVATE_NOTES_NØGLE`. Indholdet er samme ordbog som ovenfor. Ved succes svarer serveren med `ok: true` og datoen, uden at returnere noternes indhold.
5. Afprøv manuelt først. Kontrollér resultatet i dashboardet på to enheder. En synlig klient henter serverlister igen senest efter cirka 30 sekunder.
6. Opret derefter eventuelt en personlig automatisering, der kører genvejen, når Notes lukkes. Vælg automatisk kørsel, hvis din iOS-version tilbyder det. Det er en praktisk udløser, ikke en garanti for baggrundssynkronisering. Vis stadig **Sidst modtaget**, så manglende opdateringer kan opdages.

Ændringer skal fortsat laves i Notes. Ved netværksfejl vises de senest modtagne data. En ældre eksport må ikke overskrive en nyere. Der er ingen tovejssynkronisering eller skjult skrivekø. Serveren accepterer højst 64 KiB, 500 punkter pr. liste og 500 tegn pr. punkt.

## Hvad er afprøvet?

JSON-validering, atomisk opdatering af begge lister, genindlæsning, sikker tekstvisning, afvisning af gamle eksporter, skrivebeskyttelse og det tokenbeskyttede server-endpoint er testet. Din iPhone-genvej, Apple-konto, indbyggede Notes-tjekbokse og automatisering er endnu ikke forbundet eller afprøvet.
