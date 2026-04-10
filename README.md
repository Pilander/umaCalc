# Uma Pull Tracker

A gacha resource planner for **Umamusume: Pretty Derby**. Track your weekly carat income, plan banner pulls, and forecast whether you'll have enough carats when your target banners arrive.

Built with React + TypeScript + Vite, backed by an Express + SQLite API for persistent server-side storage.

---

## Features

### Dashboard
- **Current free carats** at a glance with week-over-week change
- **Total pulls available** (cumulative pulls + uma tickets)
- **Average weekly carat gain** calculated from your weekly log history
- **Interactive prediction chart** — plots your projected carat balance over time with banner pull drop-offs, so you can see if you'll hit pity (30k for characters, 60k for SSR support cards)
- Dynamic banner type tags (Character / Support / Char + Support)

### Weekly Log
- Record your free carats, paid carats, cumulative pulls, uma tickets, and L-carats each week
- Tracks carat spent, carat gained, carat net, pull spent, pull gained, pull net — all auto-calculated from week-to-week deltas
- Paid carat purchases tracked separately with date and notes

### Banners
- Full banner timeline table with start date, end date, name, type, free pulls, modifier, predicted carats, and after-pull carats
- **Wishlist toggle** (♥) on each banner — wishlisted banners appear in the Wishlist tab and are highlighted in the timeline
- **Undated banners** — banners with unknown release dates can be added and managed separately
- Add/edit modal with banner name, type (Character/Support Card), date unknown toggle, start/end dates, free pulls, modifier, and wishlist toggle
- Swap banner positions, search/filter banners

### Wishlist
- Filtered view of all wishlisted banners, organized into:
  - **Upcoming** — dated banners coming in the future with countdown
  - **Date Unknown** — undated wishlisted banners (collapsible)
  - **Completed** — past banners that have already occurred (collapsible)
- Quick un-wishlist button on each card

### Data Management
- **Reset** button clears ALL data
- All data persists in SQLite database on the server — survives container restarts via Docker volume
- Automatic migration from older data formats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 |
| Language | TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Express 5 |
| Database | SQLite (better-sqlite3) |
| State | React hooks + server API |
| Deployment | Docker + GitHub Actions CI/CD |

---

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start backend server (port 3001)
npm run dev:server

# In another terminal — start Vite dev server (port 5173, proxies /api to 3001)
npm run dev

# Or start both at once
npm run dev:all
```

### Production (Docker)

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t uma-tracker .
docker run -p 3001:3001 -v ./data:/app/data uma-tracker
```

The app will be available at `http://localhost:3001`.

### Production Build (without Docker)

```bash
npm run build          # Build frontend
npm run build:server   # Build server
npm start              # Start production server
```

---

## Architecture

```
┌─────────────┐      HTTP/JSON       ┌──────────────┐      SQLite
│  React App   │  ◄──────────────►   │  Express API  │  ◄──────────►  data/tracker.db
│  (Frontend)  │                     │  (Backend)    │
└─────────────┘                     └──────────────┘
```

- **Frontend** — React SPA built with Vite, served as static files by Express
- **Backend** — Express 5 API with three endpoints (`GET/PUT/DELETE /api/state`)
- **Database** — SQLite file stored in `data/` directory, persisted via Docker volume
- **State sync** — Frontend loads state on mount, debounced saves (500ms) on every change

---

## Project Structure

```
tracker/
├── server/
│   ├── index.ts              # Express server — API + static file serving
│   └── db.ts                 # SQLite database module (better-sqlite3)
├── public/                   # Static assets (favicon, icons)
├── src/
│   ├── assets/               # Images (logo, carat icon)
│   ├── components/
│   │   ├── Dashboard.tsx     # Overview + prediction chart
│   │   ├── WeeklyLog.tsx     # Weekly entry table
│   │   ├── PaidCarats.tsx    # Paid carat purchase tracker
│   │   ├── BannerTimeline.tsx# Banner management table + modals
│   │   ├── Wishlist.tsx      # Filtered wishlist view
│   │   └── Icons.tsx         # Shared icon components (CaratIcon)
│   ├── data/
│   │   └── seedData.ts       # Default empty state
│   ├── hooks/
│   │   └── useTrackerState.ts# Central state management + API sync
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── utils/
│   │   ├── calculations.ts   # Prediction engine + formatters
│   │   └── storage.ts        # API client (fetch-based save/load/clear)
│   ├── App.tsx               # Root component with tab navigation
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + custom theme
├── Dockerfile                # Multi-stage: build frontend+server, run with Node
├── docker-compose.yml        # Production deployment with volume mount
├── tsconfig.server.json      # Server TypeScript config
├── package.json
├── tsconfig.json
└── vite.config.ts            # Vite config with API proxy for dev
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/state` | Returns full tracker state as JSON |
| `PUT` | `/api/state` | Saves full tracker state (JSON body) |
| `DELETE` | `/api/state` | Resets state to empty defaults |

---

## How Predictions Work

The prediction chart estimates your future carat balance at each banner date:

1. **Average weekly gain** is calculated from your weekly log (median of `caratNet` values)
2. For each banner (sorted by date), the system projects how many carats you'll accumulate by that date
3. When you "pull" on a banner, 30,000 carats are deducted (60,000 for SSR support cards)
4. Free pulls and modifiers adjust the effective cost
5. The chart shows your balance trajectory — green when above pity threshold, red when below

---

## License

Personal project — not affiliated with Cygames or the Umamusume franchise.