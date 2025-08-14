import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryCacheService {
  private readonly store = new Map<string, { value: unknown; expiresAt: number | null }>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : null });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  // keys can be namespace prefixes like 'schedule:student:'
  invalidatePrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }
}
