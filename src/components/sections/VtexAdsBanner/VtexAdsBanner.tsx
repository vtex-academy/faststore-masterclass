import { useEffect, useState } from "react";

import type { VtexAdsResponsiveConfig } from "../../vtexAds/types";
import { useViewport } from "../../vtexAds/useViewport";
import { useVtexAdsMedia } from "../../vtexAds/useVtexAdsMedia";
import { useVtexAdsTracking } from "../../vtexAds/useVtexAdsTracking";
import styles from "../vtex-ads-media.module.scss";

interface VtexAdsBannerProps {
  responsive?: VtexAdsResponsiveConfig;
  altText?: string;
  viewThreshold?: number;
  viewTimeMs?: number;
}

export default function VtexAdsBanner({
  responsive,
  altText = "Publicidade patrocinada",
  viewThreshold = 0.5,
  viewTimeMs = 1000,
}: VtexAdsBannerProps) {
  const viewport = useViewport();
  const config = viewport ? responsive?.[viewport] : undefined;
  const { ad } = useVtexAdsMedia(config, "image");
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

  const creative = (
    <img
      className={styles.image}
      src={ad.mediaUrl}
      alt={altText}
      onLoad={() => setCreativeLoaded(true)}
    />
  );

  return (
    <section className={`section ${styles.mediaSection}`}>
      <div className="layout__content">
        <div
          ref={containerRef}
          data-vtex-ads-container
          data-vtex-ads-type="banner"
        >
          {ad.destinationUrl ? (
            <a
              className={styles.creativeLink}
              href={ad.destinationUrl}
              aria-label={altText}
              rel="sponsored"
              onClick={trackClick}
            >
              {creative}
            </a>
          ) : (
            creative
          )}
        </div>
      </div>
    </section>
  );
}
