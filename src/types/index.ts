export interface WeeklyEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  freeCarats: number | null;
  paidCarats: number | null;
  totalCarats: number;
  cumulativePulls: number;
  caratSpent: number;
  caratGain: number;
  caratNet: number;
  umaTickets: number | null;
  umaPulls: number;
  umaPullsSpent: number;
  umaPullGain: number;
  umaPullNet: number;
  lCarats: number;
}

export interface BannerEntry {
  id: string;
  weekDate: string | null; // ISO date string – null if date unknown
  endDate?: string; // ISO date string - banner end date (default: startDate + 9 days)
  name: string; // Banner name
  freePulls: number; // Free pull modifier
  extraModifier: number; // Additional modifier (e.g., -100 for SiL/Gentil)
  type: 'character' | 'card' | 'both'; // Banner type
  isWishlist: boolean; // Whether the user wants to pull on this banner
}

/** @deprecated – kept as alias for backward compatibility during migration */
export interface WishlistEntry {
  id: string;
  name: string;
  estimatedDate: string | null;
  type?: 'character' | 'card';
}

export interface PaidCaratPurchase {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number;
  note: string; // e.g., "Monthly Pack", "Special Sale"
}

export interface TrackerState {
  weeklyEntries: WeeklyEntry[];
  bannerEntries: BannerEntry[];
  wishlist: WishlistEntry[]; // kept for migration – will be empty after migration
  paidCaratPurchases: PaidCaratPurchase[];
  paidCaratsConstant: number; // Default 442 – kept for backward compat
}

export interface PredictionResult {
  weekDate: string;
  bannerName: string;
  predictedCarats: number;
  adjustedCarats: number;
  freePulls: number;
  extraModifier: number;
}

export type TabId = 'dashboard' | 'weekly' | 'banners' | 'wishlist';