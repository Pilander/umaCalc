import { useState, useEffect, useCallback } from 'react';
import type { TrackerState, WeeklyEntry, BannerEntry, PaidCaratPurchase } from '../types';
import { saveState, loadState, clearState } from '../utils/storage';
import { defaultState } from '../data/seedData';

function makeId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Migrate old state: convert wishlist entries into undated banner entries
 * and add isWishlist field to existing banners that don't have it.
 */
function migrateState(state: TrackerState): TrackerState {
  const migrated = { ...state };

  // Ensure all banner entries have the isWishlist field
  migrated.bannerEntries = migrated.bannerEntries.map(b => ({
    ...b,
    isWishlist: b.isWishlist ?? true, // old banners default to wishlisted
  }));

  // Migrate old wishlist entries into banner entries
  if (migrated.wishlist && migrated.wishlist.length > 0) {
    const existingNames = new Set(migrated.bannerEntries.map(b => b.name.toLowerCase()));

    for (const w of migrated.wishlist) {
      // Skip if a banner with the same name already exists
      if (existingNames.has(w.name.toLowerCase())) continue;

      migrated.bannerEntries.push({
        id: makeId(),
        weekDate: w.estimatedDate || null,
        name: w.name,
        isSSR: false,
        freePulls: 0,
        extraModifier: 0,
        type: w.type === 'card' ? 'card' : 'character',
        isWishlist: true,
      });
    }

    // Clear the old wishlist
    migrated.wishlist = [];
  }

  return migrated;
}

export function useTrackerState() {
  const [state, setState] = useState<TrackerState>(() => {
    const saved = loadState();
    if (saved) return migrateState(saved);
    return defaultState;
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateWeeklyEntry = useCallback((id: string, updates: Partial<WeeklyEntry>) => {
    setState(prev => ({
      ...prev,
      weeklyEntries: prev.weeklyEntries.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  }, []);

  const addWeeklyEntry = useCallback((entry: Omit<WeeklyEntry, 'id'>) => {
    setState(prev => ({
      ...prev,
      weeklyEntries: [...prev.weeklyEntries, { ...entry, id: makeId() }],
    }));
  }, []);

  const deleteWeeklyEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      weeklyEntries: prev.weeklyEntries.filter(e => e.id !== id),
    }));
  }, []);

  const updateBannerEntry = useCallback((id: string, updates: Partial<BannerEntry>) => {
    setState(prev => ({
      ...prev,
      bannerEntries: prev.bannerEntries.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  }, []);

  const addBannerEntry = useCallback((entry: Omit<BannerEntry, 'id'>) => {
    setState(prev => ({
      ...prev,
      bannerEntries: [...prev.bannerEntries, { ...entry, id: makeId() }],
    }));
  }, []);

  const deleteBannerEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      bannerEntries: prev.bannerEntries.filter(e => e.id !== id),
    }));
  }, []);

  const moveBanner = useCallback((bannerId: string, newWeekDate: string) => {
    setState(prev => ({
      ...prev,
      bannerEntries: prev.bannerEntries.map(e =>
        e.id === bannerId ? { ...e, weekDate: newWeekDate } : e
      ),
    }));
  }, []);

  const swapBanners = useCallback((id1: string, id2: string) => {
    setState(prev => {
      const b1 = prev.bannerEntries.find(e => e.id === id1);
      const b2 = prev.bannerEntries.find(e => e.id === id2);
      if (!b1 || !b2) return prev;
      return {
        ...prev,
        bannerEntries: prev.bannerEntries.map(e => {
          if (e.id === id1) return { ...e, weekDate: b2.weekDate };
          if (e.id === id2) return { ...e, weekDate: b1.weekDate };
          return e;
        }),
      };
    });
  }, []);

  const addPaidCaratPurchase = useCallback((entry: Omit<PaidCaratPurchase, 'id'>) => {
    setState(prev => ({
      ...prev,
      paidCaratPurchases: [...(prev.paidCaratPurchases || []), { ...entry, id: makeId() }],
    }));
  }, []);

  const deletePaidCaratPurchase = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      paidCaratPurchases: (prev.paidCaratPurchases || []).filter(e => e.id !== id),
    }));
  }, []);

  const emptyState: TrackerState = {
    weeklyEntries: [],
    bannerEntries: [],
    wishlist: [],
    paidCaratPurchases: [],
    paidCaratsConstant: 0,
  };

  const resetToDefault = useCallback(() => {
    clearState();
    setState(emptyState);
  }, []);

  return {
    state: { ...state, paidCaratPurchases: state.paidCaratPurchases || [] },
    updateWeeklyEntry,
    addWeeklyEntry,
    deleteWeeklyEntry,
    updateBannerEntry,
    addBannerEntry,
    deleteBannerEntry,
    moveBanner,
    swapBanners,
    addPaidCaratPurchase,
    deletePaidCaratPurchase,
    resetToDefault,
  };
}