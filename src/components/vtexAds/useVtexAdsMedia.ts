import { gql } from "@faststore/core/api";
import { useQuery_unstable as useQuery } from "@faststore/core/experimental";

import type { VtexAdsAd, VtexAdsAssetType, VtexAdsDeviceConfig } from "./types";
import { useVtexAdsIdentity } from "./useVtexAdsIdentity";

const query = gql(`
  query GetVtexAdsMediaQuery($input: VtexAdsRequestInput!) {
    vtexAds(input: $input) {
      placement
      ads {
        type
        adId
        productSku
        sellerId
        mediaUrl
        destinationUrl
        impressionUrl
        viewUrl
        clickUrl
      }
    }
  }
`);

interface VtexAdsMediaData {
  vtexAds: {
    placement: string;
    ads: VtexAdsAd[];
  };
}

export const useVtexAdsMedia = (
  config: VtexAdsDeviceConfig | undefined,
  assetType: VtexAdsAssetType,
) => {
  const { sessionId, userId } = useVtexAdsIdentity();
  const enabled = Boolean(
    config?.enabled && config.placementName?.trim() && config.size && sessionId,
  );

  const { data, error } = useQuery<VtexAdsMediaData>(
    query,
    {
      input: {
        sessionId: sessionId ?? "",
        userId,
        channel: config?.channel ?? "site",
        context: "home",
        placement: {
          name: config?.placementName?.trim() ?? "",
          quantity: config?.quantity ?? 1,
          type: "banner",
          size: config?.size,
          assetType,
        },
      },
    },
    {
      doNotRun: !enabled,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    },
  );

  return {
    ad: data?.vtexAds.ads.find((item) => Boolean(item.mediaUrl)),
    error,
  };
};
