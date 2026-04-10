import type { TrackerState } from '../types';

const API_BASE = '/api';

export async function saveState(state: TrackerState): Promise<void> {
  try {
    await fetch(`${API_BASE}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (err) {
    console.error('Failed to save state to server:', err);
  }
}

export async function loadState(): Promise<TrackerState | null> {
  try {
    const res = await fetch(`${API_BASE}/state`);
    if (!res.ok) return null;
    const data = await res.json();
    // Check if the state has any data (not just empty defaults)
    if (data && (data.weeklyEntries?.length > 0 || data.bannerEntries?.length > 0)) {
      return data as TrackerState;
    }
    return data as TrackerState;
  } catch (err) {
    console.error('Failed to load state from server:', err);
    return null;
  }
}

export async function clearState(): Promise<void> {
  try {
    await fetch(`${API_BASE}/state`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to clear state on server:', err);
  }
}