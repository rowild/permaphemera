<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import * as THREE from 'three'

const props = defineProps<{
  images: string[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const orbitRadius = 52
const kaleidoscopeViewSize = 2.35
const radialOffsetPixels = 10
const sliceAngle = (Math.PI * 2) / 12
const orbitStartAngle = 2
const orbitEndAngle = 28
const orbitArrowPath = describeOrbitArc(orbitStartAngle, orbitEndAngle)
const orbitArrowGradient = describeOrbitGradient(orbitStartAngle, orbitEndAngle)
const orbitArrowHead = describeArrowHead(orbitEndAngle)
const orbitSegments = Array.from({ length: 12 }, (_, index) => ({ id: index, rotation: index * 30 }))
type StaggerDirection = 'cw' | 'ccw'
const introConfig = {
  arrowDuration: 0.9,
  arrowStagger: 0.14,
  arrowStaggerRitardando: 0.008,
  arrowStaggerDirection: 'cw' as StaggerDirection,
  trianglesStartAtArrow: 12,
  triangleDuration: 2.05,
  triangleDurationRitardando: 0.075,
  triangleStagger: 0.12,
  triangleStaggerRitardando: 0.02,
  triangleStaggerDirection: 'cw' as StaggerDirection
}
const rotationConfig = {
  triangleStagger: 0.035,
  settleOffsets: [0.14, -0.1, 0.07, -0.045, 0.027, -0.014, 0.006, 0],
  settleDurations: [0.55, 0.18, 0.16, 0.14, 0.12, 0.1, 0.09, 0.08]
}

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let frameId = 0
let resizeObserver: ResizeObserver | null = null
let introTimeline: gsap.core.Timeline | null = null
let rotationTimeline: gsap.core.Timeline | null = null
const disposableGeometries: THREE.BufferGeometry[] = []
const disposableMaterials: THREE.Material[] = []
const disposableTextures: THREE.Texture[] = []
const sliceMeshes: THREE.Mesh[] = []
const slicePivots: THREE.Group[] = []

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
  const outerRadius = 0.98
  const baseHeight = Math.tan(Math.PI / 6) * outerRadius + 0.006

  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([
    innerOffset, 0, 0,
    outerRadius, 0, 0,
    outerRadius, baseHeight, 0
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

function render() {
  if (!renderer || !scene || !camera) return

  renderer.render(scene, camera)
  frameId = window.requestAnimationFrame(render)
}

function rotateBy(direction: number) {
  if (!slicePivots.length || rotationTimeline?.isActive()) return

  const normalizedDirection = direction < 0 ? -1 : 1
  const staggerDirection: StaggerDirection = normalizedDirection > 0 ? 'ccw' : 'cw'
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    slicePivots.forEach((pivot) => {
      pivot.rotation.z += normalizedDirection * sliceAngle
    })
    return
  }

  const timeline = gsap.timeline({
    onComplete: () => {
      rotationTimeline = null
    }
  })

  slicePivots.forEach((pivot, index) => {
    const staggerRank = getStaggerRank(index, slicePivots.length, staggerDirection, 'ccw')
    const targetRotation = pivot.rotation.z + normalizedDirection * sliceAngle
    const settle = gsap.timeline()

    rotationConfig.settleOffsets.forEach((offset, settleIndex) => {
      settle.to(pivot.rotation, {
        z: targetRotation + normalizedDirection * sliceAngle * offset,
        duration: rotationConfig.settleDurations[settleIndex],
        ease: settleIndex === 0 ? 'power2.inOut' : 'sine.inOut'
      })
    })

    timeline.add(settle, staggerRank * rotationConfig.triangleStagger)
  })

  rotationTimeline = timeline
}

function replayIntro() {
  if (!slicePivots.length) return

  introTimeline?.kill()
  rotationTimeline?.kill()
  rotationTimeline = null

  slicePivots.forEach((pivot, index) => {
    pivot.rotation.z = index * sliceAngle
  })
  sliceMeshes.forEach((mesh) => {
    mesh.rotation.x = Math.PI / 2
  })

  createIntroTimeline()
}

defineExpose({
  rotateBy,
  replayIntro
})

function applyRadialSliceOffset(renderedSize: number) {
  const outwardOffset = (radialOffsetPixels / Math.max(renderedSize, 1)) * kaleidoscopeViewSize

  sliceMeshes.forEach((mesh) => {
    mesh.position.x = outwardOffset
    mesh.position.y = 0
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

function createIntroTimeline() {
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
    sliceMeshes.forEach((mesh) => {
      mesh.rotation.x = 0
    })
    return
  }

  const timeline = gsap.timeline({ delay: 0.15 })

  arrows.forEach((arrow, index) => {
    const staggerRank = getStaggerRank(index, arrows.length, introConfig.arrowStaggerDirection, 'cw')
    const start = getRitardandoOffset(
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

  const triangleStart = getRitardandoOffset(
    Math.max(1, introConfig.trianglesStartAtArrow) - 1,
    introConfig.arrowStagger,
    introConfig.arrowStaggerRitardando
  )

  sliceMeshes.forEach((mesh, index) => {
    const staggerRank = getStaggerRank(
      index,
      sliceMeshes.length,
      introConfig.triangleStaggerDirection,
      'ccw'
    )
    const start = triangleStart + getRitardandoOffset(
      staggerRank,
      introConfig.triangleStagger,
      introConfig.triangleStaggerRitardando
    )
    const duration = introConfig.triangleDuration + staggerRank * introConfig.triangleDurationRitardando

    timeline.to(
      mesh.rotation,
      { x: 0, duration, ease: 'elastic.out(1, 0.32)' },
      start
    )
  })

  introTimeline = timeline
}

function resize() {
  if (!containerRef.value || !renderer || !camera) return

  const { width, height } = containerRef.value.getBoundingClientRect()
  const size = Math.max(1, Math.min(width, height))
  const aspect = width / Math.max(height, 1)

  camera.left = (-kaleidoscopeViewSize * aspect) / 2
  camera.right = (kaleidoscopeViewSize * aspect) / 2
  camera.top = kaleidoscopeViewSize / 2
  camera.bottom = -kaleidoscopeViewSize / 2
  camera.updateProjectionMatrix()
  renderer.setSize(width || size, height || size, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  applyRadialSliceOffset(size)
  renderer.render(scene!, camera)
}

onMounted(async () => {
  if (!containerRef.value || !canvasRef.value) return

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.1, 10)
  camera.position.z = 3

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  const loader = new THREE.TextureLoader()
  const sourceImages = props.images.length ? props.images : ['/images/landing/parkschloessl.jpg']
  const textures = await Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const url = sourceImages[index % sourceImages.length]
      return loader.loadAsync(url)
    })
  )

  textures.forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    disposableTextures.push(texture)
  })

  const wheel = new THREE.Group()

  textures.forEach((texture, index) => {
    const geometry = createTriangleGeometry()
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    })
    const mesh = new THREE.Mesh(geometry, material)
    const pivot = new THREE.Group()

    pivot.rotation.z = index * sliceAngle
    mesh.rotation.x = Math.PI / 2
    mesh.renderOrder = index
    pivot.add(mesh)

    disposableGeometries.push(geometry)
    disposableMaterials.push(material)
    sliceMeshes.push(mesh)
    slicePivots.push(pivot)
    wheel.add(pivot)
  })

  scene.add(wheel)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(containerRef.value)
  resize()
  render()
  createIntroTimeline()
})

onBeforeUnmount(() => {
  if (frameId) window.cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  introTimeline?.kill()
  rotationTimeline?.kill()

  disposableGeometries.forEach((geometry) => geometry.dispose())
  disposableMaterials.forEach((material) => material.dispose())
  disposableTextures.forEach((texture) => texture.dispose())
  sliceMeshes.length = 0
  slicePivots.length = 0
  renderer?.dispose()

  renderer = null
  scene = null
  camera = null
  introTimeline = null
  rotationTimeline = null
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
        <polygon id="hero-orbit-arrow-head" :points="orbitArrowHead" />
      </defs>
      <g
        v-for="segment in orbitSegments"
        :key="segment.id"
        class="hero-kaleidoscope__arrow"
        :transform="`rotate(${segment.rotation} 50 50)`"
      >
        <use class="hero-kaleidoscope__arrow-line" href="#hero-orbit-arrow-line" />
        <use class="hero-kaleidoscope__arrow-head" href="#hero-orbit-arrow-head" />
      </g>
    </svg>
  </div>
</template>
