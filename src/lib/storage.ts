// ============================================================
// NIRNAY — LocalStorage Persistence
// ============================================================

import type { SavedDecision } from '../types/decision';

const STORAGE_KEY = 'nirnay_decisions';

function loadAll(): SavedDecision[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDecision[];
  } catch {
    return [];
  }
}

function saveAll(decisions: SavedDecision[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch {
    // LocalStorage quota exceeded — silently fail
  }
}

export function getAllDecisions(): SavedDecision[] {
  return loadAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getDecision(id: string): SavedDecision | null {
  return loadAll().find((d) => d.id === id) ?? null;
}

export function saveDecision(decision: SavedDecision): void {
  const all = loadAll();
  const idx = all.findIndex((d) => d.id === decision.id);
  const updated = { ...decision, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.push(updated);
  }
  saveAll(all);
}

export function deleteDecision(id: string): void {
  const all = loadAll().filter((d) => d.id !== id);
  saveAll(all);
}

export function duplicateDecision(id: string): SavedDecision | null {
  const original = getDecision(id);
  if (!original) return null;
  const copy: SavedDecision = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveDecision(copy);
  return copy;
}

export function renameDecision(id: string, newName: string): void {
  const all = loadAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx >= 0) {
    all[idx].name = newName;
    all[idx].updatedAt = new Date().toISOString();
    saveAll(all);
  }
}
