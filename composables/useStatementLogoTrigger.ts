import { type Ref, onMounted, onUnmounted } from 'vue'
import { useStatementLogoZone } from './useStatementLogoZone'

const DESKTOP_MQ = '(min-width: 1025px)'

function getLogoTriggerY(): number {
  const logo =
    document.querySelector<HTMLElement>('.appHeader .appBrandLogoMark__full') ??
    document.querySelector<HTMLElement>('.appHeader .appHeader__logo')
  if (!logo) return 0
  const rect = logo.getBoundingClientRect()
  return rect.top + rect.height / 2
}

/**
 * Logo clair tant que la section statement recouvre le centre du logo (desktop).
 */
export function useStatementLogoTrigger(sectionRef: Ref<HTMLElement | null>) {
  const statementInView = useStatementLogoZone()

  onMounted(() => {
    const mqDesktop = window.matchMedia(DESKTOP_MQ)
    let rafId = 0

    const evaluate = () => {
      rafId = 0
      if (!mqDesktop.matches || !sectionRef.value) {
        statementInView.value = false
        return
      }
      const triggerY = getLogoTriggerY()
      const { top, bottom } = sectionRef.value.getBoundingClientRect()
      statementInView.value = top <= triggerY && bottom > triggerY
    }

    const scheduleEvaluate = () => {
      if (rafId) return
      rafId = requestAnimationFrame(evaluate)
    }

    window.addEventListener('scroll', scheduleEvaluate, { passive: true })
    window.addEventListener('resize', scheduleEvaluate, { passive: true })
    mqDesktop.addEventListener('change', scheduleEvaluate)
    scheduleEvaluate()

    onUnmounted(() => {
      window.removeEventListener('scroll', scheduleEvaluate)
      window.removeEventListener('resize', scheduleEvaluate)
      mqDesktop.removeEventListener('change', scheduleEvaluate)
      if (rafId) cancelAnimationFrame(rafId)
      statementInView.value = false
    })
  })
}
