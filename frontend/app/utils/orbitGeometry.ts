export const orbitRadius = 52
export const orbitStartAngle = 2
export const orbitEndAngle = 28
export const orbitSegments = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  rotation: index * 30
}))

export function pointOnOrbit(angleDegrees: number, radius = orbitRadius) {
  const radians = (angleDegrees - 90) * (Math.PI / 180)

  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians)
  }
}

export function describeOrbitArc(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${orbitRadius} ${orbitRadius} 0 ${largeArcFlag} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
  ].join(' ')
}

export function describeOrbitGradient(startAngle: number, endAngle: number) {
  const start = pointOnOrbit(startAngle)
  const end = pointOnOrbit(endAngle)

  return {
    x1: start.x.toFixed(3),
    y1: start.y.toFixed(3),
    x2: end.x.toFixed(3),
    y2: end.y.toFixed(3)
  }
}

export function describeArrowHead(angleDegrees: number) {
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
