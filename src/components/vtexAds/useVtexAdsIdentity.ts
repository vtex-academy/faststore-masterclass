import { useEffect, useState } from "react";
import { useSession_unstable as useSession } from "@faststore/core/experimental";

const STORAGE_KEY = "vtex_ads_identity";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let volatileSessionId: string | undefined;

const createId = () => {
  const uuid = globalThis.crypto?.randomUUID?.();
  const random = Math.random().toString(36).slice(2);

  return (uuid ?? `${Date.now().toString(36)}${random}`).replace(
    /[^a-zA-Z0-9]/g,
    "",
  );
};

const getOrCreateSessionId = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored) as { id?: string; expiresAt?: number };

      if (parsed.id && Number(parsed.expiresAt) > Date.now()) {
        return parsed.id;
      }
    }

    const id = createId();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id, expiresAt: Date.now() + THIRTY_DAYS_MS }),
    );
    return id;
  } catch {
    volatileSessionId ??= createId();
    return volatileSessionId;
  }
};

const sanitizeIdentity = (value: string | undefined) =>
  value?.replace(/[^a-zA-Z0-9]/g, "");

export const useVtexAdsIdentity = () => {
  const session = useSession();
  const [sessionId, setSessionId] = useState<string>();

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const authenticatedUserId = sanitizeIdentity(session.person?.id);

  return {
    sessionId,
    userId: authenticatedUserId ?? sessionId,
  };
};
