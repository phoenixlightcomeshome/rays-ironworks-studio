# Export note — ai-studio-app/2026-11-22-1250

- Source: "Remix Ray's Ironworks" AI Studio app (id 4bebf0ef-2701-4baf-b85e-1d7128f9d1f1), Ray's account.
- Exported: Nov 22, 2026 ~12:50 PM PST (browser task 7b5897b4).
- Zip: 16,939,441 bytes, md5 e889b8d86ada2df488bd3e938f00c2f8, 79 files (the "96 files" figure in the export record counts the zip's 17 directory entries too).
- Backup: ~/workspace/backups/phoenix-ironworks-remix-2026-11-22-1250.zip; Drive file 1Kbt5shrYaJTs3Q8F-44LuYC4OA98_odb (Ray's "Google AI Studio" folder, shared with phoenixlightcomeshome@gmail.com as Editor).
- This export is the CURRENT code including the Design Studio start-empty change (Nov 22 ~12:12, browser task 78677b95):
  - `src/types/configurator.ts` — `hasPiece` on ConfiguratorState, `INITIAL_CONFIG` has `hasPiece: false`, `SAMPLE_GATE_CONFIG` (the old default 10 ft × 6 ft gate).
  - `src/components/DesignStudio3D.tsx` — "Load sample gate" + "Empty space" buttons, empty-state messaging.
  - `src/utils/blueprintRenderer.ts` — `drawEmptyBlueprint2D` + empty-state check in `drawBlueprint`.
  - `src/three/IronworksScene.ts` — tracks `hasPiece` in update.
  - `src/utils/cutShare.ts` — decoded cut-share configs set `hasPiece: true`.
  - State lifted in App.tsx; empty state survives leaving/returning to the page.
- The 6 `.aistudio` temp-media files are included in this zip as exported (no restore needed).
- Diff vs ai-studio-app/2026-11-22-0150: the 5 files above changed; everything else identical.
- Purpose: source for the new Base44 app in Phoenix's workspace ("Phoenixlightcomeshome's Workspace"), since the Ray-account AI Studio builder hit its daily limit. The AI Studio copy (4bebf0ef) remains the working original; this folder is its snapshot as of 12:50 PM Nov 22, 2026.
- Nothing in the existing folders (2026-11-22-0150, 2026-11-21-0106, 2026-11-20-2133) or the root site files was touched by this export.
