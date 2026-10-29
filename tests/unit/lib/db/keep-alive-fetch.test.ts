import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { keepAliveFetch } from "@/lib/db/keep-alive-fetch";

const sockets = new Set<unknown>();
const server = createServer((request, response) => {
  sockets.add(request.socket);
  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({
      method: request.method,
      authorization: request.headers.authorization ?? null,
      body,
    }));
  });
});
let origin = "";

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe("keepAliveFetch", () => {
  it("forwards the libsql request and reuses the connection", async () => {
    const post = await keepAliveFetch(new Request(`${origin}/v2/pipeline`, {
      method: "POST",
      headers: { authorization: "Bearer token" },
      body: JSON.stringify({ requests: [] }),
    }));
    await expect(post.json()).resolves.toEqual({
      method: "POST",
      authorization: "Bearer token",
      body: "{\"requests\":[]}",
    });

    // undici frees the socket only after the body completes.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const get = await keepAliveFetch(new Request(`${origin}/v2`));
    await expect(get.json()).resolves.toEqual({ method: "GET", authorization: null, body: "" });
    expect(sockets.size).toBe(1);
  });
});
