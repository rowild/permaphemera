import { describe, expect, it } from 'vitest'
import { describeArrowHead, describeOrbitArc, describeOrbitGradient, orbitRadius, orbitSegments, pointOnOrbit } from '~/utils/orbitGeometry'

// The orbit around the hero wheel: twelve segments, 0° at the top.
describe('orbitGeometry', () => {
  it('has the hero radius and twelve segments 30° apart', () => {
    expect(orbitRadius).toBe(52)
    expect(orbitSegments).toHaveLength(12)
    expect(orbitSegments.every(({ id, rotation }) => rotation === id * 30)).toBe(true)
  })

  it('puts 0° at the top and 90° at the right, and honours a custom radius', () => {
    expect(pointOnOrbit(0).x).toBeCloseTo(50)
    expect(pointOnOrbit(0).y).toBeCloseTo(-2)
    expect(pointOnOrbit(90).x).toBeCloseTo(102)
    expect(pointOnOrbit(90).y).toBeCloseTo(50)
    expect(pointOnOrbit(0, 10).y).toBeCloseTo(40)
  })

  it('draws one short arc, a three-point arrow head and a gradient with both ends', () => {
    expect(describeOrbitArc(2, 28)).toMatch(/^M -?[\d.]+ -?[\d.]+ A 52 52 0 0 1 -?[\d.]+ -?[\d.]+$/)
    expect(describeArrowHead(28).split(' ')).toHaveLength(3)
    const gradient = describeOrbitGradient(2, 28) as Record<string, unknown>
    expect(['x1', 'y1', 'x2', 'y2'].every((key) => typeof gradient[key] === 'string')).toBe(true)
  })
})
