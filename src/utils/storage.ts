import type { TrackerState } from '../types';

const STORAGE_KEY = 'uma-pull-tracker';

export function saveState(state: TrackerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState(): TrackerState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TrackerState;
  } catch {
    return null;
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}