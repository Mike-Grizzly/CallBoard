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

export type PushStatus =
  | "loading"
  | "unsupported"
  | "denied"
  | "disabled"
  | "enabled"
  | "working";

/**
 * Shared per-device Web Push state + actions. Used by both the Settings card
 * and the signup onboarding dialog so the registration/permission/subscribe
 * flow lives in exactly one place.
 */
export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("loading");
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

  return { status, error, supported, enable, disable };
}
