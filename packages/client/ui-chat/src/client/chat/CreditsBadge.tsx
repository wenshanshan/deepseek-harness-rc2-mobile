/** Coin glyph and rounded credit cost shared by the running, settled, and usage readouts. */
import { memo } from 'react'
import type { ChatViewSlotProps } from '../contract/slots.ts'
import a11yCss from './accessibility.module.css'
import css from './CreditsBadge.module.css'

/**
 * Round a provider-forwarded credit cost to the two decimals the product shows.
 * @param value - Non-negative finite credit cost.
 * @returns the value with exactly two fraction digits.
 */
export function formatCredits(value: number): string {
  return value.toFixed(2)
}

/** Coin artwork local to the credit readout that owns it. */
const CreditCoin = () => (
  <svg className={css.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="5.9" stroke="currentColor" strokeWidth="1" />
    <path d="M8 4.4 9.05 6.95 11.6 8 9.05 9.05 8 11.6 6.95 9.05 4.4 8 6.95 6.95Z" fill="currentColor" />
  </svg>
)

interface CreditsBadgeProps {
  /** Credit cost reported for the Turn so far. */
  readonly credits: number
  readonly t: ChatViewSlotProps['t']
}

/**
 * Read a Turn's credit cost as a coin followed by its two-decimal value.
 * @param props - Credit cost and the view's locale seat.
 * @returns An inline readout whose spoken form names the bucket.
 */
export const CreditsBadge = memo(function CreditsBadge({ credits, t }: CreditsBadgeProps) {
  const value = formatCredits(credits)
  return (
    <span className={css.root} data-chat-credits={value}>
      <CreditCoin />
      <span className={a11yCss.visuallyHidden}>{t('message.turnUsage.credits')}</span>
      <span className={css.value}>{value}</span>
    </span>
  )
})
