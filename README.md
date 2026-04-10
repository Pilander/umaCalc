# Uma Pull Tracker

A gacha resource planner for **Umamusume: Pretty Derby**. Track your weekly carat income, plan banner pulls, and forecast whether you'll have enough carats when your target banners arrive.

Built with React + TypeScript + Vite. All data is stored locally in your browser (localStorage).

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
- **Reset** button clears ALL data (localStorage wiped, empty state)
- All data persists in localStorage across sessions
- Automatic migration from older data formats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| State | React hooks + localStorage |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
tracker/
├── public/               # Static assets (favicon, icons)
├── src/
│   ├── assets/           # Images (logo, carat icon)
│   ├── components/
│   │   ├── Dashboard.tsx       # Overview + prediction chart
│   │   ├── WeeklyLog.tsx       # Weekly entry table
│   │   ├── PaidCarats.tsx      # Paid carat purchase tracker
│   │   ├── BannerTimeline.tsx  # Banner management table + modals
│   │   ├── Wishlist.tsx        # Filtered wishlist view
│   │   └── Icons.tsx           # Shared icon components (CaratIcon)
│   ├── data/
│   │   └── seedData.ts         # Default empty state
│   ├── hooks/
│   │   └── useTrackerState.ts  # Central state management + localStorage
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── utils/
│   │   ├── calculations.ts     # Prediction engine + formatters
│   │   └── storage.ts          # localStorage save/load/clear
│   ├── App.tsx                 # Root component with tab navigation
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind + custom theme
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

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