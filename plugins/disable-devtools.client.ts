/**
 * Production only: block common DevTools shortcuts (best-effort, not foolproof).
 */
export default defineNuxtPlugin(() => {
  if (import.meta.dev) return

  const blockDevToolsShortcut = (event: KeyboardEvent) => {
    const key = (event.key ?? '').toLowerCase()
    if (!key) return

    const isDevtoolsKey =
      key === 'f12' ||
      (event.ctrlKey && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
      (event.metaKey && event.altKey && (key === 'i' || key === 'j')) ||
      (event.ctrlKey && key === 'u')

    if (!isDevtoolsKey) return

    event.preventDefault()
    event.stopPropagation()
  }

  window.addEventListener('keydown', blockDevToolsShortcut, { capture: true })
})
