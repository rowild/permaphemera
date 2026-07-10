export const VENUE_CARD_INSET = 8
export const VENUE_OUTER_FRAME_INSET = 4
export const VENUE_OUTER_CORNER_RADIUS = 12
export const VENUE_FRAME_GAP = VENUE_CARD_INSET - VENUE_OUTER_FRAME_INSET

const INNER_OFFSET_RADIUS = VENUE_OUTER_CORNER_RADIUS + VENUE_FRAME_GAP
const INNER_ARC_EXTENT = Math.sqrt(
  INNER_OFFSET_RADIUS ** 2 - VENUE_FRAME_GAP ** 2
)
const MEDIA_ARC_EXTENT = INNER_ARC_EXTENT - VENUE_FRAME_GAP

const getRadius = (width: number, height: number, radius: number) => (
  Math.min(radius, width / 2, height / 2)
)

export const createVenueMediaPath = (width: number, height: number) => {
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)
  const extent = Math.min(MEDIA_ARC_EXTENT, w / 2, h / 2)

  return [
    `M ${extent} 0`,
    `H ${w - extent}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${w} ${extent}`,
    `V ${h}`,
    'H 0',
    `V ${extent}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${extent} 0`,
    'Z'
  ].join(' ')
}

export const createVenueInnerFramePath = (width: number, height: number) => {
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)
  const inset = VENUE_CARD_INSET
  const cornerPosition = VENUE_OUTER_FRAME_INSET + INNER_ARC_EXTENT

  return [
    `M ${cornerPosition} ${inset}`,
    `H ${w - cornerPosition}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${w - inset} ${cornerPosition}`,
    `V ${h - cornerPosition}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${w - cornerPosition} ${h - inset}`,
    `H ${cornerPosition}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${inset} ${h - cornerPosition}`,
    `V ${cornerPosition}`,
    `A ${INNER_OFFSET_RADIUS} ${INNER_OFFSET_RADIUS} 0 0 0 ${cornerPosition} ${inset}`,
    'Z'
  ].join(' ')
}

export const createVenueFramePath = (
  width: number,
  height: number,
  inset: number,
  radius: number
) => {
  const x0 = inset
  const y0 = inset
  const x1 = Math.max(width - inset, x0 + 1)
  const y1 = Math.max(height - inset, y0 + 1)
  const cornerRadius = getRadius(x1 - x0, y1 - y0, radius)

  return [
    `M ${x0 + cornerRadius} ${y0}`,
    `H ${x1 - cornerRadius}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 0 ${x1} ${y0 + cornerRadius}`,
    `V ${y1 - cornerRadius}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 0 ${x1 - cornerRadius} ${y1}`,
    `H ${x0 + cornerRadius}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 0 ${x0} ${y1 - cornerRadius}`,
    `V ${y0 + cornerRadius}`,
    `A ${cornerRadius} ${cornerRadius} 0 0 0 ${x0 + cornerRadius} ${y0}`,
    'Z'
  ].join(' ')
}
