import { useState } from 'react';
import type { BannerEntry } from '../types';
import { formatDate } from '../utils/calculations';
import { Star, ChevronDown, ChevronUp, CheckCircle2, Heart, HeartOff, Calendar, HelpCircle } from 'lucide-react';

interface WishlistProps {
  bannerEntries: BannerEntry[];
  onUpdate: (id: string, updates: Partial<BannerEntry>) => void;
  onAdd: (entry: Omit<BannerEntry, 'id'>) => void;
  onDelete: (id: string) => void;
}

function TypeTag({ type }: { type: 'character' | 'card' | 'both' }) {
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
        Char + Support
      </span>
    );
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">
      Character
    </span>
  );
}

export function Wishlist({ bannerEntries, onUpdate }: WishlistProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showUndated, setShowUndated] = useState(true);

  const [nowMs] = useState(() => Date.now());

  // Wishlisted banners only
  const wishlistedBanners = bannerEntries.filter(b => b.isWishlist);

  // Dated + upcoming
  const datedUpcoming = wishlistedBanners
    .filter(b => b.weekDate && new Date(b.weekDate).getTime() >= nowMs)
    .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());

  // Dated + past (completed)
  const datedPast = wishlistedBanners
    .filter(b => b.weekDate && new Date(b.weekDate).getTime() < nowMs)
    .sort((a, b) => new Date(b.weekDate!).getTime() - new Date(a.weekDate!).getTime());

  // Undated (date unknown)
  const undated = wishlistedBanners
    .filter(b => !b.weekDate)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Non-wishlisted banners (for "All Banners" toggle)
  const nonWishlisted = bannerEntries
    .filter(b => !b.isWishlist && b.weekDate)
    .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());

  const totalWishlisted = wishlistedBanners.length;
  const datedCount = datedUpcoming.length;
  const undatedCount = undated.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-warning" />
          Wishlist ({totalWishlisted})
          <span className="text-sm font-normal text-text-muted">
            · {datedCount} dated · {undatedCount} undated
          </span>
        </h3>
      </div>

      <p className="text-sm text-text-muted">
        Toggle the <Heart className="w-3.5 h-3.5 inline text-danger" /> icon on any banner in the <strong>Banners</strong> tab to add or remove it from your wishlist.
      </p>

      {/* Dated Upcoming */}
      {datedUpcoming.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming ({datedUpcoming.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {datedUpcoming.map((banner) => {
              const daysUntil = Math.ceil((new Date(banner.weekDate!).getTime() - nowMs) / (1000 * 60 * 60 * 24));
              return (
                <WishlistCard
                  key={banner.id}
                  banner={banner}
                  subtitle={`${formatDate(banner.weekDate!)} · ${daysUntil} days`}
                  onToggleWishlist={() => onUpdate(banner.id, { isWishlist: false })}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Undated */}
      {undated.length > 0 && (
        <div>
          <button
            onClick={() => setShowUndated(!showUndated)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-3"
          >
            {showUndated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <HelpCircle className="w-4 h-4 text-warning/60" />
            <span className="text-sm font-medium">
              Date Unknown ({undated.length})
            </span>
          </button>

          {showUndated && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-70">
              {undated.map((banner) => (
                <WishlistCard
                  key={banner.id}
                  banner={banner}
                  subtitle="Date unknown"
                  muted
                  onToggleWishlist={() => onUpdate(banner.id, { isWishlist: false })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed / Past */}
      {datedPast.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-3"
          >
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <CheckCircle2 className="w-4 h-4 text-success/60" />
            <span className="text-sm font-medium">
              Completed ({datedPast.length})
            </span>
          </button>

          {showCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50">
              {datedPast.map((banner) => (
                <WishlistCard
                  key={banner.id}
                  banner={banner}
                  subtitle={formatDate(banner.weekDate!)}
                  completed
                  onToggleWishlist={() => onUpdate(banner.id, { isWishlist: false })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Non-wishlisted banners info */}
      {nonWishlisted.length > 0 && (
        <div className="text-center py-4 text-text-muted text-sm border-t border-surface-lighter mt-6 pt-6">
          <p>{nonWishlisted.length} banners in your timeline are not wishlisted.</p>
          <p className="text-xs mt-1">Toggle them in the Banners tab to add to wishlist.</p>
        </div>
      )}

      {/* Empty state */}
      {totalWishlisted === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No wishlisted banners</p>
          <p className="text-sm">Go to the <strong>Banners</strong> tab and click the heart icon to wishlist banners you want to pull on.</p>
        </div>
      )}
    </div>
  );
}

function WishlistCard({
  banner,
  subtitle,
  completed,
  muted,
  onToggleWishlist,
}: {
  banner: BannerEntry;
  subtitle: string;
  completed?: boolean;
  muted?: boolean;
  onToggleWishlist: () => void;
}) {
  return (
    <div
      className={`bg-surface rounded-xl p-4 border transition-colors ${
        completed
          ? 'border-surface-lighter'
          : muted
            ? 'border-warning/20'
            : 'border-surface-lighter hover:border-primary/30'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeTag type={banner.type} />
            {banner.isSSR && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-danger/20 text-danger">SSR</span>
            )}
          </div>
          <h4 className={`font-medium ${completed ? 'line-through' : ''}`}>{banner.name}</h4>
          <p className="text-sm text-text-muted">{subtitle}</p>
          {banner.freePulls > 0 && (
            <p className="text-xs text-accent">{banner.freePulls} free pulls</p>
          )}
        </div>
        <button
          onClick={onToggleWishlist}
          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-danger/70 hover:text-danger"
          title="Remove from wishlist"
        >
          <HeartOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}