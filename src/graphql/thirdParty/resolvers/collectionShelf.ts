import discoveryConfig from "../../../../discovery.config.js";

type VtexCommercialOffer = {
  Price: number;
  ListPrice: number;
};

type VtexSeller = {
  commertialOffer: VtexCommercialOffer;
};

type VtexImage = {
  imageUrl: string;
  imageText?: string;
};

type VtexItem = {
  images: VtexImage[];
  sellers: VtexSeller[];
};

type VtexCatalogProduct = {
  productId: string;
  productName: string;
  linkText: string;
  items: VtexItem[];
};

type CollectionShelfProductsArgs = {
  collectionId: string;
  first?: number;
};

type CollectionShelfProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  listPrice: number;
};

const { storeId, environment } = discoveryConfig.api as {
  storeId: string;
  environment: string;
};

const salesChannel = (() => {
  try {
    return JSON.parse(discoveryConfig.session.channel).salesChannel ?? "1";
  } catch {
    return "1";
  }
})();

const mapProduct = (product: VtexCatalogProduct): CollectionShelfProduct | null => {
  const item = product.items?.[0];
  const seller = item?.sellers?.[0];
  const image = item?.images?.[0];

  if (!item || !seller) return null;

  return {
    id: product.productId,
    name: product.productName,
    slug: `${product.linkText}/p`,
    imageUrl: image?.imageUrl ?? "",
    imageAlt: image?.imageText ?? product.productName,
    price: seller.commertialOffer.Price,
    listPrice: seller.commertialOffer.ListPrice,
  };
};

const collectionShelfResolver = {
  Query: {
    collectionShelfProducts: async (
      _: unknown,
      { collectionId, first = 12 }: CollectionShelfProductsArgs,
    ) => {
      const url = new URL(
        `https://${storeId}.${environment}.com.br/api/catalog_system/pub/products/search`,
      );
      url.searchParams.set("fq", `productClusterIds:${collectionId}`);
      url.searchParams.set("sc", String(salesChannel));
      url.searchParams.set("_from", "0");
      url.searchParams.set("_to", String(Math.max(first - 1, 0)));

      const response = await fetch(url.toString());

      if (!response.ok) {
        return [];
      }

      const products: VtexCatalogProduct[] = await response.json();

      return products.map(mapProduct).filter((product): product is NonNullable<typeof product> => product !== null);
    },
  },
};

export default collectionShelfResolver;
