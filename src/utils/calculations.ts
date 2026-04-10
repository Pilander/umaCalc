import type { WeeklyEntry, BannerEntry, PredictionResult } from '../types';

const CARATS_PER_PULL = 150;
const PULLS_PER_BANNER = 200;
const CARATS_PER_BANNER = PULLS_PER_BANNER * CARATS_PER_PULL; // 30,000

export function getAverageWeeklyGain(entries: WeeklyEntry[]): number {
  const entriesWithGain = entries.filter(e => e.caratGain > 0);
  if (entriesWithGain.length === 0) return 0;
  const totalGain = entriesWithGain.reduce((sum, e) => sum + e.caratNet, 0);
  return totalGain / entriesWithGain.length;
}

export function getLatestTotal(entries: WeeklyEntry[]): number {
  const filled = entries.filter(e => e.totalCarats > 0);
  if (filled.length === 0) return 0;
  return filled[filled.length - 1].totalCarats;
}

export function getLatestDate(entries: WeeklyEntry[]): string | null {
  const filled = entries.filter(e => e.totalCarats > 0);
  if (filled.length === 0) return null;
  return filled[filled.length - 1].date;
}

export function weeksBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Calculate per-banner predictions (used for banner cards / table).
 * Only considers dated banners that are wishlisted.
 */
export function calculatePredictions(
  weeklyEntries: WeeklyEntry[],
  bannerEntries: BannerEntry[]
): PredictionResult[] {
  const avgGain = getAverageWeeklyGain(weeklyEntries);
  const latestTotal = getLatestTotal(weeklyEntries);
  const latestDate = getLatestDate(weeklyEntries);

  if (!latestDate || avgGain === 0) return [];

  // Only dated + wishlisted banners, sorted by date
  const sortedBanners = [...bannerEntries]
    .filter(b => b.weekDate !== null && b.isWishlist)
    .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());

  const results: PredictionResult[] = [];
  let cumulativeBannerCost = 0;
  let cumulativeFreePulls = 0;

  for (const banner of sortedBanners) {
    const weeks = weeksBetween(latestDate, banner.weekDate!);
    if (weeks <= 0) continue;

    const bannerCost = banner.isSSR ? CARATS_PER_BANNER * 2 : CARATS_PER_BANNER;

    cumulativeBannerCost += bannerCost;
    cumulativeFreePulls += banner.freePulls * CARATS_PER_PULL;
    cumulativeFreePulls += banner.extraModifier * CARATS_PER_PULL;

    const predictedCarats = latestTotal + (weeks * avgGain);
    const adjustedCarats = predictedCarats - cumulativeBannerCost + cumulativeFreePulls;

    results.push({
      weekDate: banner.weekDate!,
      bannerName: banner.name,
      predictedCarats: Math.round(predictedCarats),
      adjustedCarats: Math.round(adjustedCarats),
      isSSR: banner.isSSR,
      freePulls: banner.freePulls,
      extraModifier: banner.extraModifier,
    });
  }

  return results;
}

export interface WeeklyPrediction {
  weekDate: string;
  predictedCarats: number;
  adjustedCarats: number;
  bannerName: string | null;
}

/**
 * Generate week-by-week predictions for the chart.
 * Uses wishlisted + dated banner entries with real cost data
 * (SSR status, free pulls, modifiers).
 */
export function generateWeeklyPredictions(
  weeklyEntries: WeeklyEntry[],
  bannerEntries: BannerEntry[]
): WeeklyPrediction[] {
  const avgGain = getAverageWeeklyGain(weeklyEntries);
  const latestTotal = getLatestTotal(weeklyEntries);
  const latestDate = getLatestDate(weeklyEntries);

  if (!latestDate || avgGain === 0) return [];

  // Only dated + wishlisted banners
  const datedWishlist = bannerEntries
    .filter(b => b.weekDate !== null && b.isWishlist)
    .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());

  // Build a map of banner costs by date (consume each only once)
  const bannersByDate = new Map<string, BannerEntry[]>();
  for (const b of datedWishlist) {
    const key = b.weekDate!;
    if (!bannersByDate.has(key)) bannersByDate.set(key, []);
    bannersByDate.get(key)!.push(b);
  }

  // Find the projection end date
  const allDates: number[] = datedWishlist.map(b => new Date(b.weekDate!).getTime());
  if (allDates.length === 0) return [];

  const maxTime = Math.max(...allDates);
  const latestTime = new Date(latestDate).getTime();

  // Extend 8 weeks past the last banner for a nicer chart tail
  const endTime = maxTime + 8 * 7 * 24 * 60 * 60 * 1000;

  if (maxTime <= latestTime) return [];

  const results: WeeklyPrediction[] = [];
  let cumulativeCost = 0;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const consumedDates = new Set<string>();

  let weekNum = 0;
  let currentTime = latestTime;

  while (currentTime <= endTime) {
    const currentDateStr = new Date(currentTime).toISOString().split('T')[0];
    const predictedCarats = latestTotal + (weekNum * avgGain);

    // Check if any banner pull happens this week (within ±3 days)
    let bannerName: string | null = null;
    for (const [date, banners] of bannersByDate) {
      if (consumedDates.has(date)) continue;
      const entryTime = new Date(date).getTime();
      if (Math.abs(entryTime - currentTime) < 4 * 24 * 60 * 60 * 1000) {
        // Sum all banners on this date
        for (const b of banners) {
          const cost = b.isSSR ? CARATS_PER_BANNER * 2 : CARATS_PER_BANNER;
          const freeValue = b.freePulls * CARATS_PER_PULL;
          const modValue = b.extraModifier * CARATS_PER_PULL;
          cumulativeCost += cost - freeValue - modValue;
        }
        bannerName = banners.map(b => b.name).join(', ');
        consumedDates.add(date);
        break;
      }
    }

    const adjustedCarats = predictedCarats - cumulativeCost;

    results.push({
      weekDate: currentDateStr,
      predictedCarats: Math.round(predictedCarats),
      adjustedCarats: Math.round(adjustedCarats),
      bannerName,
    });

    weekNum++;
    currentTime += oneWeekMs;
  }

  return results;
}

export function formatNumber(n: number): string {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr);
}

export function caratsToPulls(carats: number): number {
  return Math.floor(carats / CARATS_PER_PULL);
}

export function pullsToCarats(pulls: number): number {
  return pulls * CARATS_PER_PULL;
}