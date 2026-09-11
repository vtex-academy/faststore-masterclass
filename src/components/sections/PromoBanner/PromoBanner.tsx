import { Image_unstable as Image } from "@faststore/core/experimental"
import { LinkButton as UILinkButton } from "@faststore/ui"
import styles from "./promo-banner.module.scss"

type PromoBannerImage = {
  src?: string
  alt?: string
}

type PromoBannerLink = {
  text?: string
  url?: string
  linkTargetBlank?: boolean
}

type PromoBannerProps = {
  title: string
  subtitle?: string
  image?: PromoBannerImage
  link?: PromoBannerLink
  colorVariant?: "main" | "light" | "accent"
}

export default function PromoBanner({
  title,
  subtitle,
  image,
  link,
  colorVariant = "main",
}: PromoBannerProps) {
  const hasImage = Boolean(image?.src)
  const hasCta = Boolean(link?.text && link?.url)

  return (
    <section
      className={`section ${styles.promoBanner}`}
      data-fs-promo-banner
      data-fs-promo-banner-color-variant={colorVariant}
    >
      <div className="layout__content">
        <div data-fs-promo-banner-content>
          <div data-fs-promo-banner-copy>
            <h2 data-fs-promo-banner-title>{title}</h2>
            {subtitle ? (
              <p data-fs-promo-banner-subtitle>{subtitle}</p>
            ) : null}
            {hasCta ? (
              <UILinkButton
                href={link!.url}
                variant="primary"
                inverse={colorVariant === "accent"}
                target={link!.linkTargetBlank ? "_blank" : undefined}
                rel={link!.linkTargetBlank ? "noopener noreferrer" : undefined}
              >
                {link!.text}
              </UILinkButton>
            ) : null}
          </div>
          {hasImage ? (
            <div data-fs-promo-banner-media>
              <Image
                src={image!.src!}
                alt={image?.alt ?? title}
                width={720}
                height={480}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
