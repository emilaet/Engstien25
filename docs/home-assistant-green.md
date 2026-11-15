# Green, Apple TV og Engstien — praktisk opsætning

Planen tager udgangspunkt i Home Assistant Green og Apple TV 4K, 3. generation, **128 GB / Wi-Fi + Ethernet**, med Matter over Thread. Enheder tilføjes og afprøves enkeltvis. Der kræves ikke en færdig liste over mærker på forhånd.

| Del | Opgave |
| --- | --- |
| Home Assistant på Green | Tilføjer Matter-enheder, læser deres tilstand og styrer dem. |
| Apple TV | Apple Hjem-hub og Thread-borderrouter, som forbinder Thread-enheder med hjemmenetværket. |
| Engstien | Viser huset og knytter hver HA-enhed til et rum, en lampe, en varmezone eller et gardin. |

Apple TV-modellen har Thread. Green behøver derfor ikke en ekstra Thread-radio til denne opsætning. Thread-logoet alene er ikke nok: vælg enheder med **Matter over Thread**, når de skal følge denne fremgangsmåde. Matter over Wi-Fi kan også tilføjes i HA, men bruger ikke Thread.

## 1. Gør netværket klar

1. Tilslut Green til routeren med netværkskabel og strøm.
2. Tilslut gerne også Apple TV med netværkskabel. Green, Apple TV og iPhone skal bruge samme hjemmenetværk, ikke et isoleret gæstenet.
3. Behold lokal IPv6 og multicast/mDNS aktiveret. En IPv6-internetforbindelse er ikke nødvendig. Undlad særskilte VLAN eller netværksisolering under den første opsætning.
4. Opdater iPhone, Apple TV og Home Assistant. Hav Bluetooth slået til og giv HA-appen adgang til lokalt netværk og de tilladelser, Matter-opsætningen beder om.

## 2. Start Green og Apple Hjem

1. På hjemmenetværket åbnes `http://homeassistant.local:8123`. Opret HA-ejerkontoen og vælg **Europe/Copenhagen** som tidszone. Hvis navnet ikke virker, findes Greens IP-adresse i routerens enhedsliste.
2. Installer **Home Assistant Companion** på iPhone og forbind den til Green. Det er denne app, der bruger telefonens kamera og Bluetooth til Matter-parring.
3. Konfigurér Apple TV med den Apple-konto, der bruges i Apple Hjem, og vælg hjem/rum i Apple TV's indstillinger. Kontrollér i **Hjem → Hjemindstillinger → Hjemmehubs og broer**, at Apple TV er tilsluttet.
4. Opret de samme rumnavne i HA som i Engstien. Det gør forslag til koblinger lettere at genkende.

## 3. Slå Matter til i Home Assistant

I HA vælges **Indstillinger → Enheder og tjenester → Tilføj integration → Matter**. Brug den officielle Matter Server-app, som HA tilbyder at installere på Green. I nyere HA-versioner findes Matter-opsætningen også under **Indstillinger → Connectivity/Forbindelser → Matter**.

Apple TV er Thread-borderrouteren. Der skal ikke samtidig oprettes et nyt HA-Thread-netværk eller installeres OpenThread Border Router for denne plan. HA's **Apple TV-integration** er til medieafspilning og fjernbetjening; den importerer ikke hele Apple Hjem-installationen.

## 4. Tilføj den første enhed

**Ny Matter-enhed:**

1. Sæt enheden i parringstilstand, og stå tæt på den med iPhone.
2. I **Home Assistant Companion** åbnes **Indstillinger → Matter → Tilføj enhed**. Matter findes i nogle versioner under Connectivity/Forbindelser eller via Enheder og tjenester.
3. Vælg **Nej, den er ny**, og scan enhedens Matter-QR-kode.
4. Følg iPhones opsætning og vælg **Føj til Home Assistant**.
5. Giv enheden et tydeligt navn, fx **Stue · Loft**, og vælg rummet **Stue**.
6. Afprøv enheden i HA, før den kobles til huset i Engstien.

**Enhed, der allerede er i Apple Hjem:** Vælg **Ja, den er allerede i brug → Apple Hjem** i HA's tilføjelsesforløb, og følg delingen/parringstilstanden derfra. Det tilføjer HA som endnu en Matter-controller; enheden kan blive i Apple Hjem. Brug den delingskode, forløbet giver, hvis der efterspørges en ny kode. Enheder skal ikke nulstilles som standard.

Gem den oprindelige Matter-kode med en genkendelig beskrivelse af enheden. Den er nyttig ved senere geninstallation.

## 5. Kobl enheden til Engstien

Green-appen tilsluttes automatisk den lokale HA. Når enheden er parret i HA:

1. Åbn **Engstien → ⋯ → Indstillinger → Rum og enheder** på en computer.
2. Vælg **Tilføj fra Home Assistant**. Vælg enheden og rummet. Under Visning i rummet vælges enten **Brug Loftslys** eller **Ny enhed i rummet**.
3. Under **Kobling til Home Assistant** vælges den enhed, der netop blev tilføjet. Navn, rum og teknisk ID hjælper med at genkende den.
4. Gem og afprøv den ene enhed. Gentag for næste enhed, når det passer.

Valg og gemning betjener ikke enheden i sig selv. En almindelig kontakt får ikke en opdigtet dæmper; mulighederne afhænger af, hvad HA rapporterer. Eksisterende modelobjekter har faste placeringer. En ny, koblet katalogpost vises automatisk i det valgte rum. Den opretter ikke automatisk et nyt objekt i 3D-modellen. Eksisterende modellerede funktioner kan vælges i tilføjelsesforløbet, så de ikke dubleres.

## Det, der allerede er klar i projektet

- Enhedsplan med rum, typer og individuelle koblinger. Intet kræver, at alle husets enheder tilføjes samtidig.
- En lokal Node-dashboardserver med HA-forbindelse, tilstandsvisning og validerede kommandoer til lys, varme, gardiner og relevante kontakter.
- Backup/indlæsning af opsætning og separat mobilopstilling. Eksportér en backup fra GitHub-udgaven før flytning til en ny serveradresse; opsætninger fra forskellige adresser flettes ikke automatisk.
- En modtager til Apple Noter-eksport fra en iPhone-genvej. Det er ikke automatisk eller tovejs Notes-synkronisering endnu.

## Installér Engstien på Green

Green-pakken findes nu i mappen [engstien](../engstien/DOCS.md). Tilføj `https://github.com/emilaet/Engstien25` under HA's appbutik → Repositories. Når GitHub-versionen er udgivet, vælges Engstien 25 → Installér → Start → Åbn webgrænseflade.

GitHub bygger og tester programmet og udgiver en versionsbestemt pakke med kontrolsum. Green downloader den og samler sin runtime automatisk. Der køres ingen npm-installation eller frontendbygning på Green. Det kræver ingen privat container-registry eller ekstra konto.

Appen åbnes via Home Assistants ingress. Første version kræver en HA-administrator; der er ingen ekstra åben port, manuel HA-token eller separat dashboard-adgangskode. Et midlertidigt ingress-link er ikke en varig selvstændig PWA-adresse. Åbn gennem HA's normale adresse eller Companion.

Under **Rum og enheder → Tilføj fra Home Assistant** kan du vælge en ny HA-enhed og dens rum. Brug enten en eksisterende modelfunktion eller tilføj en ekstra kontrol. Ekstra lys, varme, gardiner og kontakter kan betjenes i rummet; andre typer viser rapporteret status. Gemning sender ingen kommandoer. Ved manglende forbindelse låses kontrollen.

Opdateringer bevarer `/data`, hvor opsætning, koblinger og lister ligger. HA-backup medtager mappen; pakken stoppes før backup og skriver ventende ændringer færdigt. Efter installation af en ny version viser åbne skærme **Ny version klar**. Genindlæsning er låst under aktive dialoger, dashboardredigering, ventende gemning og enhedskommandoer.

GitHub Pages er fortsat den separate forhåndsvisning. Den søger ikke efter Thread-enheder og får ingen Supervisor-nøgle. Flyt en ønsket opstilling med **Hent backup / Indlæs backup**; data fra forskellige adresser flettes ikke automatisk.

Den fysiske installation og enhedernes respons skal stadig afprøves på din Green. Softwaren kan testes med en simuleret HA og den rigtige server/container før det.

## Apple Hjem, Notes og øvrige widgets

- **Apple Hjem/Siri:** Matter-enheder kan deles mellem HA og Apple Hjem. **HomeKit Bridge** kan alternativt eksportere udvalgte HA-enheder til Apple Hjem. Brug én af vejene for samme enhed, så den ikke vises dobbelt.
- **HomeKit-only:** Det er et andet parringsforløb end Matter. **HomeKit Device** importerer til HA; **HomeKit Bridge** eksporterer fra HA til Apple Hjem.
- **Apple Noter:** Green og Apple TV opretter ikke i sig selv en Notes-forbindelse. Først færdiggøres en iPhone-genvej til den eksisterende modtager og afprøves manuelt. Mulige automatiseringer afprøves bagefter; der loves ikke liveændringer eller bevarede Apple-tjekbokse uden verifikation. Se [Notes-vejledningen](apple-notes.md).
- **Tesla og OK-ladeboks:** Tilføjes særskilt i HA. Matter til lys gør dem ikke automatisk tilgængelige. API-adgang og eventuelle forbrugspriser skal afklares før aktivering; gratis drift kan ikke garanteres for bilproducentens API.
- **Kamera og musik:** Katalogkoblinger findes, men widgetterne mangler stadig den faktiske kamera-/afspillerforbindelse. En valgt katalogpost aktiverer ikke kamerastream eller musikstyring automatisk.
- **Vejr og elpriser:** De nuværende datakilder kan fortsat bruges. Tømmekalenderens faktiske Renosyd-data og Google-login kræver deres særskilte opsætning.
- **Adgang uden for hjemmet:** Lokal Matter-styring kræver ikke et betalt HA Cloud-abonnement. Fjernadgang til Engstien/HA skal vælges og opsættes særskilt; Apple TV's Apple Hjem-fjernadgang giver ikke automatisk adgang til Engstien. En privat VPN kan være en mulighed uden fast abonnement. Del ikke HA-porten direkte på internettet.

## Officielle kilder

- [Home Assistant: Matter](https://www.home-assistant.io/integrations/matter/)
- [Home Assistant: Thread og Apple TV-modeller](https://www.home-assistant.io/integrations/thread/)
- [Home Assistant: HomeKit Bridge](https://www.home-assistant.io/integrations/homekit/)
- [Home Assistant: HomeKit Device](https://www.home-assistant.io/integrations/homekit_controller/)
- [Home Assistant: Apple TV](https://www.home-assistant.io/integrations/apple_tv/)
- [Home Assistant: Tesla Fleet](https://www.home-assistant.io/integrations/tesla_fleet/)
