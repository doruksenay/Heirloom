// Cloudflare Worker entry: turns Requests into ApiRequests for logic.ts and plugs in D1.
import { Api, LIMITS, type Env } from './logic';
import { D1Store, type D1Like } from './d1';

interface WorkerEnv extends Env {
  DB: D1Like;
}

/** Reads at most `max` characters of the body, so a huge upload is cut off instead of filling memory. */
async function readBody(req: Request, max: number): Promise<string | null> {
  const declared = Number(req.headers.get('Content-Length') ?? '0');
  if (declared > max * 4) return null; // even all-ASCII it cannot fit
  if (!req.body) return '';
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let out = '';
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > max * 4) {
      await reader.cancel();
      return null;
    }
    out += decoder.decode(value, { stream: true });
    if (out.length > max) {
      await reader.cancel();
      return null;
    }
  }
  return out + decoder.decode();
}

/** One Api per isolate, so the leaderboard cache survives between requests. */
let cached: { env: WorkerEnv; api: Api } | null = null;
const apiFor = (env: WorkerEnv) => {
  if (cached?.env !== env) cached = { env, api: new Api(new D1Store(env.DB), env) };
  return cached.api;
};

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const api = apiFor(env);
    const max = url.pathname === '/v1/save' ? LIMITS.bodyChars : LIMITS.smallBody;
    const read = request.method === 'GET' || request.method === 'OPTIONS' ? '' : await readBody(request, max);
    // too large: hand the API a body just over the limit, so the 413 goes out with the usual CORS headers
    const body = read ?? ' '.repeat(max + 1);
    const res = await api.handle({
      method: request.method,
      path: url.pathname,
      query: url.searchParams,
      header: (n) => request.headers.get(n),
      ip: request.headers.get('CF-Connecting-IP') ?? '0.0.0.0',
      body,
    });
    return new Response(res.status === 204 ? null : res.body, { status: res.status, headers: res.headers });
  },

  async scheduled(_event: ScheduledEvent, env: WorkerEnv): Promise<void> {
    await apiFor(env).cleanup();
  },
};
