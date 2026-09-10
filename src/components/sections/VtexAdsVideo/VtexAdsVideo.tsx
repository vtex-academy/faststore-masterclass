import { useEffect, useState } from "react";

import type { VtexAdsResponsiveConfig } from "../../vtexAds/types";
import { useViewport } from "../../vtexAds/useViewport";
import { useVtexAdsMedia } from "../../vtexAds/useVtexAdsMedia";
import { useVtexAdsTracking } from "../../vtexAds/useVtexAdsTracking";
import styles from "../vtex-ads-media.module.scss";

interface VtexAdsVideoProps {
  responsive?: VtexAdsResponsiveConfig;
  ariaLabel?: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  destinationLabel?: string;
  viewThreshold?: number;
  viewTimeMs?: number;
}

export default function VtexAdsVideo({
  responsive,
  ariaLabel = "Vídeo patrocinado",
  autoPlay = false,
  controls = true,
  loop = false,
  muted = true,
  destinationLabel = "Saiba mais",
  viewThreshold = 0.5,
  viewTimeMs = 1000,
}: VtexAdsVideoProps) {
  const viewport = useViewport();
  const config = viewport ? responsive?.[viewport] : undefined;
  const { ad } = useVtexAdsMedia(config, "video");
  const [creativeLoaded, setCreativeLoaded] = useState(false);

  useEffect(() => {
    setCreativeLoaded(false);
  }, [ad?.adId]);

  const { containerRef, trackClick } = useVtexAdsTracking({
    ad: ad ?? { adId: "" },
    placementName: config?.placementName ?? "",
    creativeLoaded,
    viewThreshold,
    viewTimeMs,
  });

  if (!ad?.mediaUrl || !config?.placementName) return null;

  return (
    <section className={`section ${styles.mediaSection}`}>
      <div className="layout__content">
        <div
          ref={containerRef}
          data-vtex-ads-container
          data-vtex-ads-type="video"
        >
          <video
            className={styles.video}
            src={ad.mediaUrl}
            aria-label={ariaLabel}
            autoPlay={autoPlay}
            controls={controls}
            loop={loop}
            muted={autoPlay || muted}
            playsInline
            preload="metadata"
            onLoadedData={() => setCreativeLoaded(true)}
          />
          {ad.destinationUrl && (
            <a
              className={styles.videoDestination}
              href={ad.destinationUrl}
              rel="sponsored"
              onClick={trackClick}
            >
              {destinationLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
