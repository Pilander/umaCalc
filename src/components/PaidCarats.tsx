import { useState, useRef, useEffect } from "react";
import type { PaidCaratPurchase } from "../types";
import { formatNumber, formatDate } from "../utils/calculations";
import { Plus, Trash2, X, CreditCard } from "lucide-react";
import { CaratIcon } from "./Icons";

interface PaidCaratsProps {
  purchases: PaidCaratPurchase[];
  onAdd: (entry: Omit<PaidCaratPurchase, "id">) => void;
  onDelete: (id: string) => void;
}

export function PaidCarats({ purchases, onAdd, onDelete }: PaidCaratsProps) {
  const [showAdd, setShowAdd] = useState(false);
  const totalPaid = purchases.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <div>
            <h4 className="text-sm font-semibold">Paid Carats</h4>
            <p className="text-xs text-text-muted">One-time purchases</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary-light flex items-center gap-1">
            {formatNumber(totalPaid)} <CaratIcon className="w-5 h-5" />
          </span>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg hover:bg-primary-dark transition-colors text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Add Purchase
          </button>
        </div>
      </div>

      {purchases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {purchases
            .sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-surface-lighter rounded-lg px-3 py-1.5 text-xs"
              >
                <span className="text-text-muted">{formatDate(p.date)}</span>
                <span className="font-medium text-primary-light">
                  +{formatNumber(p.amount)}
                </span>
                {p.note && (
                  <span className="text-text-muted">({p.note})</span>
                )}
                <button
                  onClick={() => onDelete(p.id)}
                  className="p-0.5 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      )}

      {showAdd && (
        <AddPurchaseModal onAdd={onAdd} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

function AddPurchaseModal({
  onAdd,
  onClose,
}: {
  onAdd: (entry: Omit<PaidCaratPurchase, "id">) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      date,
      amount: Number(amount) || 0,
      note,
    });
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-surface rounded-2xl border border-surface-lighter shadow-2xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center px-6 py-4 border-b border-surface-lighter">
          <h3 className="text-lg font-semibold">Add Paid Carat Purchase</h3>
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
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Monthly Pack"
              className="w-full bg-surface-lighter rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 border border-surface-lighter focus:border-primary transition-colors"
            />
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
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}