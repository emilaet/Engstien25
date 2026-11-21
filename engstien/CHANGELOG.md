# 0.3.2

- Robotternes kameraovergange bliver i den samme interaktive 3D-scene som huset og Billader; de statiske produktbilleder er fjernet.
- Begge visninger kan roteres med mus og finger, zoomes med knibebevægelse og nulstilles. Kameravinkler holder sig foran den faktiske væg.
- Ombyggede sorte Qrevo- og grå Yuka-modeller med afrundede former, profilerede overflader, kameraer, hjul og stationsdetaljer samt lokal belysning og skygger.
- Baggrunden er husets eksisterende vægge, gulve og have. Støvsugeren står i stue/alrum; plæneklipperen står på græs ved skuret med fronten væk fra indkørslen.
- Nye browserkontroller af musetræk, fingertræk, knibezoom og fortsat 3D efter kameraovergangen.

# 0.3.1

- Navigationen reserverer plads til brand, menu og bundtekst, også på lave skærme. Fulde robotnavne og aktiv markering holder sig inden for menuen.
- Fotorealistiske nærbilleder af sort Qrevo 5AE og grå Yuka Mini 2, baseret på brugerens produktreferencer. Hele produktet vises uden beskæring.
- Separate valg af Nærbillede, 3D og Kort; kameraovergange bevares, og 3D bruges som fallback ved billedfejl.
- Roligere sider før tilslutning, uden tomme statistik- og zonesektioner eller en falsk nulprocent-bjælke.
- Tydelig lokal besked ved mislykkede kommandoer, korrekt håndtering af ukendte valg og utilgængelige zoner samt bevaret fokus efter betjening.
- Indstillingers åbne tilstand huskes separat for hver robot; grønne handlingsknapper har læsbar tekstkontrast i begge temaer.

# 0.3.0

- Egne sider til sort Roborock Qrevo 5AE og Mammotion Yuka Mini 2 med flydende kameraovergange til stationerne i huset.
- Tilpassede mobilvisninger, kortfane og fem menupunkter med tydelige trykflader.
- Start, pause, hjem, rumsvalg og stationsindstillinger via faktiske Roborock-entiteter i Home Assistant.
- Klippezoner, gemte Mammotion-opgaver og indstillinger efter den konkrete enheds muligheder.
- Batteri, status, areal, varighed og vedligeholdelse fra HA; ingen opdigtede robotdata før tilslutning.
- Autentificeret billedproxy til kort og validerede kommandoer med forbindelses- og revisionskontrol.
- Opsætningsvejledning og tydelig afgrænsning af producentapp- og community-funktioner i docs/robot-devices-plan.md.

# 0.2.1

- Udvidede fliser ved spisepladsen og loungen efter det godkendte haveforslag.
- Den vinklede plantekasse står på græs helt langs flisernes hjørne; plantekassen ved carporten er fjernet.
- Stor hængeparasol, hynder, plaid, borddetaljer og to lanterner med diskret aftenglød.
- Fjernet det ekstra panel med bredde, højde og flyttepile. Vis/skjul, direkte tilpasning og gemte mobil-/iPad-opstillinger bevares.

# 0.2.0

- Første Green-pakke med Home Assistant-login via ingress og automatisk lokal HA-forbindelse.
- Tilføj HA-enheder enkeltvis til et rum eller en eksisterende funktion.
- Ekstra lys, varmezoner, gardiner og kontakter vises i rummene; andre enheder viser rapporteret status.
- Versionsbesked ved opdatering. Data og enhedskoblinger gemmes i appens vedvarende datamappe.
