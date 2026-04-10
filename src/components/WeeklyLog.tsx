import { useState, useRef, useEffect } from "react";
import type { WeeklyEntry } from "../types";
import { formatNumber, formatDate } from "../utils/calculations";
import { Plus, Trash2, X, History, Pencil, Save } from "lucide-react";
import { CaratIcon } from "./Icons";

interface WeeklyLogProps {
  entries: WeeklyEntry[];
  paidCaratsTotal: number;
  onUpdate: (id: string, updates: Partial<WeeklyEntry>) => void;
  onAdd: (entry: Omit<WeeklyEntry, "id">) => void;
  onDelete: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Shared modal form body (used by both Add and Edit)                 */
/* ------------------------------------------------------------------ */
function EntryModalForm({
  title,
  icon,
  submitLabel,
  paidCaratsTotal,
  previousFreeCarats,
  initialValues,
  onSubmit,
  onClose,
}: {
  title: string;
  icon: React.ReactNode;
  submitLabel: string;
  paidCaratsTotal: number;
  previousFreeCarats: number;
  initialValues: {
    date: string;
    caratSpent: string;
    caratGain: string;
  };
  onSubmit: (values: {
    date: string;
    freeCarats: number;
    caratSpent: number;
    caratGain: number;
  }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState(initialValues);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const num = (v: string) => (v === "" ? 0 : Number(v));

  const gain = num(form.caratGain);
  const spent = num(form.caratSpent);
  const net = gain - spent;
  const computedFree = previousFreeCarats + net;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: form.date,
      freeCarats: computedFree,
      caratSpent: spent,
      caratGain: gain,
    });
  };

  const blockNonNum = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ("eE+.,".includes(e.key)) e.preventDefault();
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-surface rounded-2xl border border-surface-lighter shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 border-b border-surface-lighter">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-lighter transition-colors text-text-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-success mb-1.5">
                Gain
              </label>
              <input
                type="number"
                value={form.caratGain}
                onChange={(e) =>
                  setForm({ ...form, caratGain: e.target.value })
                }
                onKeyDown={blockNonNum}
                placeholder="0"
                autoFocus
                className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-success/50 border border-surface-lighter focus:border-success transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-danger mb-1.5">
                Spent
              </label>
              <input
                type="number"
                value={form.caratSpent}
                onChange={(e) =>
                  setForm({ ...form, caratSpent: e.target.value })
                }
                onKeyDown={blockNonNum}
                placeholder="0"
                className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-danger/50 border border-surface-lighter focus:border-danger transition-colors"
              />
            </div>
          </div>
          {/* Computed summary */}
          <div className="bg-surface-lighter/50 rounded-lg px-4 py-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Previous Balance</span>
              <span className="text-sm">{formatNumber(previousFreeCarats)}</span>
            </div>
            {net !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Net Change</span>
                <span
                  className={`font-medium text-sm ${net >= 0 ? "text-success" : "text-danger"}`}
                >
                  {net >= 0 ? "+" : ""}
                  {formatNumber(net)}
                </span>
              </div>
            )}
            <div className="border-t border-primary/20 pt-1.5 flex justify-between items-center">
              <span className="text-xs font-medium">New Free <CaratIcon /></span>
              <span className="font-semibold text-primary-light text-base">
                {formatNumber(computedFree)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Paid <CaratIcon /></span>
              <span className="text-sm text-text-muted">{formatNumber(paidCaratsTotal)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-text-muted hover:bg-surface-lighter transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium flex items-center gap-2"
            >
              {icon} {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AddWeekModal                                                       */
/* ------------------------------------------------------------------ */
function AddWeekModal({
  defaultDate,
  paidCaratsTotal,
  previousFreeCarats,
  onAdd,
  onClose,
}: {
  defaultDate: string;
  paidCaratsTotal: number;
  previousFreeCarats: number;
  onAdd: (entry: Omit<WeeklyEntry, "id">) => void;
  onClose: () => void;
}) {
  return (
    <EntryModalForm
      title="Add Weekly Entry"
      icon={<Plus className="w-4 h-4" />}
      submitLabel="Add Entry"
      paidCaratsTotal={paidCaratsTotal}
      previousFreeCarats={previousFreeCarats}
      initialValues={{
        date: defaultDate,
        caratSpent: "0",
        caratGain: "0",
      }}
      onSubmit={(v) => {
        const paid = Number(paidCaratsTotal) || 0;
        const total = v.freeCarats + paid;
        onAdd({
          date: v.date,
          freeCarats: v.freeCarats,
          paidCarats: paid,
          totalCarats: total,
          cumulativePulls: Math.floor(total / 150),
          caratSpent: v.caratSpent,
          caratGain: v.caratGain,
          caratNet: v.caratGain - v.caratSpent,
          umaTickets: null,
          umaPulls: 0,
          umaPullsSpent: 0,
          umaPullGain: 0,
          umaPullNet: 0,
          lCarats: 0,
        });
        onClose();
      }}
      onClose={onClose}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  EditWeekModal                                                      */
/* ------------------------------------------------------------------ */
function EditWeekModal({
  entry,
  paidCaratsTotal,
  previousFreeCarats,
  onUpdate,
  onClose,
}: {
  entry: WeeklyEntry;
  paidCaratsTotal: number;
  previousFreeCarats: number;
  onUpdate: (id: string, updates: Partial<WeeklyEntry>) => void;
  onClose: () => void;
}) {
  return (
    <EntryModalForm
      title="Edit Weekly Entry"
      icon={<Save className="w-4 h-4" />}
      submitLabel="Save Changes"
      paidCaratsTotal={paidCaratsTotal}
      previousFreeCarats={previousFreeCarats}
      initialValues={{
        date: entry.date,
        caratSpent: String(entry.caratSpent),
        caratGain: String(entry.caratGain),
      }}
      onSubmit={(v) => {
        const paid = Number(paidCaratsTotal) || 0;
        const total = v.freeCarats + paid;
        onUpdate(entry.id, {
          date: v.date,
          freeCarats: v.freeCarats,
          paidCarats: paid,
          totalCarats: total,
          cumulativePulls: Math.floor(total / 150),
          caratSpent: v.caratSpent,
          caratGain: v.caratGain,
          caratNet: v.caratGain - v.caratSpent,
        });
        onClose();
      }}
      onClose={onClose}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers – classify entries                                         */
/* ------------------------------------------------------------------ */
function classifyEntries(entries: WeeklyEntry[]) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const past: WeeklyEntry[] = [];
  const current: WeeklyEntry[] = [];
  const future: WeeklyEntry[] = [];

  for (const entry of entries) {
    const d = new Date(entry.date);
    if (d < weekStart) {
      past.push(entry);
    } else if (d > weekEnd) {
      future.push(entry);
    } else {
      current.push(entry);
    }
  }

  past.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  current.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  future.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { past, current, future };
}

/* ------------------------------------------------------------------ */
/*  WeeklyLog                                                          */
/* ------------------------------------------------------------------ */
export function WeeklyLog({
  entries,
  paidCaratsTotal,
  onUpdate,
  onAdd,
  onDelete,
}: WeeklyLogProps) {
  const [editingEntry, setEditingEntry] = useState<WeeklyEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { past, current, future } = classifyEntries(entries);

  // Auto-scroll to current week on mount and when past is toggled
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById("current-week-anchor");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [showPast]);

  // Calculate default date for new entry (7 days after most recent)
  const getDefaultDate = () => {
    const allSorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = allSorted[0];
    const lastDate = latest ? new Date(latest.date) : new Date();
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate.toISOString().split("T")[0];
  };

  // Find the entry closest to today among current-week entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closestCurrentId =
    current.length > 0
      ? current.reduce((closest, entry) => {
          const diff = Math.abs(
            new Date(entry.date).getTime() - today.getTime()
          );
          const closestDiff = Math.abs(
            new Date(closest.date).getTime() - today.getTime()
          );
          return diff < closestDiff ? entry : closest;
        }).id
      : null;

  const safePaid = Number(paidCaratsTotal) || 0;

  // Get sorted entries for computing previous balance
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Latest free carats (for Add modal)
  const latestFreeCarats =
    sortedEntries.length > 0
      ? Number(sortedEntries[sortedEntries.length - 1].freeCarats) || 0
      : 0;

  // Get previous free carats for a given entry (for Edit modal)
  const getPreviousFreeCarats = (entryId: string): number => {
    const idx = sortedEntries.findIndex((e) => e.id === entryId);
    if (idx <= 0) return 0;
    return Number(sortedEntries[idx - 1].freeCarats) || 0;
  };

  const renderRow = (
    entry: WeeklyEntry,
    style: "past" | "current" | "future",
    anchorId?: string
  ) => {
    const isPast = style === "past";
    const isCurrent = style === "current";
    const isClosestToToday = entry.id === closestCurrentId;
    const free = Number(entry.freeCarats) || 0;
    const gain = Number(entry.caratGain) || 0;
    const spent = Number(entry.caratSpent) || 0;
    const net = gain - spent;

    return (
      <tr
        key={entry.id}
        id={anchorId}
        className={`border-b transition-colors ${
          isCurrent
            ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
            : isPast
              ? "border-surface-lighter/30 opacity-50 hover:opacity-75"
              : "border-surface-lighter/50 hover:bg-surface-light/50"
        }`}
      >
        {/* 1. Date */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isClosestToToday && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            )}
            <span>{formatDate(entry.date)}</span>
          </div>
        </td>
        {/* 2. Gain – green */}
        <td className="px-4 py-3 text-right text-success">
          {gain > 0 ? `+${formatNumber(gain)}` : formatNumber(gain)}
        </td>
        {/* 3. Spent – red */}
        <td className="px-4 py-3 text-right text-danger">
          {spent > 0 ? `-${formatNumber(spent)}` : formatNumber(spent)}
        </td>
        {/* 4. Net – colored */}
        <td
          className={`px-4 py-3 text-right font-medium ${net > 0 ? "text-success" : net < 0 ? "text-danger" : "text-text-muted"}`}
        >
          {net > 0 ? "+" : ""}
          {formatNumber(net)}
        </td>
        {/* 5. Total free carats */}
        <td className="px-4 py-3 text-right font-medium text-primary-light">
          {formatNumber(free)}
        </td>
        {/* 6. Paid carats */}
        <td className="px-4 py-3 text-right text-text-muted">
          {formatNumber(safePaid)}
        </td>
        {/* Actions */}
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setEditingEntry(entry)}
              className="p-1 rounded hover:bg-primary/20 transition-colors text-text-muted hover:text-primary"
              title="Edit this entry"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1 rounded hover:bg-danger/20 transition-colors text-text-muted hover:text-danger"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const colCount = 7;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weekly Carat Log</h3>
        <div className="flex items-center gap-2">
          {/* Show Past toggle */}
          {past.length > 0 && (
            <button
              onClick={() => setShowPast(!showPast)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                showPast
                  ? "bg-surface-lighter text-text-muted border border-surface-lighter"
                  : "bg-gradient-to-r from-surface-lighter/80 to-surface-lighter border border-surface-lighter hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              }`}
            >
              <History
                className={`w-4 h-4 transition-transform duration-300 ${showPast ? "rotate-0" : "-rotate-45"}`}
              />
              <span>
                {showPast ? "Hide" : "Show"} Past ({past.length})
              </span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add Week
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddWeekModal
          defaultDate={getDefaultDate()}
          paidCaratsTotal={safePaid}
          previousFreeCarats={latestFreeCarats}
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <EditWeekModal
          entry={editingEntry}
          paidCaratsTotal={safePaid}
          previousFreeCarats={getPreviousFreeCarats(editingEntry.id)}
          onUpdate={onUpdate}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {/* Empty state: Initial Balance onboarding */}
      {entries.length === 0 && (
        <InitialBalanceCard paidCaratsTotal={safePaid} onAdd={onAdd} />
      )}

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="bg-surface rounded-xl border border-surface-lighter overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-surface-lighter">
                <th className="px-4 py-3 text-left text-text-muted font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">
                  Gain
                </th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">
                  Spent
                </th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">
                  Net
                </th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">
                  Free <CaratIcon />
                </th>
                <th className="px-4 py-3 text-right text-text-muted font-medium">
                  Paid <CaratIcon />
                </th>
                <th className="px-4 py-3 text-center text-text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Past weeks – greyed out, only shown when toggled */}
              {showPast && past.map((entry) => renderRow(entry, "past"))}

              {/* Divider between past and current */}
              {showPast && past.length > 0 && (
                <tr>
                  <td colSpan={colCount} className="px-0 py-0">
                    <div className="flex items-center gap-3 px-4 py-2 bg-surface-lighter/30">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      <span className="text-[10px] uppercase tracking-widest text-text-muted/60 font-medium">
                        This Week
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                  </td>
                </tr>
              )}

              {/* Current week – highlighted */}
              {current.map((entry, i) =>
                renderRow(
                  entry,
                  "current",
                  i === 0 ? "current-week-anchor" : undefined
                )
              )}

              {/* If no current week entry exists, show a placeholder for scrolling */}
              {current.length === 0 && future.length > 0 && (
                <tr id="current-week-anchor">
                  <td colSpan={colCount} className="px-0 py-0">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      <span className="text-[10px] uppercase tracking-widest text-primary/60 font-medium">
                        ▲ Now ▼
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                  </td>
                </tr>
              )}

              {/* Future weeks */}
              {future.map((entry) => renderRow(entry, "future"))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InitialBalanceCard – shown when no entries exist                    */
/* ------------------------------------------------------------------ */
function InitialBalanceCard({
  paidCaratsTotal,
  onAdd,
}: {
  paidCaratsTotal: number;
  onAdd: (entry: Omit<WeeklyEntry, "id">) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [freeCarats, setFreeCarats] = useState("");

  const blockNonNum = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ("eE+.,".includes(e.key)) e.preventDefault();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const free = Number(freeCarats) || 0;
    const paid = paidCaratsTotal;
    const total = free + paid;
    onAdd({
      date,
      freeCarats: free,
      paidCarats: paid,
      totalCarats: total,
      cumulativePulls: Math.floor(total / 150),
      caratSpent: 0,
      caratGain: 0,
      caratNet: 0,
      umaTickets: null,
      umaPulls: 0,
      umaPullsSpent: 0,
      umaPullGain: 0,
      umaPullNet: 0,
      lCarats: 0,
    });
  };

  return (
    <div className="bg-surface rounded-xl border border-primary/30 p-8 text-center space-y-6">
      <div>
        <CaratIcon className="w-12 h-12 mx-auto mb-3" />
        <h3 className="text-xl font-bold">Welcome to Uma Pull Tracker</h3>
        <p className="text-sm text-text-muted mt-1">
          Enter your current carat balance to get started. This will be your
          baseline — it won&apos;t count as a weekly gain.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto space-y-4 text-left"
      >
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">
            Current Free Carats <CaratIcon className="w-4 h-4" />
          </label>
          <input
            type="number"
            value={freeCarats}
            onChange={(e) => setFreeCarats(e.target.value)}
            onKeyDown={blockNonNum}
            placeholder="e.g. 45000"
            autoFocus
            className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!freeCarats || Number(freeCarats) <= 0}
          className="w-full px-5 py-2.5 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Set Starting Balance
        </button>
      </form>
    </div>
  );
}
