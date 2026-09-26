export function resolveDrawer({ nodeId, node, hydrated }) {
  if (!nodeId) return { status: 'closed' }
  if (!hydrated) return { status: 'pending' }
  if (!node) return { status: 'missing' }
  if (!node.accessible) return { status: 'inaccessible' }
  return {
    status: 'open',
    readOnly: Boolean(node.readOnly),
    canDelete: !node.system && !node.readOnly,
  }
}
