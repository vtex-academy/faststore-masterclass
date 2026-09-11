import { Image_unstable as Image } from '@faststore/core/experimental'
import styles from './banner-snb.module.scss'

interface BannerSnbImage {
  src: string
  alt?: string
}

interface BannerSnbProps {
  /** Required by the CMS schema */
  title: string
  /** Required by the CMS schema */
  description: string
  images?: BannerSnbImage[]
  link?: {
    text?: string
    url?: string
    linkTargetBlank?: boolean
  }
  colorVariant?: 'main' | 'light' | 'accent'
}

export default function BannerSnb({
  title,
  description,
  images,
  link,
  colorVariant = 'main',
}: BannerSnbProps) {
  const hasImages = Boolean(images?.length)

  return (
    <section
      className={`section ${styles.bannerSnb}`}
      data-fs-banner-snb
      data-fs-banner-snb-color-variant={colorVariant}
    >
      <div className="layout__content">
        <div data-fs-banner-snb-content>
          <h2 data-fs-banner-snb-title>{title}</h2>
          <p data-fs-banner-snb-description>{description}</p>

          {link?.url && link?.text && (
            <a
              data-fs-banner-snb-link
              href={link.url}
              target={link.linkTargetBlank ? '_blank' : undefined}
              rel={link.linkTargetBlank ? 'noreferrer' : undefined}
            >
              {link.text}
            </a>
          )}
        </div>

        {hasImages && (
          <div data-fs-banner-snb-images>
            {images?.map(
              (image, index) =>
                image?.src && (
                  <Image
                    key={`${image.src}-${index}`}
                    src={image.src}
                    alt={image.alt ?? ''}
                    width={640}
                    height={360}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                )
            )}
          </div>
        )}
      </div>
    </section>
  )
}
