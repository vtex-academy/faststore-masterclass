const VTEX_ADS_ENDPOINT = "https://newtail-media.newtail.com.br/v1/rma";
const VTEX_ADS_PUBLISHER_ID =
  process.env.VTEX_ADS_PUBLISHER_ID ?? "ec395ace-28b8-4ba8-a39f-8c80c939d5b2";
const configuredTimeoutMs = Number(process.env.VTEX_ADS_TIMEOUT_MS);
const VTEX_ADS_TIMEOUT_MS = Number.isFinite(configuredTimeoutMs)
  ? Math.min(10_000, Math.max(250, configuredTimeoutMs))
  : 2_500;

type VtexAdsChannel = "site" | "msite" | "app";
type VtexAdsContext =
  | "home"
  | "category"
  | "search"
  | "product_page"
  | "brand_page"
  | "digital_signage";
type VtexAdsType = "product" | "banner" | "sponsored_brand" | "digital_signage";
type VtexAdsAssetType = "image" | "video";

interface VtexAdsRequestInput {
  sessionId: string;
  userId?: string;
  channel: VtexAdsChannel;
  context: VtexAdsContext;
  placement: {
    name: string;
    quantity: number;
    type: VtexAdsType;
    size?: string;
    assetType?: VtexAdsAssetType;
  };
}

interface RawVtexAd {
  type?: VtexAdsType;
  ad_id?: string;
  product_sku?: string;
  seller_id?: string | null;
  media_url?: string;
  destination_url?: string | null;
  impression_url?: string;
  view_url?: string;
  click_url?: string;
}

interface VtexAdsResponse {
  placement: string;
  ads: Array<{
    type: VtexAdsType;
    adId: string;
    productSku?: string;
    sellerId?: string;
    mediaUrl?: string;
    destinationUrl?: string;
    impressionUrl?: string;
    viewUrl?: string;
    clickUrl?: string;
  }>;
}

interface CatalogSku {
  itemId: string;
  sellers?: unknown[];
  [key: string]: unknown;
}

interface CatalogProduct {
  items?: CatalogSku[];
  [key: string]: unknown;
}

interface VtexGraphqlContext {
  clients: {
    search: {
      productsByIdentifier: (input: {
        field: "sku";
        values: string[];
      }) => Promise<CatalogProduct[]>;
    };
  };
}

const sanitizeIdentity = (value: string | undefined) =>
  value?.replace(/[^a-zA-Z0-9]/g, "");

const optionalHttpsUrl = (value: string | undefined) => {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const mapAd = (ad: RawVtexAd, requestedType: VtexAdsType) => {
  if (!ad.ad_id || ad.type !== requestedType) return null;

  return {
    type: ad.type,
    adId: ad.ad_id,
    productSku: ad.product_sku,
    sellerId: ad.seller_id ?? undefined,
    mediaUrl: optionalHttpsUrl(ad.media_url),
    destinationUrl: optionalHttpsUrl(ad.destination_url ?? undefined),
    impressionUrl: optionalHttpsUrl(ad.impression_url),
    viewUrl: optionalHttpsUrl(ad.view_url),
    clickUrl: optionalHttpsUrl(ad.click_url),
  };
};

export const requestVtexAds = async (
  input: VtexAdsRequestInput,
): Promise<VtexAdsResponse> => {
  const placementName = input.placement.name.trim();
  const sessionId = sanitizeIdentity(input.sessionId);
  const userId = sanitizeIdentity(input.userId);

  if (!placementName || !sessionId || input.placement.quantity <= 0) {
    return { placement: placementName, ads: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VTEX_ADS_TIMEOUT_MS);

  try {
    const placement = {
      quantity: input.placement.quantity,
      types: [input.placement.type],
      ...(input.placement.size && { size: input.placement.size }),
      ...(input.placement.assetType && {
        assets_type: [input.placement.assetType],
      }),
    };

    const response = await fetch(
      `${VTEX_ADS_ENDPOINT}/${encodeURIComponent(VTEX_ADS_PUBLISHER_ID)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify({
          session_id: sessionId,
          ...(userId && { user_id: userId }),
          channel: input.channel,
          context: input.context,
          placements: { [placementName]: placement },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return { placement: placementName, ads: [] };
    }

    const payload = (await response.json()) as Record<string, RawVtexAd[]>;
    const rawAds = Array.isArray(payload[placementName])
      ? payload[placementName]
      : [];
    const ads = rawAds
      .map((ad) => mapAd(ad, input.placement.type))
      .filter((ad): ad is NonNullable<typeof ad> => ad !== null);

    return { placement: placementName, ads };
  } catch {
    return { placement: placementName, ads: [] };
  } finally {
    clearTimeout(timeout);
  }
};

const requestVtexAdsProducts = async (
  input: VtexAdsRequestInput,
  context: VtexGraphqlContext,
) => {
  const result = await requestVtexAds(input);
  const productAds = result.ads.filter((ad) => Boolean(ad.productSku));

  if (input.placement.type !== "product" || productAds.length === 0) {
    return { placement: result.placement, items: [] };
  }

  try {
    const productSkus = Array.from(
      new Set(productAds.flatMap((ad) => ad.productSku ?? [])),
    );
    const catalogProducts = await context.clients.search.productsByIdentifier({
      field: "sku",
      values: productSkus,
    });
    const productsBySku = new Map<
      string,
      CatalogSku & { isVariantOf: CatalogProduct }
    >();

    for (const product of catalogProducts) {
      for (const sku of product.items ?? []) {
        if (
          productSkus.includes(sku.itemId) &&
          Array.isArray(sku.sellers) &&
          sku.sellers.length > 0
        ) {
          productsBySku.set(sku.itemId, { ...sku, isVariantOf: product });
        }
      }
    }

    const seenSkus = new Set<string>();
    const items = productAds.flatMap((ad) => {
      const sku = ad.productSku;
      const product = sku ? productsBySku.get(sku) : undefined;

      if (!sku || !product || seenSkus.has(sku)) return [];

      seenSkus.add(sku);
      return [{ ad, product }];
    });

    return { placement: result.placement, items };
  } catch {
    return { placement: result.placement, items: [] };
  }
};

const vtexAdsResolver = {
  Query: {
    vtexAds: (_: unknown, { input }: { input: VtexAdsRequestInput }) =>
      requestVtexAds(input),
    vtexAdsProducts: (
      _: unknown,
      { input }: { input: VtexAdsRequestInput },
      context: VtexGraphqlContext,
    ) => requestVtexAdsProducts(input, context),
  },
};

export default vtexAdsResolver;
