import * as THREE from 'three'
import { createTextureCache } from '~/utils/textureCache'

// The twelve displayed slices plus one rotation's worth of replacements.
const TEXTURE_CAPACITY = 24

export type ProgressHandler = (fraction: number) => void

let textureLoader: THREE.TextureLoader | null = null
let fallbackTexture: THREE.Texture | null = null
// The hero downloads its images strictly one at a time, so a single slot is
// enough to route byte progress from the active request back to the caller.
let activeProgress: ProgressHandler | null = null

function prepareTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  return texture
}

/**
 * Downloads one image with XMLHttpRequest so its byte progress is observable.
 * THREE.TextureLoader reports no per-file progress, so the bytes are fetched
 * here and handed on as a blob URL, which the loader then resolves instantly.
 */
function downloadImage(url: string) {
  return new Promise<Blob>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open('GET', url, true)
    request.responseType = 'blob'
    request.onprogress = (event) => {
      if (event.lengthComputable) activeProgress?.(event.loaded / event.total)
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        activeProgress?.(1)
        resolve(request.response as Blob)
        return
      }

      reject(new Error(`Request for ${url} failed with status ${request.status}.`))
    }
    request.onerror = () => reject(new Error(`Request for ${url} failed.`))
    request.onabort = () => reject(new Error(`Request for ${url} was aborted.`))
    request.send()
  })
}

async function loadTextureFromNetwork(url: string) {
  const blob = await downloadImage(url)
  const blobUrl = URL.createObjectURL(blob)

  textureLoader ??= new THREE.TextureLoader()

  try {
    // The image is fully decoded once this resolves, so the blob URL can go.
    return prepareTexture(await textureLoader.loadAsync(blobUrl))
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

const cache = createTextureCache<THREE.Texture>({
  capacity: TEXTURE_CAPACITY,
  load: loadTextureFromNetwork,
  dispose: (texture) => texture.dispose()
})

/**
 * Resolves a prepared texture, reusing the module-scoped cache so images
 * survive hero unmount and remounts across client-side navigation.
 *
 * `onProgress` receives the download fraction of this one image. A cached
 * image reports 1 immediately, because nothing is transferred.
 */
export function loadTexture(url: string, onProgress?: ProgressHandler) {
  if (cache.has(url)) {
    onProgress?.(1)
    return cache.get(url)
  }

  activeProgress = onProgress ?? null

  return cache.get(url).finally(() => {
    activeProgress = null
  })
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
