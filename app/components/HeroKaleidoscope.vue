<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
const orbitSegments = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  d: describeOrbitArc(index * 30 + 2, index * 30 + 28),
  gradientId: `hero-orbit-gradient-${index}`,
  gradient: describeOrbitGradient(index * 30 + 2, index * 30 + 28)
}))

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let wheelGroup: THREE.Group | null = null
let currentWheelRotation = 0
let targetWheelRotation = 0
let frameId = 0
let resizeObserver: ResizeObserver | null = null
const disposableGeometries: THREE.BufferGeometry[] = []
const disposableMaterials: THREE.Material[] = []
const disposableTextures: THREE.Texture[] = []
const sliceMeshes: THREE.Mesh[] = []

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
  if (wheelGroup) {
    const rotationDelta = targetWheelRotation - currentWheelRotation

    if (Math.abs(rotationDelta) > 0.0005) {
      currentWheelRotation += rotationDelta * 0.11
    } else {
      currentWheelRotation = targetWheelRotation
    }

    wheelGroup.rotation.z = currentWheelRotation
  }

  renderer.render(scene, camera)
  frameId = window.requestAnimationFrame(render)
}

function rotateBy(direction: number) {
  targetWheelRotation += direction * sliceAngle
}

defineExpose({
  rotateBy
})

function applyRadialSliceOffset(renderedSize: number) {
  const outwardOffset = (radialOffsetPixels / Math.max(renderedSize, 1)) * kaleidoscopeViewSize

  sliceMeshes.forEach((mesh, index) => {
    mesh.position.x = Math.cos(index * sliceAngle) * outwardOffset
    mesh.position.y = Math.sin(index * sliceAngle) * outwardOffset
  })
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
  wheelGroup = wheel

  textures.forEach((texture, index) => {
    const geometry = createTriangleGeometry()
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.rotation.z = index * sliceAngle
    mesh.renderOrder = index

    disposableGeometries.push(geometry)
    disposableMaterials.push(material)
    sliceMeshes.push(mesh)
    wheel.add(mesh)
  })

  scene.add(wheel)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(containerRef.value)
  resize()
  render()
})

onBeforeUnmount(() => {
  if (frameId) window.cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()

  disposableGeometries.forEach((geometry) => geometry.dispose())
  disposableMaterials.forEach((material) => material.dispose())
  disposableTextures.forEach((texture) => texture.dispose())
  sliceMeshes.length = 0
  renderer?.dispose()

  renderer = null
  scene = null
  camera = null
  wheelGroup = null
  currentWheelRotation = 0
  targetWheelRotation = 0
})
</script>

<template>
  <div ref="containerRef" class="hero-kaleidoscope" aria-label="Rotating archive image wheel">
    <canvas ref="canvasRef" class="hero-kaleidoscope__canvas" aria-hidden="true" />
    <svg class="hero-kaleidoscope__orbit" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <marker
          id="hero-orbit-arrow"
          markerWidth="4"
          markerHeight="4"
          refX="3.45"
          refY="2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 4 2 L 0 4 Z" />
        </marker>
        <linearGradient
          v-for="segment in orbitSegments"
          :id="segment.gradientId"
          :key="segment.gradientId"
          gradientUnits="userSpaceOnUse"
          :x1="segment.gradient.x1"
          :y1="segment.gradient.y1"
          :x2="segment.gradient.x2"
          :y2="segment.gradient.y2"
        >
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.08" />
          <stop offset="56%" stop-color="currentColor" stop-opacity="0.5" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0.94" />
        </linearGradient>
      </defs>
      <path
        v-for="segment in orbitSegments"
        :key="segment.id"
        :d="segment.d"
        :stroke="`url(#${segment.gradientId})`"
        marker-end="url(#hero-orbit-arrow)"
      />
    </svg>
  </div>
</template>
