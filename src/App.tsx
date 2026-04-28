import { useState } from 'react';
import type { TabId } from './types';
import { useTrackerState } from './hooks/useTrackerState';
import { Dashboard } from './components/Dashboard';
import { WeeklyLog } from './components/WeeklyLog';
import { PaidCarats } from './components/PaidCarats';
import { BannerTimeline } from './components/BannerTimeline';
import { Wishlist } from './components/Wishlist';
import { LayoutDashboard, CalendarDays, Flag, Star, RotateCcw } from 'lucide-react';
const umaLogo = '/icon.png';

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'weekly', label: 'Weekly Log', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'banners', label: 'Banners', icon: <Flag className="w-4 h-4" /> },
  { id: 'wishlist', label: 'Wishlist', icon: <Star className="w-4 h-4" /> },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const tracker = useTrackerState();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-surface border-b border-surface-lighter sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={umaLogo} alt="Uma Musume" className="h-8 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-text">Uma Pull Tracker</h1>
              <p className="text-xs text-text-muted">Umamusume Gacha Resource Planner</p>
            </div>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={() => {
                if (confirm('Delete ALL data? This will clear everything and cannot be undone.')) {
                  tracker.resetToDefault();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-bg text-primary-light border-t border-x border-surface-lighter'
                    : 'text-text-muted hover:text-text hover:bg-surface-light'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {tracker.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-light mx-auto mb-4"></div>
              <p className="text-text-muted text-sm">Loading data...</p>
            </div>
          </div>
        ) : (
        <>
        {activeTab === 'dashboard' && (
          <Dashboard
            weeklyEntries={tracker.state.weeklyEntries}
            bannerEntries={tracker.state.bannerEntries}
          />
        )}
        {activeTab === 'weekly' && (
          <>
            <PaidCarats
              purchases={tracker.state.paidCaratPurchases}
              onAdd={tracker.addPaidCaratPurchase}
              onDelete={tracker.deletePaidCaratPurchase}
            />
            <WeeklyLog
              entries={tracker.state.weeklyEntries}
              paidCaratsTotal={(tracker.state.paidCaratPurchases || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)}
              onUpdate={tracker.updateWeeklyEntry}
              onAdd={tracker.addWeeklyEntry}
              onDelete={tracker.deleteWeeklyEntry}
            />
          </>
        )}
        {activeTab === 'banners' && (
          <BannerTimeline
            bannerEntries={tracker.state.bannerEntries}
            weeklyEntries={tracker.state.weeklyEntries}
            onUpdate={tracker.updateBannerEntry}
            onAdd={tracker.addBannerEntry}
            onDelete={tracker.deleteBannerEntry}
            onSwap={tracker.swapBanners}
          />
        )}
        {activeTab === 'wishlist' && (
          <Wishlist
            bannerEntries={tracker.state.bannerEntries}
            onUpdate={tracker.updateBannerEntry}
            onAdd={tracker.addBannerEntry}
            onDelete={tracker.deleteBannerEntry}
          />
        )}
        </>
        )}
      </main>
    </div>
  );
}

export default App;