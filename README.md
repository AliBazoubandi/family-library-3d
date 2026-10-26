# 📚 Family Library (3D & 2D Web Application)

A modern personal and family library application built with **Three.js + Vanilla JS (ES Modules) + Vite** on the frontend, and **PocketBase** as the lightweight backend.

Featuring a rich **3D neighborhood avenue**, interactive **car driving** between houses, **resident doorstep greetings**, an indoor **3D cozy reading room** with **realistic dual-hand book reading animation & warm page illumination**, and a **2D searchable catalog table**.

---

## 🚀 Quick Start: How to Run the Project

### Option 1: Double-Click Batch File (Recommended for Windows)

Simply double-click or run:
```cmd
start.bat
```
*(Or in PowerShell: `.\start.ps1`)*

**What `start.bat` does automatically:**
1. ✅ Checks for Node.js (and installs packages via `npm install` if `node_modules` is missing).
2. ✅ Verifies `pocketbase.exe` (and automatically downloads it if not present).
3. ✅ Applies all database migrations (`pocketbase.exe migrate up`).
4. ✅ Starts the PocketBase backend server on `http://127.0.0.1:8090/`.
5. ✅ Starts the Vite frontend dev server on `http://localhost:5173/`.
6. ✅ Automatically opens `http://localhost:5173/` in your default web browser.

To stop all services cleanly at any time, run:
```cmd
stop.bat
```

---

### Option 2: Run with Docker & Docker Compose (Any OS)

You can build and run the entire application (frontend build + PocketBase server) in a single lightweight Docker container:

```bash
# Build image and start container in the background
docker compose up --build -d
```

- **Web App & API:** [http://localhost:8090/](http://localhost:8090/)
- **PocketBase Admin Dashboard:** [http://localhost:8090/_/](http://localhost:8090/_/)

To stop the container:
```bash
docker compose down
```

*(Database data and uploads are automatically preserved in the named Docker volume `family_library_data` across container restarts).*

---

### Option 3: Manual Terminal Commands

If you prefer running manual commands in two terminal tabs:

**Terminal 1 (PocketBase Backend):**
```bash
# Apply migrations
.\pocketbase.exe migrate up

# Start server
.\pocketbase.exe serve --http="127.0.0.1:8090"
```

**Terminal 2 (Frontend Dev Server):**
```bash
npm install
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## 🔑 Demo User Accounts

| Character / Name | Role | Email | Password |
|---|---|---|---|
| **Ali** (Owner) | Library Admin / Owner | `owner@library.local` | `Password123456!` |
| **Sara** (Family) | Family Member | `sara@library.local` | `Password123456!` |
| **Reza** (Family) | Family Member | `reza@library.local` | `Password123456!` |
| **PB Superuser** | Database Administrator | `admin@library.local` | `Password123456!` |

> **Tip:** You can switch between characters anytime using the top-right profile avatar bar, or click **"Quick Demo Login"** on the sign-in modal.

---

## 🎮 Key Features & 3D Gameplay Mechanics

### 1. 🏡 Multi-User Neighborhood Avenue (Street Scene)
- **Personalized Houses:** Ali, Sara, and Reza each have their own house along the cobblestone avenue, featuring custom exterior colors, rooftop chimneys, porches, front yards, and 3D floating title signs.
- **Atmospheric Sky & Scenery:**
  - 23-peak snow-capped alpine mountain range lining the horizon.
  - Radiant 3D Sun with corona rays and camera-facing tracking.
  - Low-poly drifting clouds with real-time shadow casting.
  - Animated soaring birds gracefully flapping their wings across the sky.
  - Streetlamps, wooden benches, fire hydrants, fences, and sidewalk trees.

### 2. 🚗 Interactive Sedan Car & Aerial Camera Follow
- Click on any family member's face in the top-right bar (or click their house).
- The resident steps outside, enters the car, and smoothly drives along the avenue to the target destination.
- During travel, the camera automatically switches to an **elevated aerial cinematic perspective** following the car.
- The car pulls smoothly up to the curb directly in front of the destination house.

### 3. 👋 Resident Doorstep Greeting Sequence
- Clicking on a house triggers the greeting sequence:
  - The camera glides up to the front porch.
  - The front door swings open on realistic hinges.
  - The resident character walks out onto the porch, waves hello with a waving hand animation, and displays a friendly dialogue speech bubble before welcoming you inside.

### 4. 🛋️ 3D Interior Cozy Library Room
- Custom wallpaper, hardwood flooring, fireplace/shelf decor, chandelier, circular rug, and indoor plants.
- **Dynamic Bookshelves:** Each book category in PocketBase dynamically generates its own dedicated 3D wooden shelf loaded with colorful books and a 3D category label.
- **Obstacle Collision Avoidance:** Left-click anywhere on the floor to navigate your character smoothly around furniture to that spot.
- **Realistic Dual-Hand Book Reading Animation:**
  - Clicking on any shelf prompts your character to pick up a book and turn toward the camera.
  - The book rests naturally between both hands with dual covers hinged open and facing upward toward the reader's face.
  - An emission light from the pages illuminates the character's face with a warm radiant reading glow.

### 5. 📖 Interactive Shelf Overlay & 2D Catalog
- Zooming into any shelf opens a frosted glassmorphic card deck.
- Shows book title, author, cover art, tags, and availability status (*Available* / *Lent to [Name]*).
- Quick actions: **Lend Book**, **Return Book**, **Edit**, **Delete**, and **Add Book to Shelf**.
- Toggle between **3D Mode** and the complete **2D Table Catalog** anytime via the navigation bar.

---

## 📂 Project Architecture

```
├── .dockerignore              # Docker build context exclusions
├── .gitignore                 # Git ignore configuration
├── Dockerfile                 # Multi-stage production container build
├── docker-compose.yml         # Container orchestration configuration
├── index.html                 # Main SPA entrypoint
├── package.json               # Node.js dependencies and scripts
├── start.bat                  # Windows batch launcher (with auto-checks)
├── start.ps1                  # PowerShell launcher script
├── stop.bat                   # Service shutdown script
├── vite.config.js             # Vite build & proxy configuration
├── pb_migrations/             # PocketBase migration scripts
│   ├── 1710000001_init_schema.js
│   ├── 1710000002_seed_data.js
│   ├── 1710000003_add_autodate.js
│   ├── 1710000004_allow_family_view.js
│   └── 1793001785_updated_users.js
├── public/
│   └── assets/models/         # 3D glTF/GLB models (Kenney/Poly.pizza CC0)
└── src/
    ├── api/                   # PocketBase client & OpenLibrary integration
    ├── scenes/                # Three.js 3D scenes (street, room, navigation, assets)
    │   ├── assetLoader.js     # GLTF model loader with fallback procedural meshes
    │   ├── helpers.js         # Camera controllers, lighting, and book-reading rig
    │   ├── houseFront.js      # Porch greeting sequence and door opening
    │   ├── inside.js          # Indoor room, dynamic shelves, and book interactions
    │   ├── navigation.js      # A* raycast point-and-click walking
    │   ├── procedural.js      # Fallback procedural 3D geometries
    │   ├── sceneManager.js    # Exterior/interior scene transitions & sky
    │   └── street.js          # Neighborhood avenue, houses, car driving, mountains
    ├── styles/                # Modern glassmorphism CSS design system
    ├── ui/                    # Modals, shelf drawer, navigation, and forms
    ├── main.js                # Core app initialization & state coordination
    └── state.js               # Global reactive application state
```

---

## 📜 License
This project is licensed under the MIT License.
3D low-poly models are provided under CC0 (Public Domain) via Kenney and Poly.pizza.
