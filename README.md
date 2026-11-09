# 🏍️ Superbike GP 3D

High-performance 3D Motorcycle Grand Prix racing game built with **Next.js 15+**, **React 19**, **React Three Fiber v9**, **Three.js**, **Tailwind CSS v4**, **TypeScript**, and **Zustand**.

---

## 🚀 Getting Started

### 1. Development Mode
Run the Next.js local development server with Hot Module Replacement:
```bash
npm run dev
```
Then open `http://localhost:3000` in your mobile or desktop browser.

### 2. Production Build & Start
The production build compiles down to an ultra-lightweight ~112 kB First Load bundle:
```bash
npm run build
npm start
```

---

## 🎮 Controls

### Mobile Touch Controls (Exact Screenshot Layout)
- **Bottom-Left Circle**: Front Brake Lever (Hold)
- **Bottom-Right Circle**: Twist Throttle Grip (Hold)
- **Left Flank**:
  - `🔧` **Wrench**: Instant Engine Supercharge (+20% torque tune)
  - `📹` **Camera**: Cycle perspectives (*Dynamic Chase*, *Cockpit FPV*, *Low-Angle Action*, *Far Chase*)
  - `◀◀` **Steer Left**: Responsive cornering to the left
- **Right Flank**:
  - `🪖` **Helmet**: Toggle aerodynamic racing tuck for speed boost
  - `🧪` **NOS**: Cyan Nitro boost button with afterburner flame
  - `🥊` **Kick**: Road Rash style combat attack to bump adjacent rivals
  - `▶▶` **Steer Right**: Responsive cornering to the right

### Desktop Keyboard Controls
- **Accelerate**: `W` or `Arrow Up`
- **Brake**: `S`, `Arrow Down`, or `Space`
- **Steer Left**: `A` or `Arrow Left`
- **Steer Right**: `D` or `Arrow Right`
- **NOS Nitro Boost**: `Shift` or `N`
- **Combat Kick**: `K`
- **Camera View**: `C`
- **Pause Game**: `P`

---

## 📁 Architecture & Separation of Concerns

```
3D_bike/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Mobile viewport configuration & root HTML
│   │   ├── page.tsx           # Client-side dynamic canvas shell
│   │   └── globals.css        # Tailwind v4 theme & touch ergonomics
│   ├── audio/
│   │   └── SoundEngine.ts     # Procedural Web Audio synthesizer with MasterGain
│   ├── physics/
│   │   └── TrackSpline.ts     # Frenet-Serret spline frames & road boundary containment
│   ├── store/
│   │   ├── useRaceStore.ts    # Telemetry, laps, race timer, and standings
│   │   ├── useControlStore.ts # Multi-touch & keyboard input state
│   │   └── useSettingsStore.ts# Audio mute, graphics quality tier, and toast notifications
│   ├── types/
│   │   ├── race.types.ts
│   │   ├── controls.types.ts
│   │   └── bike.types.ts
│   └── components/
│       ├── canvas/
│       │   ├── RacingCanvas.tsx   # R3F WebGL Canvas with dynamic resolution scaling
│       │   ├── Scene.tsx          # Lighting, fog, and racer groups
│       │   ├── Camera/GameCamera.tsx # 4-mode dynamic camera controller
│       │   ├── Bike/PlayerBike.tsx   # Red sportbike with MotoGP rider leaning & kick rigging
│       │   ├── Bike/AIRacerBike.tsx  # 5 AI competitors with distinct liveries
│       │   ├── Bike/ExhaustFX.tsx    # Nitro jet exhaust flame particles
│       │   └── Track/
│       │       ├── TrackMesh.tsx  # Asphalt road ribbon with Frenet-aligned geometry
│       │       ├── Kerbs.tsx      # 3D red/white FIA rumble kerbs
│       │       ├── Gantry.tsx     # Start/Finish gantry with 5-light countdown sequence
│       │       └── Scenery.tsx    # Grandstands, sponsor billboards, trees, and mountains
│       └── hud/
│           ├── HeadsUpDisplay.tsx # Main HUD wrapper
│           ├── TopBar.tsx         # Pause button, Lap counter, Position pill, Timer
│           ├── LeftActionStack.tsx# Wrench, Camera, Steer Left (<<)
│           ├── RightActionStack.tsx # Helmet, NOS, Kick, Steer Right (>>)
│           ├── Speedometer.tsx    # 22-segment LED tachometer, speed readout, gear tag
│           ├── BottomPedals.tsx   # Big neon green circular Brake & Throttle buttons
│           └── Modals/
│               ├── StartModal.tsx # Race preview & graphics preset selector
│               ├── PauseModal.tsx # Resume, restart, audio mute toggle
│               └── FinishModal.tsx# Podium rank, best lap, total time, retry
```
