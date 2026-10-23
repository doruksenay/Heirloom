import { KEYS } from './config';
import { platform } from './native';

/**
 * Anonymous usage analytics (PostHog) and crash reports (Sentry), sent over plain HTTPS.
 *
 * - Nothing is sent until the player says yes (Settings.analytics === true) AND a key is set in config.ts.
 * - No names, no save contents, no device ids: a random install id is the only identifier.
 * - Events are queued and sent in small batches; failures are dropped silently (offline is fine).
 * - In development the events are printed to the console instead.
 */

type Props = Record<string, string | number | boolean | undefined>;

const ANON_KEY = 'heirloom.anon.v1';
const MAX_QUEUE = 200;

let enabled = false;
let installId = '';
let base: Props = {};
let queue: { event: string; properties: Props; timestamp: string }[] = [];
let timer: number | undefined;
const recentErrors = new Set<string>();

function uuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0;
      return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

function getInstallId(): string {
  if (installId) return installId;
  try {
    installId = localStorage.getItem(ANON_KEY) ?? '';
    if (!installId) {
      installId = uuid();
      localStorage.setItem(ANON_KEY, installId);
    }
  } catch {
    installId = uuid(); // storage blocked: a per-session id is fine
  }
  return installId;
}

const isDev = () => {
  try {
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

/** Called on start and whenever settings change. */
export function configureAnalytics(opts: { consent: boolean | undefined; lang: string }) {
  enabled = opts.consent === true;
  base = { platform: platform(), app_version: __APP_VERSION__, lang: opts.lang };
  if (!enabled) queue = [];
}

/** Records one product event, e.g. track('purchase_done', { id: 'pack.fame' }). */
export function track(event: string, props: Props = {}) {
  if (isDev()) console.debug('[analytics]', event, props);
  if (!enabled || !KEYS.posthog.key) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ event, properties: { ...base, ...props }, timestamp: new Date().toISOString() });
  if (queue.length >= 20) void flush();
  else if (timer === undefined) timer = window.setTimeout(() => void flush(), 15000);
}

export async function flush() {
  window.clearTimeout(timer);
  timer = undefined;
  if (!enabled || !KEYS.posthog.key || queue.length === 0) return;
  const batch = queue.map((e) => ({ ...e, distinct_id: getInstallId(), properties: { ...e.properties, $process_person_profile: false } }));
  queue = [];
  try {
    await fetch(`${KEYS.posthog.host}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: KEYS.posthog.key, batch }),
      keepalive: true,
    });
  } catch {
    /* offline: drop the batch */
  }
}

// ------------------------------------------------------------------ crash reports

function parseDsn(dsn: string) {
  const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  return m ? { key: m[1], host: m[2], project: m[3] } : null;
}

/** Sends one error to Sentry. Same message is sent at most once per session. */
export function reportError(err: unknown, context: Props = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  if (isDev()) console.error('[crash]', e, context);
  const dsn = parseDsn(KEYS.sentryDsn);
  if (!enabled || !dsn) return;
  const sig = `${e.name}:${e.message}`;
  if (recentErrors.has(sig) || recentErrors.size > 20) return;
  recentErrors.add(sig);
  const eventId = uuid().replace(/-/g, '');
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    release: `heirloom@${__APP_VERSION__}`,
    environment: isDev() ? 'development' : 'production',
    user: { id: getInstallId() },
    tags: { platform: String(base.platform ?? ''), lang: String(base.lang ?? '') },
    exception: { values: [{ type: e.name, value: e.message }] },
    extra: { stack: e.stack ?? '', ...context },
  };
  const envelope = [JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }), JSON.stringify({ type: 'event' }), JSON.stringify(event)].join('\n');
  void fetch(`https://${dsn.host}/api/${dsn.project}/envelope/?sentry_key=${dsn.key}&sentry_version=7`, {
    method: 'POST',
    body: envelope,
    keepalive: true,
  }).catch(() => undefined);
}

/** Catches errors nobody handled and sends pending events when the app goes to the background. */
export function installGlobalHandlers() {
  window.addEventListener('error', (ev) => reportError(ev.error ?? ev.message, { source: 'window.error' }));
  window.addEventListener('unhandledrejection', (ev) => reportError(ev.reason, { source: 'unhandledrejection' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}
