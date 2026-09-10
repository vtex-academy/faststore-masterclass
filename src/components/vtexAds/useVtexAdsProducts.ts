import { gql } from "@faststore/core/api";
import { useQuery_unstable as useQuery } from "@faststore/core/experimental";

import type { VtexAdsAd, VtexAdsDeviceConfig } from "./types";
import { useVtexAdsIdentity } from "./useVtexAdsIdentity";

const query = gql(`
  query GetVtexAdsProductsQuery($input: VtexAdsRequestInput!) {
    vtexAdsProducts(input: $input) {
      placement
      items {
        ad {
          type
          adId
          productSku
          sellerId
          impressionUrl
          viewUrl
          clickUrl
        }
        product {
          ...ProductSummary_product
        }
      }
    }
  }
`);

export interface VtexAdsShelfProduct {
  id: string;
  sku: string;
  advertisement?: {
    adId: string;
    adResponseId?: string;
  };
  [key: string]: unknown;
}

export interface VtexAdsProductItem {
  ad: VtexAdsAd;
  product: VtexAdsShelfProduct;
}

interface VtexAdsProductsData {
  vtexAdsProducts: {
    placement: string;
    items: VtexAdsProductItem[];
  };
}

export const useVtexAdsProducts = (config: VtexAdsDeviceConfig | undefined) => {
  const { sessionId, userId } = useVtexAdsIdentity();
  const enabled = Boolean(
    config?.enabled && config.placementName?.trim() && sessionId,
  );
  const quantity = Math.min(2, Math.max(0, Math.trunc(config?.quantity ?? 2)));

  const { data, error } = useQuery<VtexAdsProductsData>(
    query,
    {
      input: {
        sessionId: sessionId ?? "",
        userId,
        channel: config?.channel ?? "site",
        context: "home",
        placement: {
          name: config?.placementName?.trim() ?? "",
          quantity,
          type: "product",
        },
      },
    },
    {
      doNotRun: !enabled || quantity === 0,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    },
  );

  return {
    items: data?.vtexAdsProducts.items ?? [],
    error,
  };
};
