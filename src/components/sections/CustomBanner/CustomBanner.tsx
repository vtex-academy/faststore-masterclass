import { Image_unstable as Image } from "@faststore/core/experimental"
import styles from "./custom-banner.module.scss"

export type CustomBannerProps = {
  title: string
  subtitle?: string
  image?: {
    src: string
    alt?: string
  }
  link?: {
    text: string
    url: string
    linkTargetBlank?: boolean
  }
  colorVariant?: "main" | "light" | "accent"
}

export default function CustomBanner({
  title,
  subtitle,
  image,
  link,
  colorVariant = "main",
}: CustomBannerProps) {
  return (
    <section
      className={`section ${styles.customBanner}`}
      data-color-variant={colorVariant}
    >
      <div className="layout__content">
        <div className={styles.content}>
          <div className={styles.copy}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            {link?.text && link?.url ? (
              <a
                href={link.url}
                target={link.linkTargetBlank ? "_blank" : undefined}
                rel={link.linkTargetBlank ? "noopener noreferrer" : undefined}
                className={styles.cta}
              >
                {link.text}
              </a>
            ) : null}
          </div>
          {image?.src ? (
            <div className={styles.media}>
              <Image
                src={image.src}
                alt={image.alt || title}
                width={640}
                height={400}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
