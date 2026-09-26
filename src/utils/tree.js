export function buildTreeIndex(nodes) {
  const nodesById = {}
  const childIdsByParentId = {}
  const rootIds = []

  for (const node of nodes) {
    nodesById[node.id] = node
  }

  for (const node of nodes) {
    if (!node.parentId) {
      rootIds.push(node.id)
      continue
    }
    if (!childIdsByParentId[node.parentId]) childIdsByParentId[node.parentId] = []
    childIdsByParentId[node.parentId].push(node.id)
  }

  return { nodesById, childIdsByParentId, rootIds }
}

export function getNodeChildren(index, id) {
  return (index.childIdsByParentId[id] || []).map((childId) => index.nodesById[childId])
}

export function getNodeDescendants(index, id) {
  const descendants = []
  const stack = [...(index.childIdsByParentId[id] || [])]

  while (stack.length) {
    const currentId = stack.pop()
    const current = index.nodesById[currentId]
    if (!current) continue
    descendants.push(current)
    const children = index.childIdsByParentId[currentId] || []
    for (let indexChild = children.length - 1; indexChild >= 0; indexChild -= 1) {
      stack.push(children[indexChild])
    }
  }

  return descendants
}
