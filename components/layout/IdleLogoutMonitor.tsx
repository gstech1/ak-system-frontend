"use client";

import { useEffect } from "react";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = "swmsLastActivityAt";
const AUTH_KEYS = ["accessToken", "authUser"];

function endSession() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  sessionStorage.setItem("swmsSessionEndedByIdle", "1");
  window.location.replace("/login?reason=idle");
}

export default function IdleLogoutMonitor() {
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) return;

    const existingActivity = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY));
    if (!Number.isFinite(existingActivity) || existingActivity <= 0) {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(Date.now()));
    }

    let lastPointerActivityAt = 0;
    let ended = false;

    const checkIdle = () => {
      if (ended) return true;
      const lastActivityAt = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY));
      if (Number.isFinite(lastActivityAt) && Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
        ended = true;
        endSession();
        return true;
      }
      return false;
    };

    const recordActivity = (event: Event) => {
      if (checkIdle()) return;
      const now = Date.now();
      if (event.type === "pointermove" && now - lastPointerActivityAt < 10_000) return;
      if (event.type === "pointermove") lastPointerActivityAt = now;
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "accessToken" && !event.newValue) {
        window.location.replace("/login");
        return;
      }
      if (event.key === ACTIVITY_STORAGE_KEY) checkIdle();
    };

    const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel", "scroll"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", checkIdle);
    const timer = window.setInterval(checkIdle, 10_000);

    checkIdle();
    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", checkIdle);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
