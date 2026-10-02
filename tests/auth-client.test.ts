import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  app: { name: "[DEFAULT]" },
  auth: { currentUser: { getIdToken: vi.fn() } },
  setPersistence: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  getIdToken: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  getApps: () => [sdk.app],
  initializeApp: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  getAuth: () => sdk.auth,
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
  inMemoryPersistence: "in-memory",
  setPersistence: sdk.setPersistence,
  signInWithPopup: sdk.signInWithPopup,
  signOut: sdk.signOut,
}));

import { googleLogin } from "@/lib/auth/client";

const sessionRequest = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  for (const key of ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"]) {
    vi.stubEnv(key, "test");
  }
  sdk.setPersistence.mockResolvedValue(undefined);
  sdk.signInWithPopup.mockResolvedValue({ user: { getIdToken: sdk.getIdToken } });
  sdk.getIdToken.mockResolvedValue("fresh-id-token");
  sdk.signOut.mockResolvedValue(undefined);
  sessionRequest.mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", sessionRequest);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Google login attempts", () => {
  it.each([
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request",
    "auth/popup-blocked",
    "auth/unauthorized-domain",
    "auth/network-request-failed",
  ])("allows a fresh login after %s without creating a cancelled session", async code => {
    const cancellation = { code };
    sdk.signInWithPopup.mockRejectedValueOnce(cancellation);

    await expect(googleLogin()).rejects.toBe(cancellation);
    expect(sessionRequest).not.toHaveBeenCalled();
    expect(sdk.getIdToken).not.toHaveBeenCalled();
    expect(sdk.signOut).toHaveBeenCalledWith(sdk.auth);

    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sdk.signInWithPopup).toHaveBeenCalledTimes(2);
    const firstProvider = sdk.signInWithPopup.mock.calls[0][1];
    const retryProvider = sdk.signInWithPopup.mock.calls[1][1];
    expect(retryProvider).not.toBe(firstProvider);
    expect(retryProvider.setCustomParameters).toHaveBeenCalledWith({ prompt: "select_account" });
    expect(sessionRequest).toHaveBeenCalledTimes(1);
    expect(sessionRequest).toHaveBeenCalledWith("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "fresh-id-token" }),
    });
    expect(sdk.auth.currentUser.getIdToken).not.toHaveBeenCalled();
  });

  it("permits repeated cancellations followed by a successful login", async () => {
    const cancellation = { code: "auth/popup-closed-by-user" };
    sdk.signInWithPopup.mockRejectedValueOnce(cancellation).mockRejectedValueOnce(cancellation);
    await expect(googleLogin()).rejects.toBe(cancellation);
    await expect(googleLogin()).rejects.toBe(cancellation);
    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sdk.signInWithPopup).toHaveBeenCalledTimes(3);
    expect(sessionRequest).toHaveBeenCalledTimes(1);
    expect(sdk.signOut).toHaveBeenCalledTimes(3);
  });

  it.each([401, 403, 503])("requires an accepted session and allows retry after HTTP %s", async status => {
    sessionRequest.mockResolvedValueOnce(Response.json({ ok: false }, { status }));
    await expect(googleLogin()).rejects.toThrow(status === 403
      ? "Esta conta não tem permissão para acessar."
      : "Não foi possível iniciar a sessão. Tente novamente.");
    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sdk.signInWithPopup).toHaveBeenCalledTimes(2);
  });

  it("does not reuse an existing user's token when the new popup fails", async () => {
    sdk.auth.currentUser.getIdToken.mockResolvedValue("stale-id-token");
    sdk.signInWithPopup.mockRejectedValue({ code: "auth/popup-closed-by-user" });
    await expect(googleLogin()).rejects.toMatchObject({ code: "auth/popup-closed-by-user" });
    expect(sdk.auth.currentUser.getIdToken).not.toHaveBeenCalled();
    expect(sessionRequest).not.toHaveBeenCalled();
  });

  it("permits retry after the session request loses its connection", async () => {
    const failure = new TypeError("Failed to fetch");
    sessionRequest.mockRejectedValueOnce(failure);
    await expect(googleLogin()).rejects.toBe(failure);
    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sdk.signInWithPopup).toHaveBeenCalledTimes(2);
  });

  it("does not create a session if retrieving the new token fails", async () => {
    const failure = { code: "auth/network-request-failed" };
    sdk.getIdToken.mockRejectedValueOnce(failure);
    await expect(googleLogin()).rejects.toBe(failure);
    expect(sessionRequest).not.toHaveBeenCalled();
    await expect(googleLogin()).resolves.toBeUndefined();
  });

  it("preserves cancellation when cleanup also fails and allows retry", async () => {
    const cancellation = { code: "auth/popup-closed-by-user" };
    sdk.signInWithPopup.mockRejectedValueOnce(cancellation);
    sdk.signOut.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(googleLogin()).rejects.toBe(cancellation);
    expect(sessionRequest).not.toHaveBeenCalled();
    await expect(googleLogin()).resolves.toBeUndefined();
  });

  it("preserves a server rejection when cleanup also fails", async () => {
    sessionRequest.mockResolvedValueOnce(Response.json({ ok: false }, { status: 403 }));
    sdk.signOut.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(googleLogin()).rejects.toThrow("Esta conta não tem permissão para acessar.");
  });

  it("keeps a confirmed session successful when Firebase cleanup fails", async () => {
    sdk.signOut.mockRejectedValueOnce(new Error("cleanup failed"));
    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sessionRequest).toHaveBeenCalledTimes(1);
  });

  it("waits for the app session before reporting success", async () => {
    let acceptSession!: (response: Response) => void;
    sessionRequest.mockReturnValueOnce(new Promise<Response>(resolve => { acceptSession = resolve; }));
    let completed = false;
    const login = googleLogin().then(() => { completed = true; });
    await vi.waitFor(() => expect(sessionRequest).toHaveBeenCalledTimes(1));
    expect(completed).toBe(false);
    expect(sdk.signOut).not.toHaveBeenCalled();
    acceptSession(Response.json({ ok: true }));
    await login;
    expect(completed).toBe(true);
  });

  it("cleans up after persistence initialization fails and allows retry", async () => {
    const failure = { code: "auth/web-storage-unsupported" };
    sdk.setPersistence.mockRejectedValueOnce(failure);
    await expect(googleLogin()).rejects.toBe(failure);
    expect(sdk.signInWithPopup).not.toHaveBeenCalled();
    expect(sessionRequest).not.toHaveBeenCalled();
    expect(sdk.signOut).toHaveBeenCalledWith(sdk.auth);
    await expect(googleLogin()).resolves.toBeUndefined();
    expect(sdk.setPersistence).toHaveBeenCalledWith(sdk.auth, "in-memory");
  });

  it("rejects missing configuration before opening a popup", async () => {
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    await expect(googleLogin()).rejects.toThrow("Login indisponível. Configure o Firebase.");
    expect(sdk.signInWithPopup).not.toHaveBeenCalled();
    expect(sessionRequest).not.toHaveBeenCalled();
  });
});
