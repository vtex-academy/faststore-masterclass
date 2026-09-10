import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { getOverriddenSection, ProductShelfSection } from "@faststore/core";
import { useScreenResize_unstable as useScreenResize } from "@faststore/core/experimental";
import { Carousel as UICarousel } from "@faststore/ui";

import type { VtexAdsAd, VtexAdsResponsiveConfig } from "../../vtexAds/types";
import { useViewport } from "../../vtexAds/useViewport";
import {
  useVtexAdsProducts,
  type VtexAdsShelfProduct,
} from "../../vtexAds/useVtexAdsProducts";
import { useVtexAdsTracking } from "../../vtexAds/useVtexAdsTracking";
import styles from "./product-shelf.module.scss";

interface VtexAdsShelfConfiguration {
  responsive?: VtexAdsResponsiveConfig;
}

type ProductShelfProps = ComponentProps<typeof ProductShelfSection> & {
  vtexAds?: VtexAdsShelfConfiguration;
};

type ProductCardElement = ReactElement<{
  product: VtexAdsShelfProduct;
  index: number;
}>;

const VtexAdsShelfContext = createContext<VtexAdsResponsiveConfig | undefined>(
  undefined,
);

function TrackedSponsoredProduct({
  ad,
  placementName,
  children,
}: {
  ad: VtexAdsAd;
  placementName: string;
  children: ReactNode;
}) {
  const { containerRef, trackClick } = useVtexAdsTracking({
    ad: {
      adId: ad.adId,
      impressionUrl: ad.impressionUrl,
      clickUrl: ad.clickUrl,
    },
    placementName,
    creativeLoaded: true,
  });

  return (
    <div
      ref={containerRef}
      className={styles.sponsoredCard}
      data-vtex-ads-type="product"
      data-vtex-ads-id={ad.adId}
      onClickCapture={(event: MouseEvent<HTMLDivElement>) => {
        if ((event.target as Element).closest("a[href]")) trackClick();
      }}
    >
      {children}
    </div>
  );
}

function SponsoredCarousel({
  children,
  itemsPerPage,
  ...carouselProps
}: ComponentProps<typeof UICarousel>) {
  const responsive = useContext(VtexAdsShelfContext);
  const viewport = useViewport();
  const { loading, isMobile, isTablet } = useScreenResize();
  const config = viewport ? responsive?.[viewport] : undefined;
  const { items } = useVtexAdsProducts(config);
  const productCards = Children.toArray(children).filter(
    isValidElement,
  ) as ProductCardElement[];

  if (loading) return null;

  const template = productCards[0];
  let displayedCards: ReactNode[] = productCards;

  if (template && config?.placementName && items.length > 0) {
    const sponsoredSkus = new Set(items.map(({ product }) => product.sku));
    const sponsoredCards = items.slice(0, 2).map(({ ad, product }, index) => {
      const sponsoredProduct = {
        ...product,
        advertisement: {
          adId: ad.adId,
        },
      };
      const card = cloneElement(template, {
        key: `vtex-ads-${ad.adId}`,
        product: sponsoredProduct,
        index: index + 1,
      });

      return (
        <TrackedSponsoredProduct
          key={`vtex-ads-tracking-${ad.adId}`}
          ad={ad}
          placementName={config.placementName ?? ""}
        >
          {card}
        </TrackedSponsoredProduct>
      );
    });
    const organicCards = productCards
      .filter(({ props }) => !sponsoredSkus.has(props.product.sku))
      .slice(0, Math.max(0, productCards.length - sponsoredCards.length))
      .map((card, index) =>
        cloneElement(card, {
          index: sponsoredCards.length + index + 1,
        }),
      );

    displayedCards = [...sponsoredCards, ...organicCards];
  }

  return (
    <UICarousel
      {...carouselProps}
      itemsPerPage={isMobile || isTablet ? 1.6 : itemsPerPage}
    >
      {displayedCards}
    </UICarousel>
  );
}

const NativeProductShelf = getOverriddenSection({
  Section: ProductShelfSection,
  components: {
    __experimentalCarousel: {
      Component: SponsoredCarousel,
    },
    __experimentalProductCard: {
      props: {
        sponsoredLabel: "Patrocinado",
      },
    },
  },
});

export default function ProductShelf({
  vtexAds,
  ...shelfProps
}: ProductShelfProps) {
  return (
    <VtexAdsShelfContext.Provider value={vtexAds?.responsive}>
      <NativeProductShelf
        {...shelfProps}
        {...({ sponsoredCount: 0 } as { sponsoredCount: number })}
      />
    </VtexAdsShelfContext.Provider>
  );
}
