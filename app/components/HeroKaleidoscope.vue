<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import * as THREE from 'three'

const props = defineProps<{
  images: string[]
  imagePool?: string[]
}>()
const emit = defineEmits<{
  animationStateChange: [isAnimating: boolean]
  controlsReveal: []
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const orbitRadius = 52
const kaleidoscopeViewSize = 2.35
const cameraDistance = 3
const cameraFov = THREE.MathUtils.radToDeg(
  2 * Math.atan(kaleidoscopeViewSize / (2 * cameraDistance))
)
const radialOffsetPixels = 10
const sliceAngle = (Math.PI * 2) / 12
const triangleOuterRadius = 0.98
const triangleBaseHeight = Math.tan(Math.PI / 6) * triangleOuterRadius + 0.006
const triangleCentroidX = (triangleOuterRadius * 2) / 3
const triangleCentroidY = triangleBaseHeight / 3
// The requested blade axis runs from A through the midpoint of the opposite B-C edge.
const triangleMedianAngle = Math.atan2(triangleBaseHeight / 2, triangleOuterRadius)
const orbitStartAngle = 2
const orbitEndAngle = 28
const orbitArrowPath = describeOrbitArc(orbitStartAngle, orbitEndAngle)
const orbitArrowGradient = describeOrbitGradient(orbitStartAngle, orbitEndAngle)
const orbitArrowHead = describeArrowHead(orbitEndAngle)
const orbitSegments = Array.from({ length: 12 }, (_, index) => ({ id: index, rotation: index * 30 }))
type StaggerDirection = 'cw' | 'ccw'
type SliceImageLayer = {
  group: THREE.Group
  material: THREE.MeshBasicMaterial
  mesh: THREE.Mesh
}
type SliceImageState = {
  activeIndex: 0 | 1
  layers: [SliceImageLayer, SliceImageLayer]
}
type TextureAssignmentOptions = {
  animate?: boolean
  cachedOnly?: boolean
  showLoader?: boolean
}
const introConfig = {
  arrowDuration: 0.9,
  arrowStagger: 0.14,
  arrowStaggerRitardando: 0.008,
  arrowStaggerDirection: 'cw' as StaggerDirection,
  // Positive N: triangle 1 starts with arrow N. Negative N: arrow 1 starts with triangle N.
  sequenceOverlap: -9,
  triangleDuration: 2.25,
  triangleDurationRitardando: 0.075,
  triangleStagger: 0.12,
  triangleStaggerRitardando: 0.02,
  triangleStaggerDirection: 'cw' as StaggerDirection
}
const rotationConfig = {
  arrowDuration: 0.72,
  arrowStagger: 0.06,
  clockwiseArrowsStartAtTriangle: 6,
  counterclockwiseTrianglesStartAtArrow: 5,
  triangleStagger: 0.028,
  settleOffsets: [0.035, -0.012, 0.004, 0],
  settleDurations: [0.56, 0.2, 0.18, 0.17],
  bladeTilt: 0.28,
  bladeCounterTilt: -0.02
}
const replayConfig = {
  exitTimeScale: 1.25,
  triangleFadeDuration: 0.72
}
const imageSwapConfig = {
  duration: 1,
  incomingStart: 0.22,
  outgoingDuration: 0.72
}
const arrowRotationValues = orbitSegments.map((segment) => segment.rotation)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let textureLoader: THREE.TextureLoader | null = null
let frameId = 0
let resizeObserver: ResizeObserver | null = null
let introTimeline: gsap.core.Timeline | null = null
let rotationTimeline: gsap.core.Timeline | null = null
let replayExitTimeline: gsap.core.Timeline | null = null
let animationActive = false
let controlsRevealEmitted = false
let backgroundPreloadCancelled = false
let pageLoadHandler: (() => void) | null = null
const disposableGeometries: THREE.BufferGeometry[] = []
const disposableMaterials: THREE.Material[] = []
const disposableTextures: THREE.Texture[] = []
const texturePromises = new Map<string, Promise<THREE.Texture>>()
const textureCache = new Map<string, THREE.Texture>()
const sliceImageStates: SliceImageState[] = []
const sliceBladePivots: THREE.Group[] = []
const slicePivots: THREE.Group[] = []
const sliceLoadingSprites: THREE.Sprite[] = []
const sliceLoadingMaterials: THREE.SpriteMaterial[] = []
const sliceTransitionTimelines: Array<gsap.core.Timeline | null> = []
const sliceImageUrls: string[] = []
const sliceLoadingTokens: number[] = []

function pointOnOrbit(angleDegrees: number, radius = orbitRadius) {
  const radians = (angleDegrees - 90) * (Math.PI / 180)

  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians)
  }
}

function describeOrbitArc(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${orbitRadius} ${orbitRadius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
  ].join(' ')
}

function describeOrbitGradient(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)

  return {
    x1: start.x.toFixed(3),
    y1: start.y.toFixed(3),
    x2: end.x.toFixed(3),
    y2: end.y.toFixed(3)
  }
}

function describeArrowHead(angleDegrees: number) {
  const tip = pointOnOrbit(angleDegrees)
  const angle = angleDegrees * (Math.PI / 180)
  const tangent = { x: Math.cos(angle), y: Math.sin(angle) }
  const normal = { x: -tangent.y, y: tangent.x }
  const length = 0.78
  const halfWidth = 0.34
  const base = {
    x: tip.x - tangent.x * length,
    y: tip.y - tangent.y * length
  }

  return [
    `${tip.x.toFixed(3)},${tip.y.toFixed(3)}`,
    `${(base.x + normal.x * halfWidth).toFixed(3)},${(base.y + normal.y * halfWidth).toFixed(3)}`,
    `${(base.x - normal.x * halfWidth).toFixed(3)},${(base.y - normal.y * halfWidth).toFixed(3)}`
  ].join(' ')
}

function createTriangleGeometry() {
  const innerOffset = 0

  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([
    innerOffset, 0, 0,
    triangleOuterRadius, 0, 0,
    triangleOuterRadius, triangleBaseHeight, 0
  ])
  const uvs = new Float32Array([
    0.1, 0.5,
    0.92, 0.28,
    0.92, 0.92
  ])

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.setIndex([0, 1, 2])
  geometry.computeVertexNormals()

  return geometry
}

function render(time = 0) {
  if (!renderer || !scene || !camera) return

  sliceLoadingMaterials.forEach((material) => {
    material.rotation = -(time * 0.0024)
  })
  renderer.render(scene, camera)
  frameId = window.requestAnimationFrame(render)
}

function prepareTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  disposableTextures.push(texture)

  return texture
}

function loadTexture(url: string) {
  const cachedTexture = textureCache.get(url)
  if (cachedTexture) return Promise.resolve(cachedTexture)

  const pendingTexture = texturePromises.get(url)
  if (pendingTexture) return pendingTexture
  if (!textureLoader) return Promise.reject(new Error('Texture loader is not ready.'))

  const texturePromise = textureLoader.loadAsync(url)
    .then((texture) => {
      const preparedTexture = prepareTexture(texture)
      textureCache.set(url, preparedTexture)
      return preparedTexture
    })
    .catch((error) => {
      texturePromises.delete(url)
      throw error
    })

  texturePromises.set(url, texturePromise)
  return texturePromise
}

function createLoadingIconTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')

  if (context) {
    context.fillStyle = 'rgba(49, 35, 23, 0.76)'
    context.beginPath()
    context.arc(48, 48, 34, 0, Math.PI * 2)
    context.fill()

    context.strokeStyle = 'rgba(238, 220, 184, 0.34)'
    context.lineWidth = 7
    context.beginPath()
    context.arc(48, 48, 23, 0, Math.PI * 2)
    context.stroke()

    context.strokeStyle = 'rgba(238, 220, 184, 0.96)'
    context.lineCap = 'round'
    context.beginPath()
    context.arc(48, 48, 23, -Math.PI / 2, Math.PI * 0.42)
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  disposableTextures.push(texture)

  return texture
}

function shuffled<T>(items: T[]) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function setLoadingSpriteVisible(index: number, isVisible: boolean, token: number) {
  const loadingSprite = sliceLoadingSprites[index]
  const loadingMaterial = sliceLoadingMaterials[index]
  if (!loadingSprite || !loadingMaterial) return

  gsap.killTweensOf(loadingMaterial)
  gsap.killTweensOf(loadingSprite.scale)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loadingMaterial.opacity = isVisible ? 1 : 0
    loadingSprite.visible = isVisible
    return
  }

  if (isVisible) {
    loadingSprite.visible = true
    loadingMaterial.opacity = 0
    loadingSprite.scale.setScalar(0.12)
    gsap.to(loadingMaterial, { opacity: 1, duration: 0.22, ease: 'power2.out' })
    gsap.to(loadingSprite.scale, { x: 0.16, y: 0.16, z: 0.16, duration: 0.28, ease: 'back.out(1.8)' })
    return
  }

  gsap.to(loadingMaterial, {
    opacity: 0,
    duration: 0.18,
    ease: 'power2.in',
    onComplete: () => {
      if (sliceLoadingTokens[index] === token) loadingSprite.visible = false
    }
  })
  gsap.to(loadingSprite.scale, { x: 0.12, y: 0.12, z: 0.12, duration: 0.18, ease: 'power2.in' })
}

function settleSliceImageLayers(index: number) {
  const state = sliceImageStates[index]
  if (!state) return

  state.layers.forEach((layer, layerIndex) => {
    const isActive = layerIndex === state.activeIndex
    layer.group.scale.setScalar(1)
    layer.material.opacity = isActive ? 1 : 0
    layer.mesh.visible = isActive
  })
}

function animateTextureSwap(
  index: number,
  texture: THREE.Texture,
  url: string,
  token: number,
  shouldAnimate = true
) {
  const state = sliceImageStates[index]
  if (!state || sliceLoadingTokens[index] !== token) return

  sliceTransitionTimelines[index]?.kill()
  settleSliceImageLayers(index)
  setLoadingSpriteVisible(index, false, token)

  const outgoingIndex = state.activeIndex
  const incomingIndex = outgoingIndex === 0 ? 1 : 0
  const outgoing = state.layers[outgoingIndex]
  const incoming = state.layers[incomingIndex]

  incoming.material.map = texture
  incoming.material.needsUpdate = true
  incoming.material.opacity = shouldAnimate ? 0 : 1
  incoming.group.scale.setScalar(shouldAnimate ? 0.91 : 1)
  incoming.mesh.visible = true
  incoming.mesh.renderOrder = 40 + index * 2 + 1
  outgoing.mesh.renderOrder = 40 + index * 2
  state.activeIndex = incomingIndex
  sliceImageUrls[index] = url

  if (!shouldAnimate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    outgoing.material.opacity = 0
    outgoing.mesh.visible = false
    outgoing.group.scale.setScalar(1)
    return
  }

  const timeline = gsap.timeline({
    onComplete: () => {
      outgoing.material.opacity = 0
      outgoing.mesh.visible = false
      outgoing.group.scale.setScalar(1)
      settleSliceImageLayers(index)
      if (sliceTransitionTimelines[index] === timeline) sliceTransitionTimelines[index] = null
    },
    onInterrupt: () => settleSliceImageLayers(index)
  })

  timeline
    .to(outgoing.group.scale, {
      x: 1.08,
      y: 1.08,
      z: 1.08,
      duration: imageSwapConfig.outgoingDuration,
      ease: 'power2.in'
    }, 0)
    .to(outgoing.material, {
      opacity: 0,
      duration: imageSwapConfig.outgoingDuration,
      ease: 'power2.inOut'
    }, 0)
    .to(incoming.group.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: imageSwapConfig.duration - imageSwapConfig.incomingStart,
      ease: 'power3.out'
    }, imageSwapConfig.incomingStart)
    .to(incoming.material, {
      opacity: 1,
      duration: imageSwapConfig.duration - imageSwapConfig.incomingStart,
      ease: 'power2.inOut'
    }, imageSwapConfig.incomingStart)

  sliceTransitionTimelines[index] = timeline
}

async function assignSliceTexture(
  index: number,
  url: string,
  options: TextureAssignmentOptions = {}
) {
  const state = sliceImageStates[index]
  const loadingSprite = sliceLoadingSprites[index]
  if (!state || !loadingSprite) return

  const shouldAnimate = options.animate ?? true
  const shouldShowLoader = options.showLoader ?? true
  const token = (sliceLoadingTokens[index] ?? 0) + 1
  sliceLoadingTokens[index] = token
  sliceTransitionTimelines[index]?.kill()
  sliceTransitionTimelines[index] = null
  settleSliceImageLayers(index)

  const cachedTexture = textureCache.get(url)
  if (cachedTexture) {
    animateTextureSwap(index, cachedTexture, url, token, shouldAnimate)
    return
  }

  // The previous map remains visible beneath this indicator until its replacement is ready.
  if (shouldShowLoader) setLoadingSpriteVisible(index, true, token)

  try {
    const texture = await loadTexture(url)
    if (sliceLoadingTokens[index] !== token) return

    animateTextureSwap(index, texture, url, token, shouldAnimate)
  } catch (error) {
    console.warn(`Could not load kaleidoscope image: ${url}`, error)
    if (shouldShowLoader && sliceLoadingTokens[index] === token) {
      setLoadingSpriteVisible(index, false, token)
    }
  }
}

function randomizeSliceTextures(options: TextureAssignmentOptions = {}) {
  const completePool = [...new Set((props.imagePool?.length ? props.imagePool : props.images).filter(Boolean))]
  const pool = options.cachedOnly
    ? completePool.filter((url) => textureCache.has(url))
    : completePool
  if (!pool.length) return Promise.resolve()

  const candidates = shuffled(pool)
  const chosen = new Set<string>()
  const assignments: Array<Promise<void>> = []

  sliceImageStates.forEach((_, index) => {
    const currentUrl = sliceImageUrls[index]
    const nextUrl = candidates.find((url) => url !== currentUrl && !chosen.has(url))
      ?? candidates.find((url) => url !== currentUrl)
      ?? candidates[0]

    if (!nextUrl) return
    chosen.add(nextUrl)
    assignments.push(assignSliceTexture(index, nextUrl, options))
  })

  return Promise.all(assignments).then(() => undefined)
}

function waitForBrowserIdle() {
  return new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 1800 })
      return
    }

    window.setTimeout(resolve, 180)
  })
}

async function preloadTexturePool() {
  const pool = [...new Set((props.imagePool ?? []).filter(Boolean))]

  for (const url of pool) {
    if (backgroundPreloadCancelled) return
    if (textureCache.has(url)) continue

    await waitForBrowserIdle()
    if (backgroundPreloadCancelled) return

    try {
      await loadTexture(url)
    } catch (error) {
      console.warn(`Could not preload kaleidoscope image: ${url}`, error)
    }
  }
}

function scheduleBackgroundPreload() {
  const startPreload = () => {
    pageLoadHandler = null
    void preloadTexturePool()
  }

  if (document.readyState === 'complete') {
    window.setTimeout(startPreload, 0)
    return
  }

  pageLoadHandler = startPreload
  window.addEventListener('load', startPreload, { once: true })
}

function setAnimationActive(isActive: boolean) {
  if (animationActive === isActive) return

  animationActive = isActive
  emit('animationStateChange', isActive)
}

function getArrowElements() {
  if (!containerRef.value) return []

  return gsap.utils.toArray<SVGGElement>(
    containerRef.value.querySelectorAll('.hero-kaleidoscope__arrow')
  )
}

function setArrowRotation(arrow: SVGGElement, index: number, rotation: number) {
  arrowRotationValues[index] = rotation
  arrow.setAttribute('transform', `rotate(${rotation} 50 50)`)
}

function resetArrowRotations() {
  getArrowElements().forEach((arrow, index) => {
    setArrowRotation(arrow, index, orbitSegments[index]?.rotation ?? index * 30)
  })
}

function rotateBy(direction: number) {
  if (!slicePivots.length || animationActive) return

  void randomizeSliceTextures()
  const normalizedDirection = direction < 0 ? -1 : 1
  const isClockwise = normalizedDirection < 0
  const staggerDirection: StaggerDirection = normalizedDirection > 0 ? 'ccw' : 'cw'
  const arrowStaggerDirection: StaggerDirection = isClockwise ? 'cw' : 'ccw'
  const arrows = getArrowElements()
  const arrowSequenceStart = isClockwise
    ? (rotationConfig.clockwiseArrowsStartAtTriangle - 1) * rotationConfig.triangleStagger
    : 0
  const triangleSequenceStart = isClockwise
    ? 0
    : (rotationConfig.counterclockwiseTrianglesStartAtArrow - 1) * rotationConfig.arrowStagger
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    slicePivots.forEach((pivot) => {
      pivot.rotation.z += normalizedDirection * sliceAngle
    })
    arrows.forEach((arrow, index) => {
      const delta = isClockwise ? 30 : -30
      setArrowRotation(arrow, index, arrowRotationValues[index]! + delta)
    })
    return
  }

  const timeline = gsap.timeline({
    onComplete: () => {
      rotationTimeline = null
      setAnimationActive(false)
    },
    onInterrupt: () => {
      rotationTimeline = null
      setAnimationActive(false)
    }
  })

  arrows.forEach((arrow, index) => {
    const staggerRank = getStaggerRank(index, arrows.length, arrowStaggerDirection, 'cw')
    const rotationState = { value: arrowRotationValues[index] ?? index * 30 }
    const targetRotation = rotationState.value + (isClockwise ? 30 : -30)
    const start = arrowSequenceStart + staggerRank * rotationConfig.arrowStagger

    timeline.to(rotationState, {
      value: targetRotation,
      duration: rotationConfig.arrowDuration,
      ease: 'power2.inOut',
      onUpdate: () => setArrowRotation(arrow, index, rotationState.value)
    }, start)
  })

  slicePivots.forEach((pivot, index) => {
    const staggerRank = getStaggerRank(index, slicePivots.length, staggerDirection, 'ccw')
    const targetRotation = pivot.rotation.z + normalizedDirection * sliceAngle
    const settle = gsap.timeline()
    const blade = gsap.timeline()
    const bladePivot = sliceBladePivots[index]

    rotationConfig.settleOffsets.forEach((offset, settleIndex) => {
      settle.to(pivot.rotation, {
        z: targetRotation + normalizedDirection * sliceAngle * offset,
        duration: rotationConfig.settleDurations[settleIndex],
        ease: settleIndex === 0 ? 'power2.inOut' : 'sine.inOut'
      })
    })

    if (bladePivot) {
      blade
        .to(bladePivot.rotation, {
          x: normalizedDirection * rotationConfig.bladeTilt,
          duration: 0.34,
          ease: 'power2.inOut'
        })
        .to(bladePivot.rotation, {
          x: normalizedDirection * rotationConfig.bladeCounterTilt,
          duration: 0.39,
          ease: 'sine.inOut'
        })
        .to(bladePivot.rotation, {
          x: 0,
          duration: 0.38,
          ease: 'sine.out'
        })
    }

    const start = triangleSequenceStart + staggerRank * rotationConfig.triangleStagger
    timeline.add(settle, start)
    timeline.add(blade, start)
  })

  rotationTimeline = timeline
  setAnimationActive(true)
}

function createReplayExitTimeline() {
  if (!containerRef.value) return

  const arrows = getArrowElements()
  const arrowLines = arrows.map((arrow) => arrow.querySelector<SVGUseElement>('.hero-kaleidoscope__arrow-line'))
  const arrowHeads = arrows.map((arrow) => arrow.querySelector<SVGUseElement>('.hero-kaleidoscope__arrow-head'))
  const arrowPath = containerRef.value.querySelector<SVGPathElement>('#hero-orbit-arrow-line')
  const pathLength = arrowPath?.getTotalLength() ?? 24
  const triangleDuration = introConfig.triangleDuration / replayConfig.exitTimeScale
  const arrowDuration = introConfig.arrowDuration / replayConfig.exitTimeScale
  const timeline = gsap.timeline({
    onComplete: () => {
      if (replayExitTimeline !== timeline) return
      replayExitTimeline = null
      void restartIntroWithNewImages()
    },
    onInterrupt: () => {
      if (replayExitTimeline === timeline) {
        replayExitTimeline = null
        setAnimationActive(false)
      }
    }
  })

  sliceImageStates.forEach((state, index) => {
    sliceTransitionTimelines[index]?.kill()
    settleSliceImageLayers(index)

    const entranceRank = getStaggerRank(
      index,
      sliceImageStates.length,
      introConfig.triangleStaggerDirection,
      'ccw'
    )
    const exitRank = sliceImageStates.length - 1 - entranceRank
    const start = exitRank * (introConfig.triangleStagger / replayConfig.exitTimeScale)
    const bladePivot = sliceBladePivots[index]
    if (!bladePivot) return
    const activeMaterial = state.layers[state.activeIndex].material
    const fadeStart = start + Math.max(0, triangleDuration - replayConfig.triangleFadeDuration)

    timeline.to(
      bladePivot.rotation,
      { x: Math.PI / 2, duration: triangleDuration, ease: 'power1.inOut' },
      start
    )
    timeline.to(
      activeMaterial,
      { opacity: 0, duration: replayConfig.triangleFadeDuration, ease: 'power2.in' },
      fadeStart
    )
  })

  arrows.forEach((arrow, index) => {
    const entranceRank = getStaggerRank(
      index,
      arrows.length,
      introConfig.arrowStaggerDirection,
      'cw'
    )
    const exitRank = arrows.length - 1 - entranceRank
    const start = exitRank * (introConfig.arrowStagger / replayConfig.exitTimeScale)

    timeline.to(arrowHeads[index], { opacity: 0, duration: arrowDuration * 0.22, ease: 'power2.in' }, start)
    timeline.to(arrowLines[index], {
      strokeDashoffset: pathLength,
      duration: arrowDuration,
      ease: 'power2.inOut'
    }, start)
    timeline.to(arrow, { opacity: 0, duration: arrowDuration * 0.58, ease: 'power2.in' }, start + arrowDuration * 0.3)
  })

  replayExitTimeline = timeline
}

async function restartIntroWithNewImages() {
  slicePivots.forEach((pivot, index) => {
    pivot.rotation.z = index * sliceAngle
  })
  resetArrowRotations()
  sliceBladePivots.forEach((bladePivot) => {
    bladePivot.rotation.x = Math.PI / 2
  })

  await randomizeSliceTextures({ animate: false, cachedOnly: true, showLoader: false })
  sliceImageStates.forEach((_, index) => settleSliceImageLayers(index))
  createIntroTimeline(0)
}

function replayIntro() {
  if (!slicePivots.length || animationActive) return

  rotationTimeline?.kill()
  rotationTimeline = null
  setAnimationActive(true)

  if (!introTimeline || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void restartIntroWithNewImages()
    return
  }

  const completedIntroTimeline = introTimeline
  introTimeline = null
  completedIntroTimeline.kill()
  createReplayExitTimeline()
}

defineExpose({
  rotateBy,
  replayIntro
})

function applyRadialSliceOffset(renderedSize: number) {
  const outwardOffset = (radialOffsetPixels / Math.max(renderedSize, 1)) * kaleidoscopeViewSize

  sliceBladePivots.forEach((bladePivot) => {
    bladePivot.position.x = outwardOffset
    bladePivot.position.y = 0
  })
}

function getStaggerRank(
  index: number,
  count: number,
  direction: StaggerDirection,
  positiveIndexDirection: StaggerDirection
) {
  if (direction === positiveIndexDirection || index === 0) return index

  return count - index
}

function getRitardandoOffset(rank: number, baseStagger: number, ritardando: number) {
  return rank * baseStagger + ((rank * (rank - 1)) / 2) * ritardando
}

function createIntroTimeline(delay = 0.15) {
  if (!containerRef.value) return

  const arrows = gsap.utils.toArray<SVGGElement>(
    containerRef.value.querySelectorAll('.hero-kaleidoscope__arrow')
  )
  const arrowLines = arrows.map((arrow) => arrow.querySelector<SVGUseElement>('.hero-kaleidoscope__arrow-line'))
  const arrowHeads = arrows.map((arrow) => arrow.querySelector<SVGUseElement>('.hero-kaleidoscope__arrow-head'))
  const arrowPath = containerRef.value.querySelector<SVGPathElement>('#hero-orbit-arrow-line')
  const pathLength = arrowPath?.getTotalLength() ?? 24
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  gsap.set(arrows, { opacity: 0 })
  gsap.set(arrowLines, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
  gsap.set(arrowHeads, { opacity: 0 })

  if (reduceMotion) {
    gsap.set(arrows, { opacity: 1 })
    gsap.set(arrowLines, { strokeDashoffset: 0 })
    gsap.set(arrowHeads, { opacity: 1 })
    sliceBladePivots.forEach((bladePivot) => {
      bladePivot.rotation.x = 0
    })
    setAnimationActive(false)
    if (!controlsRevealEmitted) {
      controlsRevealEmitted = true
      emit('controlsReveal')
    }
    return
  }

  const timeline = gsap.timeline({
    delay,
    onComplete: () => {
      if (introTimeline === timeline) setAnimationActive(false)
    },
    onInterrupt: () => {
      if (introTimeline === timeline) {
        introTimeline = null
        setAnimationActive(false)
      }
    }
  })
  const overlap = introConfig.sequenceOverlap
  const arrowSequenceStart = overlap < 0
    ? getRitardandoOffset(
        Math.min(sliceBladePivots.length, Math.max(1, Math.abs(overlap))) - 1,
        introConfig.triangleStagger,
        introConfig.triangleStaggerRitardando
      )
    : 0
  const triangleSequenceStart = overlap > 0
    ? getRitardandoOffset(
        Math.min(arrows.length, Math.max(1, overlap)) - 1,
        introConfig.arrowStagger,
        introConfig.arrowStaggerRitardando
      )
    : 0

  arrows.forEach((arrow, index) => {
    const staggerRank = getStaggerRank(index, arrows.length, introConfig.arrowStaggerDirection, 'cw')
    const start = arrowSequenceStart + getRitardandoOffset(
      staggerRank,
      introConfig.arrowStagger,
      introConfig.arrowStaggerRitardando
    )

    timeline.to(arrow, { opacity: 1, duration: introConfig.arrowDuration * 0.65, ease: 'power2.out' }, start)
    timeline.to(
      arrowLines[index],
      { strokeDashoffset: 0, duration: introConfig.arrowDuration, ease: 'power2.inOut' },
      start
    )
    timeline.to(
      arrowHeads[index],
      { opacity: 1, duration: introConfig.arrowDuration * 0.24, ease: 'power2.out' },
      start + introConfig.arrowDuration * 0.72
    )
  })

  sliceBladePivots.forEach((bladePivot, index) => {
    const staggerRank = getStaggerRank(
      index,
      sliceBladePivots.length,
      introConfig.triangleStaggerDirection,
      'ccw'
    )
    const start = triangleSequenceStart + getRitardandoOffset(
      staggerRank,
      introConfig.triangleStagger,
      introConfig.triangleStaggerRitardando
    )
    const duration = introConfig.triangleDuration + staggerRank * introConfig.triangleDurationRitardando

    timeline.to(
      bladePivot.rotation,
      { x: 0, duration, ease: 'elastic.out(1, 0.32)' },
      start
    )
  })

  if (!controlsRevealEmitted) {
    controlsRevealEmitted = true
    timeline.call(
      () => emit('controlsReveal'),
      [],
      Math.max(0, timeline.duration() - 1.05)
    )
  }

  introTimeline = timeline
  setAnimationActive(true)
}

function resize() {
  if (!containerRef.value || !renderer || !camera) return

  const { width, height } = containerRef.value.getBoundingClientRect()
  const size = Math.max(1, Math.min(width, height))
  const aspect = width / Math.max(height, 1)

  camera.aspect = aspect
  camera.updateProjectionMatrix()
  renderer.setSize(width || size, height || size, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  applyRadialSliceOffset(size)
  renderer.render(scene!, camera)
}

onMounted(async () => {
  if (!containerRef.value || !canvasRef.value) return

  setAnimationActive(true)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(cameraFov, 1, 0.1, 10)
  camera.position.z = cameraDistance

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  textureLoader = new THREE.TextureLoader()
  const sourceImages = props.images.length ? props.images : ['/images/landing/parkschloessl.jpg']
  const textures = await Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const url = sourceImages[index % sourceImages.length]
      return loadTexture(url)
    })
  )

  const loadingIconTexture = createLoadingIconTexture()
  const wheel = new THREE.Group()

  textures.forEach((texture, index) => {
    const geometry = createTriangleGeometry()
    const layerMaterials = [0, 1].map((layerIndex) => new THREE.MeshBasicMaterial({
      depthWrite: false,
      map: texture,
      opacity: layerIndex === 0 ? 1 : 0,
      side: THREE.DoubleSide,
      transparent: true
    }))
    const layerGroups = [new THREE.Group(), new THREE.Group()]
    const meshes = layerMaterials.map((material, layerIndex) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(-triangleCentroidX, -triangleCentroidY, 0)
      mesh.renderOrder = 40 + index * 2 + layerIndex
      mesh.visible = layerIndex === 0
      layerGroups[layerIndex]?.position.set(triangleCentroidX, triangleCentroidY, 0)
      layerGroups[layerIndex]?.add(mesh)
      return mesh
    })
    const loadingMaterial = new THREE.SpriteMaterial({
      map: loadingIconTexture,
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      opacity: 0,
      transparent: true
    })
    const loadingSprite = new THREE.Sprite(loadingMaterial)
    const counterPivot = new THREE.Group()
    const bladePivot = new THREE.Group()
    const pivot = new THREE.Group()

    pivot.rotation.z = index * sliceAngle
    bladePivot.rotation.z = triangleMedianAngle
    bladePivot.rotation.x = Math.PI / 2
    counterPivot.rotation.z = -triangleMedianAngle
    loadingSprite.position.set(triangleCentroidX, triangleCentroidY, 0.04)
    loadingSprite.scale.setScalar(0.16)
    loadingSprite.renderOrder = 100 + index
    loadingSprite.visible = false
    counterPivot.add(layerGroups[0])
    counterPivot.add(layerGroups[1])
    counterPivot.add(loadingSprite)
    bladePivot.add(counterPivot)
    pivot.add(bladePivot)

    disposableGeometries.push(geometry)
    disposableMaterials.push(...layerMaterials)
    disposableMaterials.push(loadingMaterial)
    sliceImageStates.push({
      activeIndex: 0,
      layers: [
        { group: layerGroups[0]!, material: layerMaterials[0]!, mesh: meshes[0]! },
        { group: layerGroups[1]!, material: layerMaterials[1]!, mesh: meshes[1]! }
      ]
    })
    sliceLoadingSprites.push(loadingSprite)
    sliceLoadingMaterials.push(loadingMaterial)
    sliceTransitionTimelines.push(null)
    sliceImageUrls.push(sourceImages[index % sourceImages.length])
    sliceLoadingTokens.push(0)
    sliceBladePivots.push(bladePivot)
    slicePivots.push(pivot)
    wheel.add(pivot)
  })

  scene.add(wheel)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(containerRef.value)
  resize()
  render()
  createIntroTimeline()
  scheduleBackgroundPreload()
})

onBeforeUnmount(() => {
  if (frameId) window.cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  introTimeline?.kill()
  rotationTimeline?.kill()
  replayExitTimeline?.kill()
  sliceTransitionTimelines.forEach((timeline) => timeline?.kill())
  backgroundPreloadCancelled = true
  if (pageLoadHandler) window.removeEventListener('load', pageLoadHandler)

  disposableGeometries.forEach((geometry) => geometry.dispose())
  disposableMaterials.forEach((material) => material.dispose())
  disposableTextures.forEach((texture) => texture.dispose())
  texturePromises.clear()
  textureCache.clear()
  sliceImageStates.length = 0
  sliceLoadingSprites.length = 0
  sliceLoadingMaterials.length = 0
  sliceTransitionTimelines.length = 0
  sliceImageUrls.length = 0
  sliceLoadingTokens.length = 0
  sliceBladePivots.length = 0
  slicePivots.length = 0
  renderer?.dispose()

  renderer = null
  scene = null
  camera = null
  textureLoader = null
  introTimeline = null
  rotationTimeline = null
  replayExitTimeline = null
})
</script>

<template>
  <div ref="containerRef" class="hero-kaleidoscope" aria-label="Rotating archive image wheel">
    <canvas ref="canvasRef" class="hero-kaleidoscope__canvas" aria-hidden="true" />
    <svg class="hero-kaleidoscope__orbit" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient
          id="hero-orbit-gradient"
          gradientUnits="userSpaceOnUse"
          :x1.attr="orbitArrowGradient.x1"
          :y1.attr="orbitArrowGradient.y1"
          :x2.attr="orbitArrowGradient.x2"
          :y2.attr="orbitArrowGradient.y2"
        >
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.08" />
          <stop offset="56%" stop-color="currentColor" stop-opacity="0.5" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0.94" />
        </linearGradient>
        <path id="hero-orbit-arrow-line" :d="orbitArrowPath" />
        <polygon id="hero-orbit-arrow-head" :points.attr="orbitArrowHead" />
      </defs>
      <g
        v-for="segment in orbitSegments"
        :key="segment.id"
        class="hero-kaleidoscope__arrow"
        :transform.attr="`rotate(${segment.rotation} 50 50)`"
      >
        <use class="hero-kaleidoscope__arrow-line" href="#hero-orbit-arrow-line" />
        <use class="hero-kaleidoscope__arrow-head" href="#hero-orbit-arrow-head" />
      </g>
    </svg>
  </div>
</template>
