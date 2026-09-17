import { flushSync } from 'react-dom'
import { useThemeStore } from '@/store/theme.ts'

type ThemeOrigin = { x: number; y: number }

let themeTransitionRunning = false

function setThemeChanging(active: boolean) {
  document.documentElement.classList.toggle('theme-changing', active)
}

function applyThemeToggle() {
  setThemeChanging(true)
  flushSync(() => {
    useThemeStore.getState().toggleMode()
  })
}

function finishThemeChange() {
  window.requestAnimationFrame(() => {
    setThemeChanging(false)
  })
}

function canAnimateTheme() {
  return (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function revealFromOrigin(origin: ThemeOrigin) {
  const endRadius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${origin.x}px ${origin.y}px)`,
        `circle(${endRadius}px at ${origin.x}px ${origin.y}px)`,
      ],
    },
    {
      duration: 480,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'both',
      pseudoElement: '::view-transition-new(root)',
    },
  )
}

export function toggleThemeWithTransition(origin: ThemeOrigin) {
  if (themeTransitionRunning) return
  if (!canAnimateTheme()) {
    applyThemeToggle()
    finishThemeChange()
    return
  }

  themeTransitionRunning = true
  try {
    const transition = document.startViewTransition(applyThemeToggle)
    void transition.ready.then(() => revealFromOrigin(origin)).catch(() => undefined)
    void transition.finished.finally(() => {
      themeTransitionRunning = false
      finishThemeChange()
    })
  } catch {
    themeTransitionRunning = false
    applyThemeToggle()
    finishThemeChange()
  }
}

export function resetThemeTransitionForTests() {
  themeTransitionRunning = false
}
