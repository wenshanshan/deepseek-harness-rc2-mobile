/**
 * Onboarding page artwork, loaded as its own client chunk. The eight inlined
 * data URLs are the package artifact's whole weight, and only the first-run
 * overlay shows them, so the entry requests this chunk on display instead of
 * carrying the images into every boot.
 */
import welcome from './assets/onboarding-welcome.webp'
import welcomeDark from './assets/onboarding-welcome-dark.webp'
import welcomeZh from './assets/onboarding-welcome-zh.webp'
import welcomeZhDark from './assets/onboarding-welcome-zh-dark.webp'
import recharge from './assets/onboarding-recharge.webp'
import rechargeDark from './assets/onboarding-recharge-dark.webp'
import rechargeZh from './assets/onboarding-recharge-zh.webp'
import rechargeZhDark from './assets/onboarding-recharge-zh-dark.webp'

const artwork = {
  welcome: { light: welcome, dark: welcomeDark, zh: welcomeZh, zhDark: welcomeZhDark },
  credit: { light: recharge, dark: rechargeDark, zh: rechargeZh, zhDark: rechargeZhDark },
} as const

/** Illustration classes the entry owns; the chunk renders the images without importing the stylesheet. */
export interface OnboardingArtworkProps {
  /** Illustration container class, already composed with the page's geometry. */
  className: string
  /** Light-theme image class. */
  lightClassName: string
  /** Dark-theme image class. */
  darkClassName: string
  /** Page whose artwork to show. */
  page: keyof typeof artwork
  /** Active interface language selects the matching illustration variant. */
  locale: string
}

/**
 * @param props - entry-owned class names, the page, and the active language.
 * @returns the page's paired light and dark artwork.
 */
export function OnboardingArtwork({ className, lightClassName, darkClassName, page, locale }: OnboardingArtworkProps) {
  const choice = artwork[page]
  return <div className={className} aria-hidden="true">
    <img className={lightClassName} src={locale === 'zh' ? choice.zh : choice.light} alt="" />
    <img className={darkClassName} src={locale === 'zh' ? choice.zhDark : choice.dark} alt="" />
  </div>
}
