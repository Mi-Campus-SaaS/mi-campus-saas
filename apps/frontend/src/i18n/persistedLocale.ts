export const supportedLocales = ['es', 'en'] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const LOCALE_STORAGE_KEY = 'miCampus.locale';

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

function getLocalStorage(): Storage | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  return 'localStorage' in globalThis ? globalThis.localStorage : undefined;
}

export function readPersistedLocale(): SupportedLocale | undefined {
  const storage = getLocalStorage();
  if (!storage) return undefined;
  const raw = storage.getItem(LOCALE_STORAGE_KEY);
  if (!raw) return undefined;
  return isSupportedLocale(raw) ? raw : undefined;
}

export function persistLocale(locale: SupportedLocale): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function getPreferredLocale(fallback: SupportedLocale = 'es'): SupportedLocale {
  return readPersistedLocale() ?? fallback;
}
