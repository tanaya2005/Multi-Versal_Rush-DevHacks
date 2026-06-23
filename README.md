# 🌌 Multiversal Rush

> Multiversal Rush is a real-time 3D multiplayer obstacle course racing game where up to 5 players jump, dodge, and sprint across themed dimensional worlds — from neon cyberpunk cities to frozen arenas and lava hellscapes. Compete for trophies and XP, unlock cosmetic avatars, chat with teammates via voice, and race your way to the top of the global leaderboard.

Built with React Three Fiber, Socket.io, Node.js, and MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Game Worlds & Mechanics](#game-worlds--mechanics)
- [Multiplayer Architecture](#multiplayer-architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Deployment](#deployment)

---

## Overview

Multiversal Rush is a party-style 3D obstacle course game inspired by games like Fall Guys/Stumble Guys. Players join rooms, race through themed levels with unique physics and hazards, and earn trophies and XP based on their finish position. It supports real-time voice chat, a friends system, a cosmetics shop, and a team relay mode.

---

## Tech Stack

### Frontend (`multiversal-rush/client`)

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Three Fiber + Three.js | 3D rendering engine |
| Zustand | Global state management |
| Socket.io-client | Real-time multiplayer |
| LiveKit | In-game voice chat |
| React Router v6 | Client-side routing |
| Vite | Build tool (dev port: 5173) |

### Backend (`multiversal-rush/server`)

| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server (port: 5000) |
| Socket.io | Real-time game events |
| MongoDB + Mongoose | Data persistence |
| JWT + bcryptjs | Authentication |
| LiveKit Server SDK | Voice token generation |
| Stripe + Razorpay | Payment processing (gems shop) |
| Nodemon | Dev auto-reload |

---

## Project Structure

```
multiversal-rush/
├── client/
│   ├── public/
│   │   └── models/                  # GLTF 3D avatar models (Capybara, Penguin, Shark, etc.)
│   └── src/
│       ├── pages/                   # Screen-level components
│       │   ├── Login.jsx            # Auth screen
│       │   ├── Home.jsx             # Dashboard / main menu
│       │   ├── Lobby.jsx            # Pre-game room lobby
│       │   ├── Game.jsx             # Main 3D game canvas + socket wiring
│       │   ├── Leaderboard.jsx      # Global trophy leaderboard
│       │   ├── Achievements.jsx     # Player achievement tracking
│       │   ├── Friends.jsx          # Friends list + DMs
│       │   ├── TeamRoomJoin.jsx     # Team relay mode entry
│       │   ├── TeamLobby.jsx        # Team lobby
│       │   └── RelayGame.jsx        # Team relay race
│       ├── components/
│       │   ├── Worlds/              # Level scene components
│       │   │   ├── World1.jsx       # Neon Paradox
│       │   │   ├── World2.jsx       # Lava Hell
│       │   │   ├── WorldCryoVoid.jsx
│       │   │   ├── WorldLavaHell.jsx
│       │   │   ├── WorldNeonParadox.jsx
│       │   │   ├── FrozenFrenzyArena.jsx
│       │   │   ├── Honeycomb.jsx    # Elimination mode
│       │   │   ├── HubWorld.jsx     # 3D lobby hub
│       │   │   ├── LobbyRoom.jsx
│       │   │   └── VictoryPodium.jsx
│       │   ├── Obstacles/           # Interactive hazards
│       │   │   ├── AvalancheWave.jsx
│       │   │   ├── CrackingPlatform.jsx
│       │   │   ├── FrostbiteZone.jsx
│       │   │   ├── GlitchPlatform.jsx
│       │   │   ├── IceSlide.jsx
│       │   │   ├── LaserGrid.jsx
│       │   │   ├── ReverseZone.jsx
│       │   │   ├── SlideSnowball.jsx
│       │   │   ├── Snowball.jsx
│       │   │   ├── SnowCannon.jsx
│       │   │   ├── TeleportTile.jsx
│       │   │   ├── WindBridge.jsx
│       │   │   └── WindZone.jsx
│       │   ├── Player/
│       │   │   ├── Player.jsx       # Main player: WASD + physics + emit
│       │   │   └── PlayerCryo.jsx   # Cryo Void variant
│       │   ├── Multiplayer/
│       │   │   └── RemotePlayers.jsx # Renders other players' meshes
│       │   ├── UI/
│       │   │   ├── HUD.jsx
│       │   │   ├── MatchResultsOverlay.jsx
│       │   │   └── AchievementPopup.jsx
│       │   └── Environment/
│       │       ├── NeonParadoxComponents.jsx
│       │       └── FrozenFrenzyComponents.jsx
│       ├── socket/
│       │   ├── socket.js            # Socket.io client instance
│       │   └── friendSocket.js      # Friend/DM socket events
│       ├── store/
│       │   └── store.js             # Zustand global store
│       ├── voice/
│       │   └── Voice.jsx            # LiveKit voice chat widget
│       └── utils/
│           └── collision.js         # AABB collision helpers
│
└── server/
    ├── socket/
    │   ├── gameSocket.js            # Core multiplayer game logic
    │   ├── chat.js                  # In-game chat
    │   ├── friendSocket.js          # Friend requests & DMs
    │   └── relayLogic.js            # Team relay mode
    ├── routes/                      # REST API endpoints
    ├── controllers/                 # Business logic
    ├── models/                      # Mongoose schemas (User, Game, Message)
    ├── services/
    │   └── achievementService.js
    ├── middleware/
    │   ├── auth.js                  # JWT guard
    │   └── adminAuth.js
    └── config/
        └── db.js                    # MongoDB connection
```

---

## Game Worlds & Mechanics

### Worlds

| # | Name | Theme | Unique Mechanic |
|---|---|---|---|
| 1 | Neon Paradox | Cyberpunk city | Glitch platforms, reverse zones, teleport tiles, laser grids |
| 2 | Lava Hell | Volcanic platformer | Floating lava platforms, increasing gravity |
| 3 | Cryo Void | Frozen cave | Ice slides, cracking platforms, frostbite zones |
| 4 | Frozen Frenzy Arena | Snow race | Avalanche, snow cannons, wind bridge |
| 5 | Honeycomb | Elimination arena | Tiles vanish on contact; last one standing wins |

### Player Physics

- **WASD / Arrow Keys** — movement
- **Space** — jump (`JUMP_POWER = 12`)
- **Shift** — crouch (halves speed, lowers hitbox)
- **Gravity** — `-30 m/s²`
- **Momentum** — velocity is lerped for smooth acceleration
- **Ice surfaces** — reduced damping + lower acceleration simulate slippery feel
- **Collision** — AABB (Axis-Aligned Bounding Box) per-platform detection
- **Fall limit** — falling below `y = -15` triggers respawn

### Progression

| Finish | Trophies | XP |
|---|---|---|
| 1st | +15 | +200 |
| 2nd | +10 | +175 |
| 3rd | +5 | +150 |
| Participation | — | +100 |

- **Leveling:** Level 1 starts at 0 XP. Each level requires 100 + (level × 200) XP.
- **Gems** are awarded on level-up and can be spent in the shop.

---

## Multiplayer Architecture

### Socket Events

**Client → Server**

| Event | Description |
|---|---|
| `joinRoom` | Join a game room (max 5 players) |
| `move` | Send position + rotation (throttled to 50ms = ~20 Hz) |
| `playerFinished` | Crossed the finish portal |
| `playerFell` | Fell off — request respawn |
| `worldTransition` | Entered a portal to the next world |
| `playerReady` | Toggle ready state in lobby |
| `leaveRoom` | Voluntary disconnect |
| `playAgain` | Request rematch after results screen |

**Server → Client**

| Event | Description |
|---|---|
| `playerMoved` | Broadcast other players' positions |
| `playerFinishedRace` | Finish order + trophy distribution |
| `playerEliminated` | Player knocked out (Honeycomb) |
| `gameFinished` | All done — navigate to leaderboard |
| `matchResults` | Detailed XP/trophy/level-up breakdown |
| `windDirection` | Wind change every 3s (Frozen Frenzy) |
| `avalancheStart/Sync/End` | Server-authoritative avalanche state |
| `cannonFire` | Snow cannon projectile fired |

### Key Implementation Details

- Position updates are throttled client-side to 50ms. Server re-broadcasts to the room.
- Remote players are rendered as cyan boxes in `RemotePlayers.jsx` with world gating — players are only visible if they share the same world number.
- The avalanche is server-authoritative: speed starts at 8 units/sec, accelerates by 0.8 per second, caps at 26 units/sec.
- Room state is held in memory on the server (`rooms` object). Persistent data (trophies, XP, history) is saved to MongoDB after each match.

---

## Features

### Authentication
- Email / password / date-of-birth signup (age gate: must be 13+)
- JWT tokens stored in `localStorage`
- Protected routes via `PrivateRoute` wrapper
- Banned user middleware blocks API access for banned accounts

### Leaderboard
- Global top-20 players sorted by trophies
- Shows username, trophies, wins, games played, level

### Achievements
- Unlockable milestones tracked per-user in MongoDB
- In-game popup notification on unlock
- Examples: `trophyCollector`, `survivorSpirit`

### Voice Chat (LiveKit)
- Real-time voice in rooms using LiveKit Cloud
- Displayed as a widget in the bottom-right during gameplay
- Token generated server-side via LiveKit Server SDK

### Friends System
- Send / accept / reject friend requests via socket
- Direct messaging with DB-persisted history
- Invite friends to rooms
- Notification badge on friend requests

### Shop
- Gems currency (purchased via Stripe or Razorpay)
- Buyable avatar models: Capybara, Penguin, Red Panda, Shark, Stumble Guys variants, and more
- Default avatar: Penguin

### Team Relay Mode
- Create or join a team room
- Players take turns controlling the character
- Separate relay game page + team leaderboard

### Admin Panel
- Ban / unban users
- Broadcast server-wide messages
- View live room stats
- Protected by `ADMIN_SECRET` environment variable

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- MongoDB URI (MongoDB Atlas recommended)
- LiveKit account (optional — for voice chat)

### 1. Install & run the backend

```bash
cd multiversal-rush/server
npm install
# Create .env (see Environment Variables section below)
npm run dev
# Server starts on http://localhost:5000
```

### 2. Install & run the frontend

```bash
cd multiversal-rush/client
npm install
# Create .env (see Environment Variables section below)
npm run dev
# Client starts on http://localhost:5173
```

### 3. Test multiplayer locally

**Same machine (two browser windows):**
1. Open `http://localhost:5173` in Chrome
2. Open `http://localhost:5173` in Chrome Incognito
3. Log in with two different accounts
4. Enter the same room code

**Different machines (same network):**
1. Find your IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On the second machine, set `VITE_SERVER_URL=http://<your-ip>:5000` in its `.env`
3. Both machines open `http://localhost:5173`

---

## Environment Variables

### Client — `multiversal-rush/client/.env`

```env
VITE_SERVER_URL=http://localhost:5000
```

For production, replace with your deployed backend URL:
```env
VITE_SERVER_URL=https://your-backend.onrender.com
```

### Server — `multiversal-rush/server/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/multiversal-rush
JWT_SECRET=your_jwt_secret_here
ADMIN_SECRET=your_admin_secret_here

# LiveKit (voice chat)
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-cloud-url.livekit.cloud

# Payments (optional)
STRIPE_SECRET_KEY=sk_...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...

CLIENT_URL=http://localhost:5173
```

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/leaderboard` | — | Top 20 players |
| GET | `/api/achievements` | JWT | Player achievements |
| POST | `/api/voice/token` | JWT | LiveKit voice token |
| GET | `/api/friends` | JWT | Friends list |
| POST | `/api/friends/request` | JWT | Send friend request |
| GET | `/api/shop` | JWT | Available items |
| POST | `/api/shop/buy` | JWT | Purchase avatar |
| POST | `/api/payments/create-order` | JWT | Create payment order |
| GET | `/api/admin/rooms` | Admin | Live room stats |
| POST | `/api/admin/ban` | Admin | Ban a user |

---

## Deployment

### Backend (Render)

A `render.yaml` is included in `multiversal-rush/server/`. Push to GitHub and connect the repo to Render — it will auto-deploy on push.

### Frontend

```bash
cd multiversal-rush/client
npm run build
# Output in dist/ — deploy to Vercel, Netlify, or serve statically
```

Update `VITE_SERVER_URL` in the client `.env` to your production backend URL before building.

### Production URLs (current)

- **Backend:** `https://strangerstrings-devhacks.onrender.com`
- **Frontend:** `https://stranger-strings-dev-hacks-bn59.vercel.app`

---

## Controls Reference

| Key | Action |
|---|---|
| W / ↑ | Move forward |
| S / ↓ | Move backward |
| A / ← | Move left |
| D / → | Move right |
| Space | Jump |
| Shift | Crouch |

---

*Built for DevHacks by Team Stranger Strings.*
