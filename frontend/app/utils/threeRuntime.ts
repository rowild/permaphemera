import type * as ThreeModule from 'three'

// Three.js (≈150 KB gzipped) is not part of the start page's first chunk: the hero wheel loads
// it when it builds its scene, after the hero text (plans/2026-11-04__nuxt-optimisation-audit.md
// 1.4). Never import it statically elsewhere: check-conventions guards that.
let three: typeof ThreeModule | undefined
let loading: Promise<typeof ThreeModule> | undefined

/** Loads Three.js once; every caller gets the same module. */
export const loadThree = () => (loading ??= import('three').then((module) => (three = module)))

/** Three.js after loadThree() has resolved. */
export const useThree = (): typeof ThreeModule => {
  if (!three) throw new Error('Three.js is not loaded yet: await loadThree() first.')
  return three
}
