/**
 * Feature artwork for an official bundle's detail page, loaded as its own
 * client chunk. The four inlined SVG data URLs are most of this package's
 * browser bytes and only the two previewed detail pages show them, so the page
 * requests this chunk on display instead of carrying the images into every boot.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { LocalizedText } from '@deepseek-ai/dsh-package-manifest'
import badgeSkillPreview from './assets/badge-skill-preview.svg'
import badgeSkillPreviewZh from './assets/badge-skill-preview.zh.svg'
import voiceInputPreview from './assets/voice-input-preview.svg'
import voiceInputPreviewZh from './assets/voice-input-preview.zh.svg'
import type { PreviewBundleName } from './bundle-previews.ts'

/** Feature previews of official bundles, shown on their detail pages and selected by UI language. */
const BUNDLE_PREVIEWS = new Map<string, Readonly<Record<'en' | 'zh', string>>>([
  ['@deepseek-ai/dsh-experimental-badge-skill-bundle', { en: badgeSkillPreview, zh: badgeSkillPreviewZh }],
  ['@deepseek-ai/dsh-experimental-voice-input-bundle', { en: voiceInputPreview, zh: voiceInputPreviewZh }],
])

/** Presentation the page owns; the chunk receives it instead of importing the page's modules. */
export interface BundlePreviewProps {
  /** The official bundle whose artwork to show. */
  bundle: PreviewBundleName
  /** The page's language-aware text resolver, applied to the artwork map. */
  resolveText: (text: LocalizedText) => string
  /** Image class the page owns. */
  imageClassName: string
  /** Failure text class the page owns. */
  failureClassName: string
  /** Localized image description. */
  alt: string
  /** Localized text shown in place of an image that fails to decode. */
  unavailable: string
}

/**
 * A bundle's feature preview; a failed decode is reported in place without blocking management.
 * @param props - bundle, page-owned classes, the text resolver and localized copy.
 * @returns the bundle's artwork, or the in-place decode failure.
 */
export function BundlePreview({ bundle, resolveText, imageClassName, failureClassName, alt, unavailable }: BundlePreviewProps): ReactNode {
  const previews = BUNDLE_PREVIEWS.get(bundle)
  /* v8 ignore next -- the page only renders this for a bundle its name list contains. */
  if (previews === undefined) return null
  const source = resolveText(previews)
  const [failedSource, setFailedSource] = useState<string>()
  return source === failedSource
    ? <p className={failureClassName} role="status">{unavailable}</p>
    : <img className={imageClassName} src={source} alt={alt} onError={() => { setFailedSource(source) }} />
}
