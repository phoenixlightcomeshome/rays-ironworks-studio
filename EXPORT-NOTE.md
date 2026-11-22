# Ray's Ironworks — AI Studio Export 2026-11-22-0150

Exported from AI Studio app `4bebf0ef-2701-4baf-b85e-1d7128f9d1f1` ("Remix Ray's Ironworks", Ray's account) on **Nov 22, 2026 ~01:50 PST** — full "Download code" ZIP export, 16,910,365 bytes (md5 `7e2e0d2c181f9b51c8136721f56d61e2`).

Gemini (AI Studio, Gemini 4 Hydrogen) called the export **"complete and current"**; Marlow verified it independently by grep — all features below are present in the code in this folder.

## What's in this export (current applied code)

- **The six Design Studio additions** (landed Nov 21 ~23:58 PST): Post Style 13 options (Square/Round/Ornate + I-Beam, W-Beam, Rectangle tube, Octagon, Triangle, Angle Iron, Channel post, HSS, C-Channel, Custom); Finials 14 (4 classic + 10 King Architectural caps); Scrollwork 14; Infill 19 (incl. Interweave, Intercrimp, Perforated ×4, Expanded metal ×2, Bar grating, Louvered slats); Leaf Section 9 King Architectural Ornamental Steels + 6 IMS; Picket Size 11, Picket Design 13.
- **Material Cut List tab** (7th tab): "MATERIAL CUT LIST & ASSEMBLY SCHEMATIC" — exploded callout schematic (tags A–H), itemized cut table, Schematic PNG / Cut List PDF / Export CSV.
- **Design Studio on its own page** (landed Nov 22 ~00:22 PST): dedicated "3D DESIGN STUDIO, BLUEPRINTS & MATERIAL CUT LIST" page with nav item, launch card, hero link; configurator state + active tab lifted into App.tsx so selections stick across page changes.
- **Photo-upload-to-3D** (landed Nov 22 ~00:57 PST): "Upload a photo" in the 3D VIEW tab renders the photo as a 160×160-segment luminance relief model (`src/utils/photoRelief.ts`, 161×161 cached luminance grid), photo as texture, Relief depth slider, drag-and-drop; labeled "UPLOADED PHOTO — 3D INTERPRETATION" with the "not a true scan; the back side is not captured" disclosure.
- **3D → 2D + Isometric sync** (landed Nov 22 ~01:23 PST): the uploaded model shows in all three views at once from the single lifted `uploadedPhoto` state in App.tsx — 2D BLUEPRINT as a full uncropped elevation with hillshade relief ("UPLOADED PHOTO — 2D ELEVATION"), ISOMETRIC as a 30° relief block with the photo texture ("UPLOADED PHOTO — ISOMETRIC VIEW"). Relief depth slider drives all three. Removing the photo restores the configured piece in all three views.
- **Touch dimensioning** (landed Nov 22 ~01:23 PST, 2D BLUEPRINT only, photo active): "Add dimension", "Set scale" / "Re-calibrate scale", "Clear scale", "Delete all". Tap to place, drag handles to move, × to delete; pointer events with pointer capture, touch-manipulation canvas so pinch-zoom/scroll still work; mouse click/drag works too. Dimensions stored in normalized [0..1] photo coordinates, survive leaving the page; cleared on remove/new photo. Calibration: tap two points on a known feature, enter its length (inches/feet, optional label) — before calibration dimensions show % of photo width so no fake real-world number is shown.
- **Round 2 tabs + credit lines** from the 2026-11-21-0106 export, unchanged: free drawing, picket accents, Sign Lettering, Technical Drawing, Isometric Blueprint View; gold "Contributions by Skis Welding and Fabrication" (S-K-I-S) + "designed and implemented by Phoenix the great muse"; approved Beverly Hills railing photo.

## What's NOT in this export

- No Gemini API key is in this export (AI Studio injects it at runtime). `.env.example` is a placeholder only.
- The `.aistudio/artifacts/brain/567f24a2-.../.tempmediaStorage/` files are AI Studio session temp media carried over in the ZIP, kept as-is to match the previous export.

## How this folder got here

Full ZIP downloaded from the AI Studio app in Ray's account (browser task 153caaba, Nov 22 ~01:50 PST), verified by Marlow, pushed to the repo from the terminal. Previous exports untouched: `ai-studio-app/2026-11-21-0106` (Round 2 only) and `ai-studio-app/2026-11-20-2133` (pre-Round-2). This is the folder the new Base44 version is to be built from.
