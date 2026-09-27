export const CARD_WIDTH = 240
export const BRANCH_WIDTH = 140
export const GAP_X = 64
export const GAP_Y = 140

export function nodeWidth(node) {
  return node.type === 'branch' ? BRANCH_WIDTH : CARD_WIDTH
}

function subtreeWidth(id, index, memo) {
  if (memo.has(id)) return memo.get(id)
  const children = index.childIdsByParentId[id] || []
  const own = nodeWidth(index.nodesById[id])
  if (!children.length) {
    memo.set(id, own)
    return own
  }
  const total = children.reduce((sum, childId, childIndex) => {
    return sum + subtreeWidth(childId, index, memo) + (childIndex > 0 ? GAP_X : 0)
  }, 0)
  const width = Math.max(own, total)
  memo.set(id, width)
  return width
}

function layoutNode(id, left, y, index, positions, memo) {
  const node = index.nodesById[id]
  const sub = subtreeWidth(id, index, memo)
  const own = nodeWidth(node)
  positions[id] = { x: Math.round(left + (sub - own) / 2), y }
  const children = index.childIdsByParentId[id] || []
  if (!children.length) return
  const childrenTotal = children.reduce((sum, childId, childIndex) => {
    return sum + subtreeWidth(childId, index, memo) + (childIndex > 0 ? GAP_X : 0)
  }, 0)
  let cursor = left + (sub - childrenTotal) / 2
  for (const childId of children) {
    const childSub = subtreeWidth(childId, index, memo)
    layoutNode(childId, cursor, y + GAP_Y, index, positions, memo)
    cursor += childSub + GAP_X
  }
}

function layoutTree(index) {
  const positions = {}
  const memo = new Map()
  let left = 0
  for (const rootId of index.rootIds) {
    const width = subtreeWidth(rootId, index, memo)
    layoutNode(rootId, left, 0, index, positions, memo)
    left += width + GAP_X
  }
  return positions
}

function hasExplicitAncestor(node, index, explicitIds) {
  let parentId = node.parentId
  while (parentId) {
    if (explicitIds.has(parentId)) return true
    parentId = index.nodesById[parentId]?.parentId ?? null
  }
  return false
}

function positionUnderParent(node, parentPosition, index, existingPositions) {
  const parent = index.nodesById[node.parentId]
  const siblings = (index.childIdsByParentId[node.parentId] || []).filter((id) => !existingPositions[id])
  const indexAmong = Math.max(0, siblings.indexOf(node.id))
  const widths = siblings.map((id) => nodeWidth(index.nodesById[id]))
  const total = widths.reduce((sum, width) => sum + width, 0) + GAP_X * Math.max(0, siblings.length - 1)
  const parentCenter = parentPosition.x + nodeWidth(parent) / 2
  let cursor = parentCenter - total / 2
  for (let sibling = 0; sibling < indexAmong; sibling += 1) cursor += widths[sibling] + GAP_X
  return { x: Math.round(cursor), y: parentPosition.y + GAP_Y }
}

// The API payload has no canvas coordinates, so missing positions are derived locally.
// A node that already has a user position keeps it instead of being laid out again.
export function calculateInitialPositions(nodes, index, existingPositions = {}) {
  const proposed = layoutTree(index)
  const positions = {}
  const explicitIds = new Set(Object.keys(existingPositions))
  const queue = [...index.rootIds]
  const seen = new Set()

  while (queue.length) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    const node = index.nodesById[id]
    if (existingPositions[id]) {
      positions[id] = { x: existingPositions[id].x, y: existingPositions[id].y }
    } else if (node.parentId && positions[node.parentId] && hasExplicitAncestor(node, index, explicitIds)) {
      positions[id] = positionUnderParent(node, positions[node.parentId], index, existingPositions)
    } else {
      positions[id] = proposed[id] || { x: 0, y: 0 }
    }
    for (const childId of index.childIdsByParentId[id] || []) queue.push(childId)
  }

  for (const node of nodes) {
    if (!positions[node.id]) positions[node.id] = proposed[node.id] || { x: 0, y: 0 }
  }
  return positions
}
