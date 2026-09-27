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
