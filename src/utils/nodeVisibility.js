export function isNodeVisible({ topLeft, size, zoom, bounds, margin = 16 }) {
  const screenWidth = size.width * zoom
  const screenHeight = size.height * zoom
  return topLeft.x >= bounds.left + margin
    && topLeft.y >= bounds.top + margin
    && topLeft.x + screenWidth <= bounds.right - margin
    && topLeft.y + screenHeight <= bounds.bottom - margin
}
