import * as THREE from 'three'
import { createTextureCache } from '~/utils/textureCache'

// The twelve displayed slices plus one rotation's worth of replacements.
const TEXTURE_CAPACITY = 24

let textureLoader: THREE.TextureLoader | null = null
let fallbackTexture: THREE.Texture | null = null

function prepareTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  return texture
}

const cache = createTextureCache<THREE.Texture>({
  capacity: TEXTURE_CAPACITY,
  load: (url) => {
    textureLoader ??= new THREE.TextureLoader()
    return textureLoader.loadAsync(url).then(prepareTexture)
  },
  dispose: (texture) => texture.dispose()
})

/**
 * Resolves a prepared texture, reusing the module-scoped cache so images
 * survive hero unmount and remounts across client-side navigation.
 */
export function loadTexture(url: string) {
  return cache.get(url)
}

export function isTextureCached(url: string) {
  return cache.has(url)
}

/** A transparent stand-in so one failed image cannot stall the wheel. */
export function getFallbackTexture(): THREE.Texture {
  if (fallbackTexture) return fallbackTexture

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  fallbackTexture = new THREE.CanvasTexture(canvas)
  fallbackTexture.colorSpace = THREE.SRGBColorSpace

  return fallbackTexture
}

/** Test and teardown hook. Production code should let the cache persist. */
export function releaseTextureCache() {
  cache.clear()
  fallbackTexture?.dispose()
  fallbackTexture = null
  textureLoader = null
}
