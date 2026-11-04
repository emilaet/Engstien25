# Direkte dashboardredigering

Redigeringen bygger på den placering, brugeren ser, i stedet for kun at ændre rækkefølgen på en liste. Visning, redigering, gemning og genindlæsning bruger samme grid og kollisionsberegning i `src/dashboard-grid.js`.

- Flytning har sit eget håndtag; kanter og hjørne ændrer størrelse. Kortets oprindelige grebspunkt bevares, så det ikke springer ved første bevægelse.
- Et træk begynder efter 6 pixels, så et tryk ikke flytter kortet. Pointer capture understøtter både mus og berøring. Den virkelige widget løftes; husets WebGL-canvas kopieres ikke.
- En pladsholder med en synlig “Slip her”-markør viser den gemte placering. Alle fire retninger og tomme områder understøttes. Magnetisk justering nær eksisterende rækkekanter gør vandret flytning mindre følsom for små håndbevægelser.
- Det valgte kort beholder sin målposition. Lige store pladser kan byttes; øvrige berørte kort flyttes ned til næste ledige plads. Beregningen starter fra tilstanden før trækket, så naboer ikke vandrer længere væk for hver pointerbevægelse.
- Automatisk rulning virker både op og ned. Ugyldige slip uden for dashboardet, Escape, pointercancel og mistet pointer capture gendanner udgangspunktet. Et afsluttet træk er én fortrydelse.
- Piletaster på flyttehåndtaget samt klikbare pile i Widgets giver alternativer til at trække. Tab-rækkefølgen følger den visuelle læserækkefølge efter et slip. Telefon bruger én kolonne og bevarer en uafhængig rækkefølge, når brugeren flytter kort på mobil.

Gamle layouts får en automatisk placering, der svarer til det tidligere grid. Nye placeringer gemmes som `column` og `row` sammen med de eksisterende mål i v3-lageret. `mobileOrder` gemmer mobilrækkefølgen, og `mobileHeightPx` gemmer en selvstændig mobilhøjde. Det vedvarende layout ændres først ved Gem dashboard. Ændrede udkast og historik gemmes særskilt i sessionStorage for at kunne gendannes i samme fane.

Geometritestene kontrollerer retninger, kantgrænser, bytning, kollisioner, tomme områder og gentagne vilkårlige flytninger/størrelsesændringer. Browsertestene kontrollerer selve kortets bevægelse under trækket, pladsholderen, gemning/genindlæsning, berøring opad/til venstre, automatisk rulning opad, fortrydelse, afbrydelse, tastatur, klikbare pile og mobilrækkefølge. Den responsive matrix og de eksisterende 3D-/familietest bevares.

Interaktionen følger principperne i W3C’s [Dragging Movements, SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html): flytning kan også udføres med enkelte klik på pile. Håndtagenes berøringsmål er 44 × 44 CSS-pixels, som beskrevet i [Target Size (Enhanced), SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). Kildeteksterne er verificeret i W3C’s officielle `w3c/wcag`-repository.

Ved mobilflytning bestemmer markørens placering landingsstedet, uafhængigt af kortets højde; klik på op/ned flytter præcis én plads, også mellem kort med forskellige højder. Geometrien for desktop, tablet og telefon beregnes sammen. CSS skifter direkte mellem disse projektioner ved et skærmskift, så gamle desktopceller ikke vises som flere kolonner på en smal telefon, mens DOM-rækkefølgen opdateres.

Editorens lave linje bruger nu headerområdet. Den bevarer udkastet ved intern navigation; Annuller/Escape forkaster det. Se [UX-opdateringen](ux-upgrade.md).

Redigering åbnes via **••• → Rediger dashboard**. Den separate genvej ved siden af menuen er fjernet. **Nyt hverdagsblik** og dagsblikvalg ligger nu i **Indstillinger → Skærm og dashboard**; et eksisterende layoutudkast bevares ved navigation.
