import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { WeeklyEntry, BannerEntry } from '../types';
import { getAverageWeeklyGain, calculatePredictions, generateWeeklyPredictions, formatNumber, formatDateShort } from '../utils/calculations';
import { TrendingUp, Target, Calendar, Clock } from 'lucide-react';
import { CaratIcon } from './Icons';

interface DashboardProps {
  weeklyEntries: WeeklyEntry[];
  bannerEntries: BannerEntry[];
}

const CARATS_PER_PULL = 150;

export function Dashboard({ weeklyEntries, bannerEntries }: DashboardProps) {
  const avgGain = useMemo(() => getAverageWeeklyGain(weeklyEntries), [weeklyEntries]);
  const latestFreeCarats = useMemo(() => {
    const filled = weeklyEntries.filter(e => e.totalCarats > 0);
    if (filled.length === 0) return 0;
    return filled[filled.length - 1].freeCarats ?? 0;
  }, [weeklyEntries]);
  const predictions = useMemo(() => calculatePredictions(weeklyEntries, bannerEntries), [weeklyEntries, bannerEntries]);

  const upcomingBanners = useMemo(() =>
    predictions.filter(p => p.bannerName && p.bannerName.toLowerCase() !== 'x'),
    [predictions]
  );

  const weeklyPredictions = useMemo(() => generateWeeklyPredictions(weeklyEntries, bannerEntries), [weeklyEntries, bannerEntries]);

  // Build a lookup map from bannerEntries for type info
  const bannerLookup = useMemo(() => {
    const map = new Map<string, BannerEntry>();
    for (const b of bannerEntries) {
      if (b.weekDate) map.set(`${b.name}|${b.weekDate}`, b);
    }
    return map;
  }, [bannerEntries]);

  // Next wishlisted dated banner countdown
  const nextWishlistBanner = useMemo(() => {
    const now = new Date();
    const upcoming = bannerEntries
      .filter(b => b.weekDate && b.isWishlist && new Date(b.weekDate) > now)
      .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());
    if (upcoming.length === 0) return null;
    const next = upcoming[0];
    const diffMs = new Date(next.weekDate!).getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { name: next.name, days: diffDays, date: next.weekDate! };
  }, [bannerEntries]);

  const chartData = useMemo(() => {
    const actualEntries = weeklyEntries.filter(e => e.totalCarats > 0);

    const actualData = actualEntries.map(e => ({
      date: formatDateShort(e.date),
      fullDate: e.date,
      actual: e.totalCarats,
      predicted: null as number | null,
    }));

    // Bridge point: last actual value also gets a predicted value so lines connect
    if (actualData.length > 0 && weeklyPredictions.length > 0) {
      actualData[actualData.length - 1].predicted = actualData[actualData.length - 1].actual;
    }

    // Weekly prediction data (skip the first one since it's week 0 = same as last actual)
    const predData = weeklyPredictions
      .filter((_, i) => i > 0)
      .filter((_, i) => i % 2 === 0 || weeklyPredictions.length < 40)
      .map(p => ({
        date: formatDateShort(p.weekDate),
        fullDate: p.weekDate,
        actual: null as number | null,
        predicted: p.adjustedCarats,
      }));

    return [...actualData, ...predData];
  }, [weeklyEntries, weeklyPredictions]);

  const latestPulls = weeklyEntries.filter(e => e.cumulativePulls > 0).at(-1)?.cumulativePulls ?? 0;
  const totalWeeks = weeklyEntries.filter(e => e.totalCarats > 0).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-surface-lighter">
          <div className="flex items-center gap-3">
            <CaratIcon className="w-8 h-8" />
            <div>
              <p className="text-sm text-text-muted">Free Carats</p>
              <p className="text-2xl font-bold text-primary-light">{formatNumber(latestFreeCarats)}</p>
            </div>
          </div>
        </div>
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Weekly Gain"
          value={formatNumber(Math.round(avgGain))}
          color="text-accent"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Total Pulls"
          value={formatNumber(latestPulls)}
          color="text-warning"
        />
        {nextWishlistBanner ? (
          <div className="bg-surface rounded-xl p-5 border border-surface-lighter">
            <div className="flex items-center gap-3">
              <div className="text-success"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-text-muted">Next Target</p>
                <p className="text-lg font-bold truncate">{nextWishlistBanner.name}</p>
                <p className="text-xs text-text-muted">
                  {nextWishlistBanner.days} days &middot; {formatDateShort(nextWishlistBanner.date)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Weeks Tracked"
            value={String(totalWeeks)}
            color="text-success"
          />
        )}
      </div>

      {/* Chart */}
      <div className="bg-surface rounded-xl p-6 border border-surface-lighter">
        <h3 className="text-lg font-semibold mb-4">Carat Projection</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#363254" />
              <XAxis dataKey="date" stroke="#9896a8" fontSize={12} />
              <YAxis stroke="#9896a8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2640', border: '1px solid #363254', borderRadius: '8px', color: '#e2e0ea' }}
                formatter={(value) => [formatNumber(value as number), '']}
              />
              <Line type="monotone" dataKey="actual" stroke="#a78bfa" strokeWidth={2} dot={false} connectNulls={false} name="Actual" />
              <Line type="monotone" dataKey="predicted" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={false} name="Predicted" />
              <ReferenceLine y={30000} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '1 Banner', fill: '#ef4444', fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Banners */}
      <div className="bg-surface rounded-xl p-6 border border-surface-lighter">
        <h3 className="text-lg font-semibold mb-4">Upcoming Banners to Pull</h3>
        {upcomingBanners.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">No upcoming banners planned. Add banners in the Banners tab.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingBanners.slice(0, 12).map((banner) => {
              const realBanner = bannerLookup.get(`${banner.bannerName}|${banner.weekDate}`);
              const bannerType = realBanner?.type ?? (banner.isSSR ? 'card' : 'character');
              const affordable = banner.adjustedCarats >= 30000;
              const pullsAffordable = Math.max(0, Math.floor(banner.adjustedCarats / CARATS_PER_PULL));
              const gap = affordable ? 0 : 30000 - banner.adjustedCarats;

              return (
                <div
                  key={banner.weekDate + banner.bannerName}
                  className={`rounded-xl p-4 border transition-colors ${
                    affordable
                      ? 'border-success/30 bg-success/5'
                      : 'border-danger/30 bg-danger/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 min-w-0 flex-1">
                      <BannerTypeTag type={bannerType} />
                      <h4 className="font-medium truncate">{banner.bannerName}</h4>
                      <p className="text-sm text-text-muted">{formatDateShort(banner.weekDate)}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3 space-y-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">Predicted</p>
                        <p className="text-sm text-text-muted flex items-center justify-end gap-1">
                          {formatNumber(banner.predictedCarats)}
                          <CaratIcon className="w-3.5 h-3.5" />
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-text-muted">After Pull</p>
                        <p className={`text-lg font-bold flex items-center justify-end gap-1 ${affordable ? 'text-success' : 'text-danger'}`}>
                          {formatNumber(banner.adjustedCarats)}
                          <CaratIcon className="w-4 h-4" />
                        </p>
                      </div>
                      <p className="text-xs text-text-muted">
                        ≈ {pullsAffordable} pulls available
                      </p>
                      {!affordable && (
                        <p className="text-xs text-danger">
                          Need {formatNumber(gap)} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BannerTypeTag({ type }: { type: 'character' | 'card' | 'both' }) {
  if (type === 'card') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
        Support
      </span>
    );
  }
  if (type === 'both') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
        Character + Support
      </span>
    );
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
      Character
    </span>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-surface-lighter">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}