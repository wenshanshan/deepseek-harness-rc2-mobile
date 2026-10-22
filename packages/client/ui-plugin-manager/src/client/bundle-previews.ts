/**
 * Bundle names whose detail page shows feature artwork, shared by the page and
 * its deferred preview chunk. Type-only: the two halves keep no runtime module
 * in common, which is what lets the artwork split into its own client chunk.
 * The name list is a value, so the page can decide whether a bundle has a
 * preview without loading the artwork.
 */
export const BUNDLE_PREVIEW_NAMES = [
  '@deepseek-ai/dsh-experimental-badge-skill-bundle',
  '@deepseek-ai/dsh-experimental-voice-input-bundle',
] as const

/** One official bundle with feature artwork. */
export type PreviewBundleName = typeof BUNDLE_PREVIEW_NAMES[number]
