export type VtexAdsChannel = "site" | "msite" | "app";
export type VtexAdsAssetType = "image" | "video";

export interface VtexAdsDeviceConfig {
  enabled?: boolean;
  channel?: VtexAdsChannel;
  placementName?: string;
  quantity?: number;
  size?: string;
}

export interface VtexAdsResponsiveConfig {
  desktop?: VtexAdsDeviceConfig;
  mobile?: VtexAdsDeviceConfig;
}

export interface VtexAdsAd {
  type: "banner" | "product" | "sponsored_brand" | "digital_signage";
  adId: string;
  productSku?: string;
  sellerId?: string;
  mediaUrl?: string;
  destinationUrl?: string;
  impressionUrl?: string;
  viewUrl?: string;
  clickUrl?: string;
}
