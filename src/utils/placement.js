// Cycle through nearby offsets so consecutively created nodes do not overlap.
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

// Place new root nodes near the current viewport without re-running the graph
// layout, which would move nodes the user has already positioned manually.
export function placeNearCenter(center, slot, size = { width: 220, height: 88 }) {
  const index = ((slot % CASCADE.length) + CASCADE.length) % CASCADE.length
  const [dx, dy] = CASCADE[index]
  return {
    x: Math.round(center.x - size.width / 2 + dx),
    y: Math.round(center.y - size.height / 2 + dy),
  }
}
