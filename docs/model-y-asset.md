# Model Y-præsentationsmodel

Den håndbyggede bil er erstattet af en licenseret GLB. Kilden hedder **Tesla Model Y 2021**, fra samme oprindelige generation som den ønskede 2023-bil. Modellen er ikke den præcise 2023-fil fra brugerens Sketchfab-link; det link kunne ikke hentes fra arbejdsmiljøets netværk. Modellen er en visuel gengivelse, ikke en verificeret variant-/reservedelsmodel.

Kilde, forfatter, CC BY 4.0 og tilpasninger står i [licensfilen](../src/assets/tesla-model-y.LICENSE.txt) og under **Indstillinger → Skærm og dashboard → Krediteringer**. Den oprindelige fil kommer fra `Tina2088/tina-3d-tesla`, commit `5f81eea9d6ed050389958b6aad82be8e589adcc9`, `public/models/model-y.glb`.

Originalen fylder 18.451.072 bytes, med 727.651 trekanter og 397 dele. Appens fil fylder cirka 637 KiB, har 139.338 trekanter og 14 samlede materialedele. Karrosseri og glas beholder deres oprindelige geometri; skjulte kabinedele fjernes, og øvrige dele forenkles. Meshopt-komprimering og kvantisering reducerer downloadstørrelsen. En visuel kontrol i browseren sammenlignede den optimerede bil med originalen fra begge sider.

Bilen har hvid lak og sorte fælge, vender med fronten mod vejen og justeres efter de faktiske dæks nederste punkt, så den står på carportens fliser. Ladeporten findes med en stråle mod karrosseriet ved venstre baghjørne. Bil, stik og ladekabel deler én visningsgruppe, som skjules før kameraturen til Billader og vises igen i husets øvrige views.

GLB og Meshopt-dekoder indlejres i den krypterede HTML-app. Der bruges ingen eksterne model-, WASM- eller teksturservere ved afspilning.

For at reproducere optimeringen med separate udviklerværktøjer:

```sh
npm install --prefix /tmp/model-y-tools --no-audit --no-fund @gltf-transform/core@4.5.1 @gltf-transform/functions@4.5.1 @gltf-transform/extensions@4.5.1 meshoptimizer@1.3.0
node scripts/optimize-model-y.mjs /path/to/original.glb src/assets/tesla-model-y.glb
```

`MODEL_Y_TOOLS` kan angive en anden værktøjsmappe. Appens `package.json` og lockfil behøver ikke ændres. Der indgår ingen værktøjspakker i runtime.
