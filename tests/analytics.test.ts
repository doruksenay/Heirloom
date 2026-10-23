import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('__APP_VERSION__', '0.0.0-test');
vi.stubGlobal('window', globalThis);

const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('{}'));
vi.stubGlobal('fetch', fetchMock);

const { KEYS } = await import('../src/platform/config');
const { configureAnalytics, flush, reportError, track } = await import('../src/platform/analytics');

describe('analytics consent', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    KEYS.posthog.key = 'phc_test';
    KEYS.sentryDsn = 'https://abc@o1.ingest.sentry.io/42';
  });

  it('sends nothing without consent', async () => {
    configureAnalytics({ consent: undefined, lang: 'tr' });
    track('life_start', { country: 'tr' });
    reportError(new Error('boom-1'));
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();

    configureAnalytics({ consent: false, lang: 'tr' });
    track('life_start');
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('batches events after consent, with no personal data', async () => {
    configureAnalytics({ consent: true, lang: 'tr' });
    track('life_start', { country: 'tr' });
    track('purchase_done', { id: 'pack.fame' });
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/batch/');
    const body = JSON.parse(String(init?.body));
    expect(body.api_key).toBe('phc_test');
    expect(body.batch.map((e: { event: string }) => e.event)).toEqual(['life_start', 'purchase_done']);
    expect(body.batch[0].properties).toMatchObject({ lang: 'tr', app_version: '0.0.0-test', country: 'tr' });
    expect(body.batch[0].distinct_id).toMatch(/[0-9a-f-]{36}/);
  });

  it('reports a crash once per message', () => {
    configureAnalytics({ consent: true, lang: 'en' });
    reportError(new Error('boom-2'));
    reportError(new Error('boom-2'));
    const sentry = fetchMock.mock.calls.filter(([u]) => String(u).includes('/api/42/envelope/'));
    expect(sentry).toHaveLength(1);
  });

  it('stays off when no key is configured', async () => {
    KEYS.posthog.key = '';
    configureAnalytics({ consent: true, lang: 'en' });
    track('app_open');
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
