import { useState, useMemo, useRef, useEffect } from 'react';
import type { BannerEntry, WeeklyEntry } from '../types';
import { calculatePredictions, getLatestTickets, formatNumber, formatDateShort } from '../utils/calculations';
import { Plus, Trash2, Edit2, X, ArrowUpDown, Search, Heart, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { CaratIcon } from './Icons';

interface BannerTimelineProps {
  bannerEntries: BannerEntry[];
  weeklyEntries: WeeklyEntry[];
  onUpdate: (id: string, updates: Partial<BannerEntry>) => void;
  onAdd: (entry: Omit<BannerEntry, 'id'>) => void;
  onDelete: (id: string) => void;
  onSwap: (id1: string, id2: string) => void;
}

/** Add N days to a date string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function TypeTag({ type }: { type: 'character' | 'card' | 'both' }) {
  if (type === 'card') {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 whitespace-nowrap">
        Support
      </span>
    );
  }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 whitespace-nowrap">
        Character
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Edit Banner Modal                                            */
/* ------------------------------------------------------------------ */
interface BannerModalProps {
  title: string;
  initial?: {
    name: string;
    type: 'character' | 'card';
    startDate: string | null;
    endDate: string;
    freePulls: number;
    extraModifier: number;
    isWishlist: boolean;
  };
  onSubmit: (data: {
    name: string;
    type: 'character' | 'card';
    startDate: string | null;
    endDate: string;
    freePulls: number;
    extraModifier: number;
    isWishlist: boolean;
  }) => void;
  onClose: () => void;
}

function BannerModal({ title, initial, onSubmit, onClose }: BannerModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [dateUnknown, setDateUnknown] = useState(initial?.startDate === null);
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? ('character' as 'character' | 'card'),
    startDate: initial?.startDate ?? today,
    endDate: initial?.endDate ?? addDays(today, 9),
    freePulls: String(initial?.freePulls ?? 0),
    extraModifier: String(initial?.extraModifier ?? 0),
    isWishlist: initial?.isWishlist ?? true,
  });

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // When start date changes, auto-update end date to +9 days
  const handleStartDateChange = (newStartDate: string) => {
    const autoEnd = addDays(newStartDate, 9);
    const currentAutoEnd = form.startDate ? addDays(form.startDate, 9) : '';
    setForm(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: prev.endDate === currentAutoEnd ? autoEnd : prev.endDate,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      startDate: dateUnknown ? null : (form.startDate || today),
      endDate: dateUnknown ? '' : form.endDate,
      freePulls: Number(form.freePulls) || 0,
      extraModifier: Number(form.extraModifier) || 0,
      isWishlist: form.isWishlist,
    });
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-surface rounded-2xl border border-surface-lighter shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-surface-lighter">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-lighter transition-colors text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Banner Name */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Banner Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Nishino, SSR Pasa..."
              autoFocus
              required
              className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
            />
          </div>

          {/* Type + Wishlist */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'character' | 'card' })}
                className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
              >
                <option value="character">Character</option>
                <option value="card">Support Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Wishlist</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isWishlist: !form.isWishlist })}
                className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-2 border transition-colors ${
                  form.isWishlist
                    ? 'bg-danger/10 border-danger/30 text-danger'
                    : 'bg-surface-lighter border-surface-lighter text-text-muted'
                }`}
              >
                <Heart className={`w-4 h-4 ${form.isWishlist ? 'fill-current' : ''}`} />
                {form.isWishlist ? 'Wishlisted' : 'Not wishlisted'}
              </button>
            </div>
          </div>

          {/* Date Unknown Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={dateUnknown}
                onChange={(e) => setDateUnknown(e.target.checked)}
                className="rounded border-surface-lighter"
              />
              <span className="text-text-muted">Date unknown</span>
            </label>
          </div>

          {/* Start Date + End Date (only if date known) */}
          {!dateUnknown && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={form.startDate || ''}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          {/* Free Pulls + Modifier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Free Pulls</label>
              <input
                type="number"
                value={form.freePulls}
                onChange={(e) => setForm({ ...form, freePulls: e.target.value })}
                className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Modifier (pulls)</label>
              <input
                type="number"
                value={form.extraModifier}
                onChange={(e) => setForm({ ...form, extraModifier: e.target.value })}
                className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-lighter transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {initial ? 'Save Changes' : 'Add Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Banner Timeline Main Component                                     */
/* ------------------------------------------------------------------ */
export function BannerTimeline({ bannerEntries, weeklyEntries, onUpdate, onAdd, onDelete, onSwap }: BannerTimelineProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerEntry | null>(null);
  const [swapMode, setSwapMode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUndated, setShowUndated] = useState(false);

  // Only dated banners for predictions
  const datedBanners = useMemo(() =>
    bannerEntries.filter(b => b.weekDate !== null),
    [bannerEntries]
  );

  const predictions = useMemo(
    () => calculatePredictions(weeklyEntries, datedBanners),
    [weeklyEntries, datedBanners]
  );

  const latestTickets = useMemo(() => getLatestTickets(weeklyEntries), [weeklyEntries]);

  // Project tickets forward: use tickets as fallback when carats insufficient
  // Each ticket = 1 pull = 150 carats worth
  const ticketsByBannerId = useMemo(() => {
    const map = new Map<string, number>();
    let charRemaining = latestTickets.characterTickets;
    let supRemaining = latestTickets.supportTickets;

    // Process wishlisted dated banners in chronological order
    const wishlistedDated = [...datedBanners]
      .filter(b => b.isWishlist)
      .sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime());

    for (const banner of wishlistedDated) {
      const pred = predictions.find(p => p.weekDate === banner.weekDate && p.bannerName === banner.name);
      const isSupport = banner.type === 'card';
      const available = isSupport ? supRemaining : charRemaining;

      if (pred && pred.budgetCarats < pred.bannerCost) {
        // Shortfall in carats — use tickets to cover
        const shortfall = pred.bannerCost - pred.budgetCarats;
        const ticketsNeeded = Math.ceil(shortfall / 150);
        const ticketsUsed = Math.min(ticketsNeeded, available);
        const remaining = available - ticketsUsed;
        map.set(banner.id, remaining);
        if (isSupport) supRemaining = remaining;
        else charRemaining = remaining;
      } else {
        // Enough carats — no tickets consumed
        map.set(banner.id, available);
      }
    }

    // Non-wishlisted banners just show current totals based on type
    for (const banner of datedBanners) {
      if (!map.has(banner.id)) {
        map.set(banner.id, banner.type === 'card' ? supRemaining : charRemaining);
      }
    }

    return map;
  }, [latestTickets, datedBanners, predictions]);

  const sortedDatedBanners = useMemo(() =>
    [...datedBanners].sort((a, b) => new Date(a.weekDate!).getTime() - new Date(b.weekDate!).getTime()),
    [datedBanners]
  );

  const undatedBanners = useMemo(() =>
    bannerEntries.filter(b => b.weekDate === null).sort((a, b) => a.name.localeCompare(b.name)),
    [bannerEntries]
  );

  const displayBanners = useMemo(() => {
    if (!searchQuery.trim()) return sortedDatedBanners;
    const q = searchQuery.toLowerCase();
    return sortedDatedBanners.filter(b => b.name.toLowerCase().includes(q));
  }, [sortedDatedBanners, searchQuery]);

  const filteredUndated = useMemo(() => {
    if (!searchQuery.trim()) return undatedBanners;
    const q = searchQuery.toLowerCase();
    return undatedBanners.filter(b => b.name.toLowerCase().includes(q));
  }, [undatedBanners, searchQuery]);

  const getPrediction = (weekDate: string, name: string) =>
    predictions.find(p => p.weekDate === weekDate && p.bannerName === name);

  const handleSwapClick = (id: string) => {
    if (swapMode === null) {
      setSwapMode(id);
    } else if (swapMode === id) {
      setSwapMode(null);
    } else {
      onSwap(swapMode, id);
      setSwapMode(null);
    }
  };

  const handleAddSubmit = (data: { name: string; type: 'character' | 'card'; startDate: string | null; endDate: string; freePulls: number; extraModifier: number; isWishlist: boolean }) => {
    onAdd({
      weekDate: data.startDate,
      endDate: data.startDate ? data.endDate : undefined,
      name: data.name,
      freePulls: data.freePulls,
      extraModifier: data.extraModifier,
      type: data.type,
      isWishlist: data.isWishlist,
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (data: { name: string; type: 'character' | 'card'; startDate: string | null; endDate: string; freePulls: number; extraModifier: number; isWishlist: boolean }) => {
    if (!editingBanner) return;
    onUpdate(editingBanner.id, {
      weekDate: data.startDate,
      endDate: data.startDate ? data.endDate : undefined,
      name: data.name,
      freePulls: data.freePulls,
      extraModifier: data.extraModifier,
      type: data.type,
      isWishlist: data.isWishlist,
    });
    setEditingBanner(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Banner Timeline</h3>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banners..."
              className="bg-surface-lighter rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary w-44"
            />
          </div>
          {swapMode && (
            <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded">
              Click another banner to swap
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Dated Banners Table */}
      <div className="bg-surface rounded-xl border border-surface-lighter overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-lighter">
                <th className="px-3 py-3 text-center text-text-muted font-medium w-10">
                  <Heart className="w-3.5 h-3.5 mx-auto" />
                </th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">Start Date</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">End Date</th>
                <th className="px-4 py-3 text-left text-text-muted font-medium">Banner</th>
                <th className="px-4 py-3 text-center text-text-muted font-medium">Type</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">Free Pulls</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">Modifier</th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">Predicted <CaratIcon /></th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">Budget <CaratIcon /></th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">After Pull <CaratIcon /></th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">Tickets 🎫</th>
                <th className="px-4 py-3 text-center text-text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayBanners.length === 0 && (
                <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-text-muted">
                    No dated banners yet. Click <strong>Add Banner</strong> to get started.
                  </td>
                </tr>
              )}
              {displayBanners.map((banner) => {
                const pred = getPrediction(banner.weekDate!, banner.name);
                const isSwapTarget = swapMode === banner.id;
                const endDate = banner.endDate || addDays(banner.weekDate!, 9);

                return (
                  <tr
                    key={banner.id}
                    className={`border-b border-surface-lighter/50 transition-colors ${
                      isSwapTarget
                        ? 'bg-warning/10'
                        : banner.isWishlist
                          ? 'bg-primary/5 hover:bg-primary/10'
                          : 'hover:bg-surface-light'
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onUpdate(banner.id, { isWishlist: !banner.isWishlist })}
                        className={`p-1 rounded transition-colors ${
                          banner.isWishlist
                            ? 'text-danger hover:bg-danger/10'
                            : 'text-text-muted/30 hover:text-danger/50 hover:bg-danger/5'
                        }`}
                        title={banner.isWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart className={`w-4 h-4 ${banner.isWishlist ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateShort(banner.weekDate!)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-muted">
                      {formatDateShort(endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{banner.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TypeTag type={banner.type} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {banner.freePulls > 0 && <span className="text-accent">{banner.freePulls}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {banner.extraModifier !== 0 && (
                        <span className={banner.extraModifier > 0 ? 'text-success' : 'text-danger'}>
                          {banner.extraModifier > 0 ? '+' : ''}{banner.extraModifier}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pred && (
                        <span className="text-text-muted">{formatNumber(pred.predictedCarats)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pred && (
                        <span className={`font-medium ${pred.budgetCarats >= 0 ? 'text-accent' : 'text-danger'}`}>
                          {formatNumber(pred.budgetCarats)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {pred && (
                        <span className={`font-medium ${pred.adjustedCarats >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatNumber(pred.adjustedCarats)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const tickets = ticketsByBannerId.get(banner.id) ?? 0;
                        const color = banner.type === 'card' ? 'text-amber-400' : 'text-sky-400';
                        return tickets > 0
                          ? <span className={color}>{tickets}</span>
                          : <span className="text-text-muted/30">0</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingBanner(banner)}
                          className="p-1 rounded hover:bg-surface-lighter transition-colors text-text-muted"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSwapClick(banner.id)}
                          className={`p-1 rounded transition-colors ${
                            isSwapTarget ? 'bg-warning/20 text-warning' : 'hover:bg-surface-lighter text-text-muted'
                          }`}
                          title="Swap position"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(banner.id)}
                          className="p-1 rounded hover:bg-danger/20 transition-colors text-text-muted hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Undated Banners Section */}
      {(filteredUndated.length > 0 || (searchQuery && undatedBanners.length > 0)) && (
        <div>
          <button
            onClick={() => setShowUndated(!showUndated)}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-3"
          >
            {showUndated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <HelpCircle className="w-4 h-4 text-warning/60" />
            <span className="text-sm font-medium">
              Undated Banners ({filteredUndated.length})
            </span>
          </button>

          {showUndated && (
            <div className="bg-surface/50 rounded-xl border border-surface-lighter overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm opacity-70">
                  <tbody>
                    {filteredUndated.map((banner) => (
                      <tr key={banner.id} className="border-b border-surface-lighter/50 hover:bg-surface-light/50 transition-colors">
                        <td className="px-3 py-3 text-center w-10">
                          <button
                            onClick={() => onUpdate(banner.id, { isWishlist: !banner.isWishlist })}
                            className={`p-1 rounded transition-colors ${
                              banner.isWishlist
                                ? 'text-danger hover:bg-danger/10'
                                : 'text-text-muted/30 hover:text-danger/50 hover:bg-danger/5'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${banner.isWishlist ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-text-muted italic whitespace-nowrap">No date</td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{banner.name}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TypeTag type={banner.type} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingBanner(banner)}
                              className="p-1 rounded hover:bg-surface-lighter transition-colors text-text-muted"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(banner.id)}
                              className="p-1 rounded hover:bg-danger/20 transition-colors text-text-muted hover:text-danger"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Banner Modal */}
      {showAddModal && (
        <BannerModal
          title="Add Banner"
          onSubmit={handleAddSubmit}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Banner Modal */}
      {editingBanner && (
        <BannerModal
          title="Edit Banner"
          initial={{
            name: editingBanner.name,
            type: editingBanner.type === 'both' ? 'character' : editingBanner.type,
            startDate: editingBanner.weekDate,
            endDate: editingBanner.endDate || (editingBanner.weekDate ? addDays(editingBanner.weekDate, 9) : ''),
            freePulls: editingBanner.freePulls,
            extraModifier: editingBanner.extraModifier,
            isWishlist: editingBanner.isWishlist,
          }}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingBanner(null)}
        />
      )}
    </div>
  );
}