# Reference implementation · 30 October 2026

Approved sources: six original design HTML/PNG files in /workspace/design-previews/engstien25-2026-10-29.

- [x] Transfer the reference layout, spacing, typography and day/night tokens to the functional pages.
- [x] Default Hjem: five main cards; preserve configurable optional widgets and saved custom layouts.
- [x] iPad landscape first; deliberate tablet portrait, mobile and desktop layouts without overflow.
- [x] Room accordions, per-device controls, furniture editing and references remain functional.
- [x] Charger: hero, separated Tesla/OK measurements, realistic black casing/timber and animated camera flight.
- [x] Hide every unmounted fixture; preserve source positions, independent dimming and light output.
- [x] Improve physical model presentation without moving original walls, openings, shed or charger.
- [x] Compare actual app captures with all six references; run structural, state, browser and encrypted preview checks.

## Verification

- 57 unit/integration checks passed.
- Production build passed.
- 41 browser cases passed across the complete run (38) and the focused rerun (3) after adapting menu access in the tests. No production code changed after the screenshots.
- 2 encrypted-preview cases passed: successful unlock and WebGL without external assets, incorrect/missing password stays locked.
- Six actual 2400 × 1500 captures compared with the six original references; downloadable package contains separate images and an offline comparison page.
- Tested layouts include 1600 × 1000, 1366 × 1024, 1194 × 834, 1024 × 768, 834 × 1194, and 390 × 844.

## Visual scope

The reference layout, card proportions, typography and semantic day/night palette are transferred to the functional app. The live model retains the original architecture and charger anchor. Its procedural geometry, materials and real-time illumination remain visibly simpler than the generated concept renders; it is not a pixel-identical photorealistic reconstruction. The comparison package shows this distinction explicitly.

Reference/app comparison: https://raw.githubusercontent.com/emilaet/Engstien25/design-renderinger/downloads/Engstien25-reference-og-app.zip
