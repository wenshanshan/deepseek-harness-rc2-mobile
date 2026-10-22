// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { BootPage } from '../src/boot-page.ts'

afterEach(() => { document.body.innerHTML = '' })

function mount() {
  const el = document.createElement('div')
  document.body.append(el)
  return { el, page: new BootPage(el) }
}

/** The skeleton the served document paints before any script arrives. */
function serveSkeleton(el: HTMLElement): void {
  el.innerHTML = '<div class="dsh-boot-static" data-dsh-boot=""><div class="dsh-boot-card" data-dsh-boot-card="">'
    + '<div class="dsh-boot-wordmark" data-dsh-boot-wordmark="">HARNESS</div>'
    + '<div class="dsh-boot-spinner" data-dsh-boot-spinner=""></div>'
    + '<div class="dsh-boot-hint" data-dsh-boot-hint="">Loading plugins…</div>'
    + '<div class="dsh-boot-progress" data-dsh-boot-progress=""></div></div></div>'
}

describe('BootPage', () => {
  it('draws the loading skeleton before any plugin state arrives', () => {
    const { el } = mount()
    expect(el.firstElementChild?.getAttribute('data-dsh-boot')).toBe('')
    expect(el.textContent).toContain('HARNESS')
    expect(el.textContent).toContain('Loading plugins…')
  })

  it('adopts the skeleton the document already painted instead of drawing a second one', () => {
    const el = document.createElement('div')
    document.body.append(el)
    serveSkeleton(el)
    const spinner = el.querySelector('[data-dsh-boot-spinner]')
    const page = new BootPage(el)
    expect(el.querySelectorAll('[data-dsh-boot]')).toHaveLength(1)
    expect(el.querySelector('[data-dsh-boot-spinner]')).toBe(spinner)
    page.setTotal(2)
    page.setState('a', 'active')
    expect(spinner?.getAttribute('style')).toContain('--dsh-boot-arc')
  })

  it('keeps the adopted document class names for the hydration handoff', () => {
    const el = document.createElement('div')
    document.body.append(el)
    serveSkeleton(el)
    const page = new BootPage(el)
    // The renderer's hydration handoff re-renders the boot DOM it captured; a
    // rewritten class would make the painted frame and the hydrated frame differ.
    expect(el.querySelector('[data-dsh-boot]')?.className).toBe('dsh-boot-static')
    page.setState('a', 'active')
    expect(el.querySelector('[data-dsh-boot]')?.className).toBe('dsh-boot-static')
  })

  it('reports the activated count beside the authored hint', () => {
    const { el, page } = mount()
    const progress = el.querySelector('[data-dsh-boot-progress]')
    expect(progress?.textContent).toBe('')
    page.setTotal(4)
    expect(progress?.textContent).toBe('0/4')
    page.setState('a', 'active')
    page.setState('b', 'active')
    expect(progress?.textContent).toBe('2/4')
    // The hint keeps its exact authored text for locators and screenshots.
    expect(el.querySelector('[data-dsh-boot-hint]')?.textContent).toBe('Loading plugins…')
  })

  it('keeps loading while entries are active or loading', () => {
    const { el, page } = mount()
    page.setTotal(2)
    const spinner = el.querySelector<HTMLElement>('[data-dsh-boot-spinner]')
    expect(spinner?.style.getPropertyValue('--dsh-boot-arc')).toBe('72deg')
    page.setState('a', 'active')
    expect(spinner?.style.getPropertyValue('--dsh-boot-arc')).toBe('180deg')
    page.setState('b', 'loading')
    expect(el.querySelector('[data-dsh-boot-spinner]')).toBe(spinner)
    page.setState('b', 'active')
    expect(spinner?.style.getPropertyValue('--dsh-boot-arc')).toBe('288deg')
    expect(el.textContent).toContain('Loading plugins…')
    expect(el.textContent).not.toContain('Failed to load plugins')
  })

  it('lists failed entries', () => {
    const { el, page } = mount()
    page.setState('@deepseek-ai/dsh-client-ui-layout', 'failed')
    page.setState('ok', 'active')
    page.setState('@deepseek-ai/dsh-client-ui-tool', 'failed')
    expect(el.textContent).toContain('@deepseek-ai/dsh-client-ui-layout')
    expect(el.textContent).toContain('@deepseek-ai/dsh-client-ui-tool')
    expect(el.textContent).not.toContain('ok')
    expect(el.textContent).not.toContain('Loading plugins…')
  })

  it('restores the adopted loading nodes when a failure clears', () => {
    const el = document.createElement('div')
    document.body.append(el)
    serveSkeleton(el)
    const page = new BootPage(el)
    page.setState('a', 'failed')
    expect(el.textContent).toContain('Failed to load plugins')
    page.setState('a', 'active')
    expect(el.querySelector('[data-dsh-boot-hint]')).not.toBeNull()
    expect(el.querySelector('[data-dsh-boot-spinner]')).not.toBeNull()
    expect(el.querySelectorAll('[data-dsh-boot]')).toHaveLength(1)
  })

  it('shows the complete sweep report', () => {
    const { el, page } = mount()
    const report = 'web boot: 1 entry did not activate\nx: pending (waiting for service: y)'
    page.fail(report)
    page.setState('a', 'active')
    expect(el.textContent).toContain(report)
    expect(el.textContent).not.toContain('Loading plugins…')
  })

  it('detaches on disposal', () => {
    const { el, page } = mount()
    page.dispose()
    expect(el.childNodes).toHaveLength(0)
  })
})
