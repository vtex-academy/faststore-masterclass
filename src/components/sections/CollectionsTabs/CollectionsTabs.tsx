import { useEffect, useState } from "react";
import {
  gql,
  type GetCollectionShelfProductsQueryQuery,
  type GetCollectionShelfProductsQueryQueryVariables,
} from "@faststore/core/api";
import { useLazyQuery_unstable as useLazyQuery } from "@faststore/core/experimental";
import { Link } from "@faststore/ui";
import styles from "./collections-tabs.module.scss";

export const query = gql(`
  query getCollectionShelfProductsQuery($collectionId: String!, $first: Int) {
    collectionShelfProducts(collectionId: $collectionId, first: $first) {
      id
      name
      slug
      imageUrl
      imageAlt
      price
      listPrice
    }
  }
`);

type ImageProp = {
  src?: string;
  alt?: string;
};

type BackgroundProp = {
  type?: "image" | "color";
  image?: ImageProp;
  hexColor?: string;
};

type CollectionButtonProp = {
  label: string;
  backgroundType?: "image" | "color";
  image?: ImageProp;
  hexColor?: string;
  collectionId: string;
};

export interface CollectionsTabsProps {
  title: string;
  background?: BackgroundProp;
  seeAllLabel?: string;
  plpBasePath?: string;
  buttons: CollectionButtonProp[];
}

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatPrice(value: number) {
  return priceFormatter.format(value);
}

function swatchStyle(backgroundType?: "image" | "color", image?: ImageProp, hexColor?: string) {
  if (backgroundType === "image" && image?.src) {
    return { backgroundImage: `url(${image.src})` };
  }
  return { backgroundColor: hexColor || "#f0ede8" };
}

export default function CollectionsTabs(props: CollectionsTabsProps) {
  const { title, background, seeAllLabel = "Ver todos", plpBasePath = "/colecao", buttons = [] } = props;

  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [products, setProducts] = useState<
    GetCollectionShelfProductsQueryQuery["collectionShelfProducts"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [fetchCollectionShelfProducts, { data }] = useLazyQuery<
    GetCollectionShelfProductsQueryQuery,
    GetCollectionShelfProductsQueryQueryVariables
  >(query, {
    collectionId: "",
    first: 12,
  });

  const activeButton = buttons[activeIndex];

  useEffect(() => {
    if (!activeButton) return;

    // The response of a lazy query only lets us know it "arrived" via the
    // `data` effect below, so we track our own loading/visible-products
    // state to make the previous shelf disappear immediately on click.
    setIsLoading(true);
    setProducts([]);
    setCarouselIndex(0);
    fetchCollectionShelfProducts({ collectionId: activeButton.collectionId, first: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeButton?.collectionId]);

  useEffect(() => {
    if (data?.collectionShelfProducts) {
      setProducts(data.collectionShelfProducts);
      setIsLoading(false);
    }
  }, [data]);

  if (!activeButton) return null;

  const sectionBackgroundStyle =
    background?.type === "image" && background.image?.src
      ? { backgroundImage: `url(${background.image.src})` }
      : { backgroundColor: background?.hexColor || "#fff9f5" };

  const currentProduct = products[carouselIndex];
  const seeAllHref = `${plpBasePath}?collection=${activeButton.collectionId}`;

  return (
    <section className={`section ${styles.collectionsTabs}`}>
      <div className="layout__content">
        <div className={styles.panel} style={sectionBackgroundStyle}>
          <h2 className={styles.title}>{title}</h2>

          <div className={styles.buttons}>
            {buttons.slice(0, 5).map((button, index) => (
              <button
                key={button.collectionId}
                type="button"
                className={`${styles.swatch} ${index === activeIndex ? styles.swatchActive : ""}`}
                style={swatchStyle(button.backgroundType, button.image, button.hexColor)}
                aria-pressed={index === activeIndex}
                aria-label={button.label}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>

          <Link href={seeAllHref} className={styles.seeAll}>
            {seeAllLabel}
          </Link>
        </div>

        <div className={styles.shelf}>
          {isLoading && <div className={styles.shelfState}>Carregando...</div>}

          {!isLoading && !currentProduct && (
            <div className={styles.shelfState}>Nenhum produto encontrado nesta coleção.</div>
          )}

          {!isLoading && currentProduct && (
            <>
              <p className={styles.counter}>
                {carouselIndex + 1} / {products.length}
              </p>

              <div className={styles.carousel}>
                <button
                  type="button"
                  className={styles.arrow}
                  aria-label="Produto anterior"
                  disabled={carouselIndex === 0}
                  onClick={() => setCarouselIndex((current) => Math.max(current - 1, 0))}
                >
                  ‹
                </button>

                <a href={`/${currentProduct.slug}`} className={styles.productCard}>
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct.imageAlt}
                    className={styles.productImage}
                  />
                  <p className={styles.productName}>{currentProduct.name}</p>
                  <p className={styles.productPrice}>
                    {currentProduct.listPrice > currentProduct.price && (
                      <span className={styles.productListPrice}>
                        {formatPrice(currentProduct.listPrice)}
                      </span>
                    )}
                    <span className={styles.productSellingPrice}>
                      {formatPrice(currentProduct.price)}
                    </span>
                  </p>
                </a>

                <button
                  type="button"
                  className={styles.arrow}
                  aria-label="Próximo produto"
                  disabled={carouselIndex === products.length - 1}
                  onClick={() =>
                    setCarouselIndex((current) => Math.min(current + 1, products.length - 1))
                  }
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
