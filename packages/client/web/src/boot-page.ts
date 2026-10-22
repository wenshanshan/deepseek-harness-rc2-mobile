/**
 * Framework-free boot page and failure report. It remains available when a
 * client plugin fails because React arrives only with the UI renderer.
 * @module @deepseek-ai/dsh-client-web/src/boot-page
 */
import type { LoaderEntryState } from './loader-status.ts'
import css from './boot-page.module.css'

/** Create a div with one module class and optional text. */
function div(className: string | undefined, text?: string): HTMLDivElement {
  const el = document.createElement('div')
  el.className = className ?? ''
  if (text !== undefined) el.textContent = text
  return el
}

/**
 * Data attributes shared by the served document's skeleton and this page. The
 * skeleton is in `index.html`, so it paints before any script arrives; boot
 * adopts those exact nodes instead of drawing over them, and the renderer's
 * hydration handoff then reads what the first frame already showed.
 */
const NODE = {
  root: 'dshBoot',
  card: 'dshBootCard',
  wordmark: 'dshBootWordmark',
  spinner: 'dshBootSpinner',
  hint: 'dshBootHint',
  progress: 'dshBootProgress',
} as const

/** The nodes the page owns, adopted from the document when it shipped them. */
interface BootNodes {
  readonly root: HTMLDivElement
  readonly card: HTMLDivElement
  readonly wordmark: HTMLDivElement
  readonly spinner: HTMLDivElement
  readonly hint: HTMLDivElement
  readonly progress: HTMLDivElement
}

/** Read one node's marker. */
function marked(el: HTMLElement, key: string): boolean {
  return (el.dataset as Record<string, string | undefined>)[key] !== undefined
}

/** Mark one node so a later adoption pass recognizes it. */
function mark(el: HTMLElement, key: string): void {
  (el.dataset as Record<string, string | undefined>)[key] = ''
}

/** Find the first direct child marked with `key`, or create it with `className`. */
function child(el: HTMLElement, key: string, className: string | undefined, text?: string): HTMLDivElement {
  const found = [...el.children].find(candidate => candidate instanceof HTMLDivElement && marked(candidate, key))
  if (found !== undefined) return found as HTMLDivElement
  const created = div(className, text)
  mark(created, key)
  el.append(created)
  return created
}

/**
 * Adopt the document's skeleton or build one for a container that has none.
 * @param container - Application mount point.
 * @returns the page's nodes, every one marked for later adoption.
 */
function adoptNodes(container: HTMLElement): BootNodes {
  const adopted = [...container.children].find(candidate => candidate instanceof HTMLDivElement && marked(candidate, NODE.root))
  let root: HTMLDivElement
  if (adopted === undefined) {
    root = div(css.boot)
    mark(root, NODE.root)
    container.append(root)
  } else {
    root = adopted as HTMLDivElement
  }
  const card = child(root, NODE.card, css.card)
  return {
    root,
    card,
    wordmark: child(card, NODE.wordmark, css.wordmark, 'HARNESS'),
    spinner: child(card, NODE.spinner, css.spinner),
    hint: child(card, NODE.hint, css.hint, 'Loading plugins…'),
    progress: child(card, NODE.progress, css.progress),
  }
}

/** Kernel-owned page mounted below the application's root element. */
export class BootPage {
  private readonly nodes: BootNodes
  private readonly states = new Map<string, LoaderEntryState>()
  private readonly active = new Set<string>()
  private total = 0
  private failure: string | undefined

  /**
   * Adopt or draw the boot page.
   * @param container - Application mount point.
   */
  constructor(container: HTMLElement) {
    this.nodes = adoptNodes(container)
    this.updateProgress()
  }

  /**
   * Set the number of loader entries represented by the progress arc.
   * @param total - Complete boot roster size.
   */
  setTotal(total: number): void {
    this.total = total
    this.updateProgress()
  }

  /**
   * Project one loader entry's fiber state.
   * @param id - Loader entry name.
   * @param state - Projected fiber state.
   */
  setState(id: string, state: LoaderEntryState): void {
    this.states.set(id, state)
    if (state === 'active') this.active.add(id)
    this.updateProgress()
    this.render()
  }

  /**
   * Display the boot failure report.
   * @param message - Failure report text.
   */
  fail(message: string): void {
    this.failure = message
    this.render()
  }

  /** Detach the page before or after the UI renderer takes the mount point. */
  dispose(): void {
    this.nodes.root.remove()
  }

  /** Redraw the state-dependent content below the wordmark. */
  private render(): void {
    const { card, wordmark } = this.nodes
    const failed = [...this.states].filter(([, state]) => state === 'failed').map(([id]) => id)
    if (this.failure === undefined && failed.length === 0) {
      this.restoreLoading()
      return
    }
    const report = div(css.failed)
    report.append(div(css.failedTitle, 'Failed to load plugins'))
    for (const id of failed) report.append(div(css.failedItem, id))
    if (this.failure !== undefined) report.append(div(css.failedItem, this.failure))
    card.replaceChildren(wordmark, report)
  }

  /** Put the loading nodes back after a failure report, keeping the adopted nodes. */
  private restoreLoading(): void {
    const { card, wordmark, spinner, hint, progress } = this.nodes
    const loading = [wordmark, spinner, hint, progress]
    const current = [...card.children]
    if (current.length === loading.length && loading.every((node, index) => current[index] === node)) return
    card.replaceChildren(...loading)
  }

  /** Grow the rotating arc monotonically as loader entries activate. */
  private updateProgress(): void {
    const ratio = this.total === 0 ? 0 : Math.min(this.active.size / this.total, 1)
    this.nodes.spinner.style.setProperty('--dsh-boot-arc', `${String(Math.round(72 + ratio * 216))}deg`)
    // The hint keeps its authored text so locators and screenshots stay stable;
    // the count rides beside it, and stays empty until a roster arrives.
    this.nodes.progress.textContent = this.total === 0 ? '' : `${String(this.active.size)}/${String(this.total)}`
  }
}
