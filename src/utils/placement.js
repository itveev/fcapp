const CASCADE = [
  [0, 0],
  [36, 24],
  [-36, 24],
  [36, -24],
  [-36, -24],
  [0, 40],
  [0, -40],
  [56, 0],
]

export function placeNearCenter(center, slot, size = { width: 220, height: 88 }) {
  const index = ((slot % CASCADE.length) + CASCADE.length) % CASCADE.length
  const [dx, dy] = CASCADE[index]
  return {
    x: Math.round(center.x - size.width / 2 + dx),
    y: Math.round(center.y - size.height / 2 + dy),
  }
}
