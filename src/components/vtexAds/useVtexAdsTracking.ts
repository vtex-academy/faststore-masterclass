import { useCallback, useEffect, useRef } from "react";

import { useVtexAdsIdentity } from "./useVtexAdsIdentity";

interface TrackingAd {
  adId: string;
  impressionUrl?: string;
  viewUrl?: string;
  clickUrl?: string;
}

interface TrackingOptions {
  ad: TrackingAd;
  placementName: string;
  creativeLoaded: boolean;
  viewThreshold?: number;
  viewTimeMs?: number;
}

const wasSent = (key: string, dedupWindowMs?: number) => {
  try {
    const storedAt = sessionStorage.getItem(key);

    if (!storedAt) return false;
    if (dedupWindowMs === undefined) return true;

    const timestamp = Number(storedAt);
    return Number.isFinite(timestamp) && Date.now() - timestamp < dedupWindowMs;
  } catch {
    return false;
  }
};

const markAsSent = (key: string) => {
  try {
    sessionStorage.setItem(key, Date.now().toString());
  } catch {
    // The in-memory browser and the Ads API still deduplicate short-lived events.
  }
};

const sendEvent = (
  url: string | undefined,
  key: string,
  userId: string | undefined,
  sessionId: string | undefined,
  dedupWindowMs?: number,
) => {
  if (!url || !userId || !sessionId || wasSent(key, dedupWindowMs)) return;

  markAsSent(key);
  const body = JSON.stringify({ user_id: userId, session_id: sessionId });
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.(url, blob)) return;

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
};

export const useVtexAdsTracking = ({
  ad,
  placementName,
  creativeLoaded,
  viewThreshold = 0.5,
  viewTimeMs = 1000,
}: TrackingOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sessionId, userId } = useVtexAdsIdentity();
  const keyPrefix = `vtex-ads:${sessionId ?? "pending"}:${placementName}:${ad.adId}`;

  const trackImpression = useCallback(
    () =>
      sendEvent(
        ad.impressionUrl,
        `${keyPrefix}:impression`,
        userId,
        sessionId,
        60_000,
      ),
    [ad.impressionUrl, keyPrefix, sessionId, userId],
  );
  const trackClick = useCallback(
    () =>
      sendEvent(
        ad.clickUrl,
        `${keyPrefix}:click`,
        userId,
        sessionId,
        3_600_000,
      ),
    [ad.clickUrl, keyPrefix, sessionId, userId],
  );

  useEffect(() => {
    if (!creativeLoaded || !containerRef.current || !ad.impressionUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        trackImpression();
        observer.disconnect();
      },
      { threshold: 0.01 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ad.impressionUrl, creativeLoaded, trackImpression]);

  useEffect(() => {
    if (!creativeLoaded || !containerRef.current || !ad.viewUrl) return;

    let visibleTimer: ReturnType<typeof setTimeout> | undefined;
    const threshold = Math.min(1, Math.max(0, viewThreshold));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          visibleTimer ??= setTimeout(
            () => sendEvent(ad.viewUrl, `${keyPrefix}:view`, userId, sessionId),
            Math.max(0, viewTimeMs),
          );
          return;
        }

        if (visibleTimer) {
          clearTimeout(visibleTimer);
          visibleTimer = undefined;
        }
      },
      { threshold },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (visibleTimer) clearTimeout(visibleTimer);
    };
  }, [
    ad.viewUrl,
    creativeLoaded,
    keyPrefix,
    sessionId,
    userId,
    viewThreshold,
    viewTimeMs,
  ]);

  return { containerRef, trackClick };
};
