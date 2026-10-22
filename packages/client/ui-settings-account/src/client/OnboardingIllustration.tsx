/** Paired artwork follows the page's light and dark theme selectors. */
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import css from './DesktopOnboarding.module.css'

/**
 * The eight inlined data URLs are the package artifact's weight and only the
 * first-run overlay shows them, so they load in their own chunk on display.
 */
const LoadedOnboardingArtwork = lazy(async () => ({
  default: (await import('./OnboardingArtwork.tsx')).OnboardingArtwork,
}))

/**
 * Reserve the artwork's geometry until its chunk arrives, then render the
 * theme variants. The chunk receives class names instead of the stylesheet so
 * it shares no module with this entry.
 * @param props - page geometry class, page artwork, and the active language.
 * @returns the deferred illustration.
 */
export function OnboardingIllustration({ className = '', page, locale }: {
  className?: string | undefined
  page: 'welcome' | 'credit'
  locale: string
}): ReactNode {
  const container = `${css.illustration} ${className}`
  return <Suspense fallback={<div className={container} aria-hidden="true" />}>
    <LoadedOnboardingArtwork className={container} lightClassName={`${css.lightIllustration}`}
      darkClassName={`${css.darkIllustration}`} page={page} locale={locale} />
  </Suspense>
}
