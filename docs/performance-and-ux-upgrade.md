# Performance and UX improvements — 12 November 2026

Scope: the approved audit items B1–B4, P1–P7 and U1–U7. Live weather and Google Calendar are deliberately the next task. This change does not create a live connection to either service.

## Changes

| Audit | Implemented behaviour |
| --- | --- |
| B1 | Lost WebGL contexts show a recovery state, refresh the renderer and shadows after restoration, and offer reload if the driver remains unavailable. |
| B2 | Entering furniture editing leaves the exterior, shows the cutaway and focuses the selected item. |
| B3 | Inventory refresh restores search/filter focus, selection and scroll. |
| B4 | Phone presets have independent heights: compact 132 px, standard 244 px and tall 356 px. Labels show full phone width. Desktop dimensions remain separate. |
| P1 | The camera illustration uses a 341 KB WebP instead of the 3.05 MB PNG. The protected build still embeds all application assets before encryption. |
| P2 | Controls paint before asynchronous, staged model creation. Outdoor geometry is built on first exterior entry. Shader preparation uses compileAsync where available. Loading failure offers retry. |
| P3 | Multi-lamp actions append one batch. Versioned checkpoints bound journal replay, with cross-tab compactor locking, coverage for interrupted deletion and a bounded recovery checkpoint. Old journals migrate without changing saved data. |
| P4 | The dashboard grid, canvas and unchanged cards survive unrelated updates. Unchanged snapshots skip updates; clock work pauses in hidden tabs. The renderer schedules frames only for changes, damping, camera travel or charging animation. |
| P5 | Transform/visibility edits reuse furniture objects. Geometry changes rebuild the affected item; retired resources are disposed. Light fixture rebuilds depend on the light layout changing, and furniture material bindings update affected items. |
| P6 | Removed 1,155 superseded CSS declarations, retaining navigation rules. Fonts retain the same families and weights but drop obsolete WOFF fallbacks. |
| P7 | Static responses use asynchronous cached reads, ETag/Last-Modified validation and immutable caching for hashed assets. API responses remain no-store. File writes are coalesced, atomic and awaited before reporting successful API saves. |
| U1 | On phones, room/device controls precede an optional “Vis huset i 3D” panel. Desktop/tablet layout remains unchanged. |
| U2 | Settings → Skærm og dashboard offers an explicit comfort typography option, retained across reload and backup. Compact remains available. |
| U3 | List headers expose “Se alle” with counts; full-list dialogs support direct checkboxes, keyboard access and return focus. A subtle list-edge fade signals overflow. |
| U4 | Full is labelled Ude; Have/Indkørsel remain available and interaction hints distinguish exterior orbit from room picking. |
| U5 | Disconnected music has a concise connection action instead of an empty card player. Logo-based account choice remains. Music dialogs are independent of Home and restore the originating Settings trigger. |
| U6 | Device rooms can collapse, show linked/planned counts and remember expanded rooms. “Gem og næste” advances within the room; the room can be resumed later. Selection and physical testing remain explicit. |
| U7 | Card labels distinguish example, local, shared, partially live and last-known values. Details link to connection settings. Weather/calendar/waste/camera examples remain explicitly labelled. |

## Measurements

The diagnostic measurements use local Chromium with SwiftShader, not the physical wall tablet. They are single samples and include software-rendering variance. Raw evidence and screenshots are in `/workspace/artifacts/app-upgrade-2026-11-12/` for this work session.

- Rooms first-contentful paint: approximately 6.42 s before, 0.65 s after. Model creation continues after controls appear.
- Largest Rooms main-thread task: approximately 5.43 s before, 2.11 s after. Software shader/first-draw work is still material; actual tablet measurement remains necessary.
- Idle viewer: zero draws and zero animation callbacks over the three-second sample, versus zero draws but 86–120 callbacks previously.
- All-lights action with 2,000 historical operations: approximately 276 ms before, 33 ms after; one journal write rather than 30.
- Protected page: 10.91 MB → 3.38 MB raw; 5.91 MB → 1.82 MB gzip (about 69% smaller). Embedded fonts: 261 KB → 114 KB of base64.
- Production CSS: approximately 252 KB before, 230 KB after (uncompressed).

The single-file privacy boundary is retained. Normal builds can split execution modules; the protected build embeds code and images, so deferred scene execution does not mean deferred download.

## Validation

Regression coverage includes graphics loss/restoration, editing from outside, mobile controls without model initialization, independent phone sizing, stable unrelated cards, full-list interactions and focus, Settings music context, room setup progression, cross-tab search focus, comfort density, journal concurrency/failure/restart and HTTP caching/durability. Existing application, integration and encrypted-preview tests are also run before release.

Web Locks serialize compaction across browser tabs. Browsers without Web Locks retain the immutable journal rather than risking unsafe cross-tab deletion. Saves still work there.
