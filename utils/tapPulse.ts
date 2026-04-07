const running = new WeakMap<HTMLElement, Animation>()

export const DEFAULT_BUTTON_TAP_MS = 280
export const SEAT_MAP_TOOLBAR_TAP_MS = 450

export function cancelAndAnimate(
  element: HTMLElement,
  keyframes: Keyframe[],
  durationMs: number
): Animation | null {
  if (import.meta.server) return null
  running.get(element)?.cancel()
  const anim = element.animate(keyframes, { duration: durationMs, easing: 'ease' })
  running.set(element, anim)
  anim.onfinish = () => {
    if (running.get(element) === anim) running.delete(element)
  }
  return anim
}

export function defaultButtonPrimaryTapKeyframes(): Keyframe[] {
  return [
    { color: '#fff', backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
    { color: '#0d6efd', backgroundColor: '#fff', borderColor: '#0d6efd', offset: 0.4 },
    { color: '#fff', backgroundColor: '#0d6efd', borderColor: '#0d6efd' }
  ]
}

export function defaultButtonSecondaryTapKeyframes(): Keyframe[] {
  return [
    { color: '#fff', backgroundColor: '#6c757d', borderColor: '#6c757d' },
    { color: '#6c757d', backgroundColor: '#fff', borderColor: '#6c757d', offset: 0.4 },
    { color: '#fff', backgroundColor: '#6c757d', borderColor: '#6c757d' }
  ]
}

export function defaultButtonCancelReservationTapKeyframes(): Keyframe[] {
  return [
    { color: '#fff', backgroundColor: '#a97272', borderColor: '#a97272' },
    { color: '#6f4242', backgroundColor: '#fdf8f8', borderColor: '#d4b0b0', offset: 0.4 },
    { color: '#fff', backgroundColor: '#a97272', borderColor: '#a97272' }
  ]
}

/** Même logique que `@keyframes seatMapToolbarTap` (_colors.scss). */
export function seatMapToolbarSurfaceTapKeyframes(): Keyframe[] {
  return [
    {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ced4da',
      color: '#3d454d',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)'
    },
    {
      backgroundColor: '#3d454d',
      borderColor: '#3d454d',
      color: '#ffffff',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.14)',
      offset: 0.4
    },
    {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ced4da',
      color: '#3d454d',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)'
    }
  ]
}

/** Même logique que `@keyframes seatMapToolbarTapFg`. */
export function seatMapToolbarIconTapKeyframes(): Keyframe[] {
  return [
    { color: '#3d454d' },
    { color: '#ffffff', offset: 0.4 },
    { color: '#3d454d' }
  ]
}
