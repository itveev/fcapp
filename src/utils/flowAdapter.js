import { truncate } from './truncate'

export const USER_NODE_TYPES = ['sendMessage', 'addComment', 'businessHours']

const METADATA = {
  trigger: { icon: 'trigger', label: 'Trigger' },
  sendMessage: { icon: 'message', label: 'Send Message' },
  addComment: { icon: 'comment', label: 'Add Comment' },
  businessHours: { icon: 'clock', label: 'Business Hours' },
  branch: { icon: 'branch', label: 'Branch' },
}

export function getNodeTypeMetadata(type) {
  return METADATA[type] || { icon: 'node', label: type || 'Node' }
}

function triggerLabel(triggerType) {
  if (triggerType === 'conversationOpened') return 'Conversation Opened'
  return triggerType || ''
}

export function getNodePreview(node) {
  const description = node.description?.trim()
  if (description) return truncate(description)
  if (node.type === 'sendMessage') {
    const text = node.data.payload?.find((item) => item.type === 'text' && item.text?.trim())
    if (text) return truncate(text.text.trim())
    const attachment = node.data.payload?.find((item) => item.type === 'attachment' && item.name)
    if (attachment) return truncate(attachment.name)
    return ''
  }
  if (node.type === 'addComment') return truncate(node.data.comment?.trim() || '')
  if (node.type === 'businessHours') return truncate(`Business Hours - ${node.data.timezone}`)
  if (node.type === 'trigger') return truncate(triggerLabel(node.data.triggerType))
  return ''
}

function canvasCapabilities(node) {
  const interactive = node.type !== 'branch'
  return {
    draggable: interactive,
    selectable: interactive,
    focusable: interactive,
    deletable: false,
  }
}

export function createFlowNodes(nodes, positions) {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type === 'branch' ? 'branchPill' : 'workflowCard',
    position: positions[node.id] ? { ...positions[node.id] } : { x: 0, y: 0 },
    data: {
      title: node.title,
      preview: getNodePreview(node),
      nodeType: node.type,
      accessible: node.accessible,
      readOnly: node.readOnly,
      ...(node.type === 'branch' ? { connectorType: node.data.connectorType } : {}),
    },
    ariaLabel: node.title,
    connectable: false,
    ...canvasCapabilities(node),
  }))
}

export function createFlowEdges(nodes) {
  return nodes
    .filter((node) => node.parentId)
    .map((node) => ({
      id: `e-${node.parentId}-${node.id}`,
      source: node.parentId,
      target: node.id,
      sourcePosition: 'bottom',
      targetPosition: 'top',
    }))
}
