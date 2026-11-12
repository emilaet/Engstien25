# Vejr, Google Kalender og Jakarta

Alle appens egne tekster, formularer og visningsknapper bruger den lokalt indlejrede Plus Jakarta Sans. Adgangskodesiden bruger samme font. Have, terrasser og indkørsel forbliver synlige i 3D, Plan og Ude; plantegning og oversigt indrammer også udemiljøet. Husets rumkoordinater er uændrede.

## Vejr

Hjem henter en femdøgnsprognose og seks kommende timer fra Open-Meteo for Hørning (samme område som solberegningen). Der kræves ingen konto eller nøgle. Temperaturen vises i °C, vind i m/s, og datoer følger Europe/Copenhagen. API'et leverer WMO-koder, som omsættes til danske beskrivelser og ikoner, også sne og torden.

Der hentes normalt højst én ny prognose pr. ti minutter på den enkelte skærm. Netværksfejl bruger en tydeligt mærket seneste prognose i højst 24 timer. Uden gyldige data vises en fejl og Prøv igen; der indsættes ingen eksempeltemperatur. Open-Meteo krediteres og linkes i den udvidede vejrvisning.

## Google Kalender

1. Aktivér Google Calendar API i et Google Cloud-projekt.
2. Opret OAuth-appens navn og kontaktoplysninger i Google Auth Platform. Brug External / Testing til den private opsætning, og tilføj den konto, som skal logge ind, under testbrugere.
3. Tilføj læseadgangene `https://www.googleapis.com/auth/calendar.calendarlist.readonly` og `https://www.googleapis.com/auth/calendar.events.readonly` under Data Access.
4. Opret en OAuth-client af typen Web application. JavaScript-origin for GitHub-appen er `https://emilaet.github.io`, uden sti. Google-login bruger et popupvindue; der kræves ingen callback-side eller client secret i appen.
5. Indsæt client-ID'et under Indstillinger → Forbindelser → Google Kalender. Alternativt kan den offentlige GitHub Actions-variabel `GOOGLE_CALENDAR_CLIENT_ID` angive projektets standard ved næste build.
6. Forbind Google-kontoen, vælg de ønskede kalendere og gem valget. Der vælges ikke automatisk en privat kalender ved første login.

Kun valgte kalenderes aftaler hentes. Ingen aftaler oprettes, redigeres eller slettes. Værdier fra Google escapes inden visning. Dansk tidszone bruges både til API-forespørgsler og visning; heldagsaftalers slutdato er eksklusiv, og uger over sommertid kan være 167 eller 169 timer.

Browserlogin har kort levetid, normalt cirka en time. Tokenet opbevares kun i hukommelsen, og en genindlæsning kræver nyt login. Appen åbner ikke uopfordrede loginvinduer. Ved udløb vises sidst kendte aftaler med en tydelig genforbindelsesmulighed. En vægskærm, som skal forny adgang uden brugerhandling, kræver senere en serverforbindelse, fx via husets Home Assistant; en browserapp kan ikke sikkert indeholde en Google client secret.

De valgte kalendere og syv dages normaliserede aftaler kan caches på den enkelte enhed til offlinevisning. Afbryd fjerner denne cache og kalendervalget. Kontoens adgangstoken og aftaler følger ikke med dashboardets backup. Kalenderlister og aftaler hentes via Google Calendar REST API; Google Identity Services håndterer selve kontologin.

## Test og drift

`tests/live-services.test.js` tester normalisering, fejl/caching, sommertid og read-only adgang. Browsertests bruger deterministiske API-svar og en tidligere kalendercache; appens produktion har ingen skjult testtilstand. En særskilt Google-test gennemfører login, eksplicit kalendervalg, visning, genindlæsning og afbrydelse uden at skrive til en kalender.

Rigtige Google-aftaler kan først verificeres efter kontoens ejer har godkendt læseadgangen på sin skærm. CI-fixtures er ikke bevis for en rigtig kontoforbindelse. Kamerabilledet og tømmekalenderen forbliver tydeligt mærkede eksempler; husets fysiske enheder er ikke automatisk forbundet af denne ændring.
