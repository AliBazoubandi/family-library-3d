# 🎨 3D Assets Guide & CC0 Attribution

This directory contains 3D assets for **Family Library**.
The game includes a rich procedural low-poly fallback system that renders cozy, fully interactive 3D models (house, character with waving animation, cozy room with categorized bookshelves, low-poly books, trees, and scenery) out of the box.

If you wish to swap in external CC0 glTF / GLB 3D models, place them in `public/assets/models/` using the filenames listed below. The asset loader will automatically detect and load them.

---

## Recommended Free CC0 Asset Packs

### 1. House & Exterior Environment
- **Source:** Kenney - *City Kit / Furniture Kit / Nature Kit*
- **URL:** [https://kenney.nl/assets](https://kenney.nl/assets)
- **License:** CC0 1.0 Universal (Public Domain)
- **Target File:** `public/assets/models/house.glb`

### 2. Animated Low-Poly Character
- **Source:** Quaternius - *Animated Modular Characters Pack*
  - Includes animations: `Idle`, `Wave`, `Walk`
- **URL:** [https://quaternius.com/packs/animated-characters.html](https://quaternius.com/packs/animated-characters.html)
- **License:** CC0 1.0 Universal (Public Domain)
- **Target Files:**
  - `public/assets/models/character_m.glb` (Male character model)
  - `public/assets/models/character_f.glb` (Female character model)

### 3. Interior Bookshelves & Cozy Furniture
- **Source:** Kenney - *Furniture Kit*
- **URL:** [https://kenney.nl/assets/furniture-kit](https://kenney.nl/assets/furniture-kit)
- **License:** CC0 1.0 Universal (Public Domain)
- **Target Files:**
  - `public/assets/models/shelf.glb` (Bookshelf model)
  - `public/assets/models/room_props.glb` (Armchair, lamp, rugs)

---

## File Structure

```text
public/assets/
├── README.md
└── models/
    ├── house.glb          (optional - falls back to procedural house)
    ├── character_m.glb    (optional - falls back to animated character)
    ├── character_f.glb    (optional - falls back to animated character)
    └── shelf.glb          (optional - falls back to categorized bookshelves)
```

No external files are required to run the project — the built-in procedural low-poly models provide an authentic, warm, and responsive 3D aesthetic immediately.
