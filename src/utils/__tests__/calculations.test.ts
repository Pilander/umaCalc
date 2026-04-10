import { describe, it, expect } from 'vitest';
import type { WeeklyEntry, BannerEntry } from '../../types';
import {
  getAverageWeeklyGain,
  getLatestTotal,
  getLatestDate,
  weeksBetween,
  calculatePredictions,
  generateWeeklyPredictions,
  formatNumber,
  formatDate,
  caratsToPulls,
  pullsToCarats,
} from '../calculations';

// Helper to create a minimal WeeklyEntry
function makeWeekly(overrides: Partial<WeeklyEntry> & { id: string; date: string }): WeeklyEntry {
  return {
    freeCarats: null,
    paidCarats: null,
    totalCarats: 0,
    cumulativePulls: 0,
    caratSpent: 0,
    caratGain: 0,
    caratNet: 0,
    umaTickets: null,
    umaPulls: 0,
    umaPullsSpent: 0,
    umaPullGain: 0,
    umaPullNet: 0,
    lCarats: 0,
    ...overrides,
  };
}

function makeBanner(overrides: Partial<BannerEntry> & { id: string; name: string }): BannerEntry {
  return {
    weekDate: null,
    freePulls: 0,
    extraModifier: 0,
    type: 'character',
    isWishlist: true,
    ...overrides,
  };
}

describe('getAverageWeeklyGain', () => {
  it('returns 0 for empty entries', () => {
    expect(getAverageWeeklyGain([])).toBe(0);
  });

  it('returns 0 when no entries have positive caratGain', () => {
    const entries = [
      makeWeekly({ id: '1', date: '2025-01-01', caratGain: 0, caratNet: 0 }),
    ];
    expect(getAverageWeeklyGain(entries)).toBe(0);
  });

  it('calculates average of caratNet for entries with positive caratGain', () => {
    const entries = [
      makeWeekly({ id: '1', date: '2025-01-01', caratGain: 5000, caratNet: 3000 }),
      makeWeekly({ id: '2', date: '2025-01-08', caratGain: 7000, caratNet: 5000 }),
      makeWeekly({ id: '3', date: '2025-01-15', caratGain: 0, caratNet: -1000 }), // excluded
    ];
    expect(getAverageWeeklyGain(entries)).toBe(4000); // (3000 + 5000) / 2
  });
});

describe('getLatestTotal', () => {
  it('returns 0 for empty entries', () => {
    expect(getLatestTotal([])).toBe(0);
  });

  it('returns 0 when no entries have totalCarats > 0', () => {
    const entries = [makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 0 })];
    expect(getLatestTotal(entries)).toBe(0);
  });

  it('returns the last entry with totalCarats > 0', () => {
    const entries = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000 }),
      makeWeekly({ id: '2', date: '2025-01-08', totalCarats: 15000 }),
      makeWeekly({ id: '3', date: '2025-01-15', totalCarats: 0 }),
    ];
    expect(getLatestTotal(entries)).toBe(15000);
  });
});

describe('getLatestDate', () => {
  it('returns null for empty entries', () => {
    expect(getLatestDate([])).toBeNull();
  });

  it('returns the date of the last entry with totalCarats > 0', () => {
    const entries = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000 }),
      makeWeekly({ id: '2', date: '2025-01-08', totalCarats: 15000 }),
    ];
    expect(getLatestDate(entries)).toBe('2025-01-08');
  });
});

describe('weeksBetween', () => {
  it('returns 0 for the same date', () => {
    expect(weeksBetween('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('returns 1 for a 7-day difference', () => {
    expect(weeksBetween('2025-01-01', '2025-01-08')).toBe(1);
  });

  it('returns 4 for a 28-day difference', () => {
    expect(weeksBetween('2025-01-01', '2025-01-29')).toBe(4);
  });

  it('handles negative differences', () => {
    expect(weeksBetween('2025-01-08', '2025-01-01')).toBe(-1);
  });
});

describe('calculatePredictions', () => {
  it('returns empty for no weekly entries', () => {
    const banners = [makeBanner({ id: '1', name: 'Test', weekDate: '2025-03-01', isWishlist: true })];
    expect(calculatePredictions([], banners)).toEqual([]);
  });

  it('returns empty when avgGain is 0', () => {
    const weekly = [makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 0 })];
    const banners = [makeBanner({ id: '1', name: 'Test', weekDate: '2025-03-01', isWishlist: true })];
    expect(calculatePredictions(weekly, banners)).toEqual([]);
  });

  it('skips non-wishlisted banners', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Not wanted', weekDate: '2025-03-01', isWishlist: false }),
    ];
    expect(calculatePredictions(weekly, banners)).toEqual([]);
  });

  it('skips undated banners', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Undated', weekDate: null, isWishlist: true }),
    ];
    expect(calculatePredictions(weekly, banners)).toEqual([]);
  });

  it('calculates predictions for a single banner', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Banner A', weekDate: '2025-02-05', isWishlist: true }),
    ];
    const results = calculatePredictions(weekly, banners);
    expect(results).toHaveLength(1);
    expect(results[0].bannerName).toBe('Banner A');
    // 5 weeks * 5000 = 25000 gained, total = 35000
    expect(results[0].predictedCarats).toBe(35000);
    // After pulling: 35000 - 30000 = 5000
    expect(results[0].adjustedCarats).toBe(5000);
  });

  it('card banners cost 60k', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 50000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Support Banner', weekDate: '2025-02-05', isWishlist: true, type: 'card' }),
    ];
    const results = calculatePredictions(weekly, banners);
    expect(results).toHaveLength(1);
    // 5 weeks * 5000 = 25000, total = 75000
    expect(results[0].predictedCarats).toBe(75000);
    // Card costs 60000: 75000 - 60000 = 15000
    expect(results[0].adjustedCarats).toBe(15000);
  });

  it('accounts for free pulls and modifiers', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Free Banner', weekDate: '2025-02-05', isWishlist: true, freePulls: 10, extraModifier: 5 }),
    ];
    const results = calculatePredictions(weekly, banners);
    // predicted = 10000 + 5*5000 = 35000
    // cost = 30000, free = 10*150 = 1500, mod = 5*150 = 750
    // adjusted = 35000 - 30000 + 1500 + 750 = 7250
    expect(results[0].adjustedCarats).toBe(7250);
  });
});

describe('generateWeeklyPredictions', () => {
  it('returns empty for no weekly entries', () => {
    expect(generateWeeklyPredictions([], [])).toEqual([]);
  });

  it('generates weekly prediction points', () => {
    const weekly = [
      makeWeekly({ id: '1', date: '2025-01-01', totalCarats: 10000, caratGain: 5000, caratNet: 5000 }),
    ];
    const banners = [
      makeBanner({ id: '1', name: 'Banner A', weekDate: '2025-02-05', isWishlist: true }),
    ];
    const results = generateWeeklyPredictions(weekly, banners);
    expect(results.length).toBeGreaterThan(0);
    // First point should be at latest date with latest total
    expect(results[0].predictedCarats).toBe(10000);
    // There should be a point with the banner name
    const bannerPoint = results.find(r => r.bannerName !== null);
    expect(bannerPoint).toBeDefined();
    expect(bannerPoint!.bannerName).toContain('Banner A');
  });
});

describe('formatNumber', () => {
  it('formats 0', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles NaN', () => {
    expect(formatNumber(NaN)).toBe('0');
  });

  it('handles null-like', () => {
    expect(formatNumber(null as unknown as number)).toBe('0');
  });

  it('formats large numbers with locale separators', () => {
    const result = formatNumber(1234567);
    // Just check it's a non-empty string (locale-dependent)
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDate', () => {
  it('formats ISO date to DD/MM/YY', () => {
    expect(formatDate('2025-03-15')).toBe('15/03/25');
  });

  it('formats single-digit day and month', () => {
    expect(formatDate('2025-01-05')).toBe('05/01/25');
  });
});

describe('caratsToPulls', () => {
  it('converts carats to pulls (150 per pull)', () => {
    expect(caratsToPulls(1500)).toBe(10);
  });

  it('floors partial pulls', () => {
    expect(caratsToPulls(200)).toBe(1);
  });

  it('returns 0 for less than 150', () => {
    expect(caratsToPulls(100)).toBe(0);
  });
});

describe('pullsToCarats', () => {
  it('converts pulls to carats (150 per pull)', () => {
    expect(pullsToCarats(10)).toBe(1500);
  });

  it('returns 0 for 0 pulls', () => {
    expect(pullsToCarats(0)).toBe(0);
  });
});