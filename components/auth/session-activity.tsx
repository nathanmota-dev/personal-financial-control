"use client";
import type { SessionActivityProps } from "@/lib/interfaces/local-auth";
import { useEffect } from "react";

export function SessionActivity({ timeoutMinutes }: SessionActivityProps) {
  useEffect(() => {
    if (!timeoutMinutes) return;
    let lastActivity = Date.now();
    let lastHeartbeat = 0;
    let lastBroadcast = 0;
    const heartbeatInterval = Math.min(60000, timeoutMinutes * 30000);
    let navigating = false;
    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("pfc-activity") : null;
    function navigate(path: string) {
      if (navigating) return;
      navigating = true;
      window.location.replace(`${path}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    async function lock() {
      try { await fetch("/api/session/activity", { method: "DELETE", headers: { "Content-Type": "application/json" } }); }
      finally { navigate("/lock"); }
    }
    function interact() {
      const now = Date.now();
      if (now - lastActivity >= timeoutMinutes * 60000) { void lock(); return; }
      lastActivity = now;
      if (now - lastBroadcast >= 1000) { channel?.postMessage(now); lastBroadcast = now; }
      if (now - lastHeartbeat < heartbeatInterval) return;
      lastHeartbeat = now;
      void fetch("/api/session/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then(response => { if (response.status === 423 || response.status === 401) navigate(response.status === 401 ? "/login" : "/lock"); }).catch(() => {});
    }
    if (channel) channel.onmessage = event => { if (typeof event.data === "number" && event.data <= Date.now()) lastActivity = Math.max(lastActivity, event.data); };
    const events = ["pointermove", "keydown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, interact, { passive: true }));
    const timer = window.setInterval(() => { if (Date.now() - lastActivity >= timeoutMinutes * 60000) void lock(); }, 1000);
    return () => { clearInterval(timer); channel?.close(); events.forEach(event => window.removeEventListener(event, interact)); };
  }, [timeoutMinutes]);
  return null;
}
