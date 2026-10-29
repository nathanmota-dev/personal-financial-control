import { Agent, fetch as undiciFetch } from "undici";

// Node's fetch drops idle sockets after 4s, so a pause between page navigations
// paid a new TLS handshake (~700ms) on the next Turso query. Turso keeps idle
// connections for ~25s; staying below that avoids reusing a socket it closed.
export const tursoKeepAliveMs = 20_000;

const agent = new Agent({
  keepAliveTimeout: tursoKeepAliveMs,
  keepAliveMaxTimeout: tursoKeepAliveMs,
});

// libsql hands over a WHATWG Request; undici's own fetch needs it unpacked.
export async function keepAliveFetch(request: Request) {
  return undiciFetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body ? await request.arrayBuffer() : undefined,
    signal: request.signal,
    dispatcher: agent,
  });
}
