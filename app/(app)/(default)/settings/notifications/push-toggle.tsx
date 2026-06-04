"use client";

import { useCallback, useEffect, useState } from "react";
import {
  savePushSubscription,
  deletePushSubscription,
} from "@/features/push/actions";

/** VAPID public keys are base64url; the browser wants an ArrayBuffer-backed view. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type Status =
  | "loading"
  | "unsupported"
  | "denied"
  | "disabled"
  | "enabled"
  | "working";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    let active = true;
    async function init() {
      if (!supported) {
        if (active) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (active) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (active) setStatus(sub ? "enabled" : "disabled");
      } catch {
        if (active) setStatus("disabled");
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setError(null);
    setStatus("working");
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("Push isn't configured on the server yet.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });

      const json = sub.toJSON();
      const result = await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        userAgent: navigator.userAgent,
      });
      if (result.error) {
        setError(result.error);
        setStatus("disabled");
        return;
      }
      setStatus("enabled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't enable push.");
      setStatus("disabled");
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("disabled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disable push.");
      setStatus("enabled");
    }
  }, []);

  return (
    <div className="card card-pad">
      <div className="h-eyebrow">This device</div>
      <h2 className="h-section" style={{ marginTop: 2, marginBottom: 4 }}>
        Push notifications
      </h2>
      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Get an alert on this device the moment an announcement is posted — even
        when Proscene is closed. You can enable this on each device separately.
      </p>

      {error && (
        <div className="auth-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {status === "loading" && (
        <p className="muted" style={{ fontSize: 13 }}>
          Checking…
        </p>
      )}

      {status === "unsupported" && (
        <p className="muted" style={{ fontSize: 13 }}>
          This browser doesn&apos;t support push notifications. On iPhone, add
          Proscene to your Home Screen first, then open it from there.
        </p>
      )}

      {status === "denied" && (
        <p className="muted" style={{ fontSize: 13 }}>
          Notifications are blocked for Proscene in your device settings. Allow
          them there, then reload this page to enable push.
        </p>
      )}

      {status === "enabled" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--c-sage)", fontSize: 13 }}>
            Push is on for this device.
          </span>
          <button type="button" className="btn" onClick={disable}>
            Turn off
          </button>
        </div>
      )}

      {status === "disabled" && (
        <button type="button" className="btn primary" onClick={enable}>
          Enable on this device
        </button>
      )}

      {status === "working" && (
        <button type="button" className="btn primary" disabled>
          Working…
        </button>
      )}
    </div>
  );
}
