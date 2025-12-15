import * as Sentry from '@sentry/node';

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function scrubValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > 2048) return value.slice(0, 2048);
    return value;
  }
  if (Array.isArray(value)) return value.map(scrubValue).slice(0, 50);
  if (!isRecord(value)) return value;

  const out: JsonObject = {};
  for (const [k, v] of Object.entries(value)) {
    const key = k.toLowerCase();
    if (
      key.includes('authorization') ||
      key.includes('cookie') ||
      key.includes('set-cookie') ||
      key.includes('password') ||
      key.includes('token') ||
      key.includes('secret') ||
      key.includes('email')
    ) {
      out[k] = '[Filtered]';
      continue;
    }
    out[k] = scrubValue(v);
  }
  return out;
}

function scrubEvent(event: unknown): unknown {
  if (!isRecord(event)) return event;
  const next: JsonObject = { ...event };

  if (isRecord(next.request)) {
    const req = { ...next.request } as JsonObject;
    if (typeof req.url === 'string') req.url = req.url.split('?', 1)[0];
    delete req.cookies;
    delete req.data;
    delete req.headers;
    next.request = req;
  }

  if (isRecord(next.user)) {
    const user = { ...next.user } as JsonObject;
    delete user.email;
    delete user.ip_address;
    next.user = user;
  }

  next.extra = scrubValue(next.extra);
  next.contexts = scrubValue(next.contexts);
  next.breadcrumbs = scrubValue(next.breadcrumbs);

  return next;
}

let enabled = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    beforeSend: (event) => scrubEvent(event) as typeof event,
  });

  enabled = true;
}

export function captureException(
  exception: unknown,
  context: {
    readonly status?: number;
    readonly method?: string;
    readonly path?: string;
    readonly userId?: string;
  } = {},
): void {
  if (!enabled) return;

  Sentry.withScope((scope) => {
    if (context.status !== undefined) scope.setTag('http.status_code', String(context.status));
    if (context.method) scope.setTag('http.method', context.method);
    if (context.path) scope.setTag('http.route', context.path);
    if (context.userId) scope.setUser({ id: context.userId });
    Sentry.captureException(exception);
  });
}
