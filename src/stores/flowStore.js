import { defineStore } from 'pinia'
import { calculateInitialPositions } from '../utils/layout'
import { createNodeId } from '../utils/id'
import { defaultBusinessHoursTimes } from '../utils/businessHours'
import { buildTreeIndex } from '../utils/tree'
import { validateCreateInput, validateNode } from '../utils/validation'

function branchNode(id, parentId, connectorType) {
  return {
    id,
    parentId,
    type: 'branch',
    title: connectorType === 'success' ? 'Success' : 'Failure',
    description: '',
    system: true,
    accessible: false,
    readOnly: true,
    data: { connectorType },
  }
}

function initialData(input) {
  if (input.data) return structuredClone(input.data)
  if (input.type === 'sendMessage') return { payload: [{ type: 'text', text: '' }] }
  if (input.type === 'addComment') return { comment: '' }
  if (input.type === 'businessHours') {
    return { timezone: 'UTC', times: defaultBusinessHoursTimes(), connectors: [] }
  }
  return {}
}

export const useFlowStore = defineStore('flow', {
  state: () => ({
    nodesById: {},
    childIdsByParentId: {},
    rootIds: [],
    positions: {},
    hydrated: false,
  }),
  getters: {
    nodeList(state) {
      return Object.values(state.nodesById)
    },
    getNode(state) {
      return (id) => state.nodesById[id] ?? null
    },
    childrenOf(state) {
      return (id) => (state.childIdsByParentId[id] || []).map((childId) => state.nodesById[childId])
    },
  },
  actions: {
    applyGraph(nodes, positions) {
      const index = buildTreeIndex(nodes)
      this.nodesById = index.nodesById
      this.childIdsByParentId = index.childIdsByParentId
      this.rootIds = index.rootIds
      this.positions = positions
    },
    hydrate(domainNodes) {
      if (this.hydrated) return
      const index = buildTreeIndex(domainNodes)
      this.applyGraph(domainNodes, calculateInitialPositions(domainNodes, index, {}))
      this.hydrated = true
    },
    createNode(input, position) {
      const errors = validateCreateInput(input)
      const parentId = input?.parentId == null || input.parentId === '' ? null : String(input.parentId)
      if (parentId && !this.nodesById[parentId]) errors.push({ field: 'parentId', code: 'missing' })
      if (errors.length) return { ok: false, errors }

      const taken = new Set(Object.keys(this.nodesById))
      const id = createNodeId(taken)
      taken.add(id)
      const node = {
        id,
        parentId,
        type: input.type,
        title: input.title.trim(),
        description: (input.description ?? '').trim(),
        system: false,
        accessible: true,
        readOnly: false,
        data: initialData(input),
      }
      const created = [node]
      if (input.type === 'businessHours') {
        const successId = createNodeId(taken)
        taken.add(successId)
        const failureId = createNodeId(taken)
        node.data = { ...node.data, connectors: [successId, failureId] }
        created.push(branchNode(successId, id, 'success'), branchNode(failureId, id, 'failure'))
      }

      const nodes = [...this.nodeList, ...created]
      const index = buildTreeIndex(nodes)
      const preset = position ? { ...this.positions, [id]: position } : this.positions
      this.applyGraph(nodes, calculateInitialPositions(nodes, index, preset))
      return { ok: true, id }
    },
    updateNode(id, patch) {
      const current = this.nodesById[id]
      if (!current) return { ok: false, errors: [{ field: 'id', code: 'missing' }] }
      if (current.readOnly || current.system) {
        return { ok: false, errors: [{ field: 'id', code: 'readOnly' }] }
      }
      const next = {
        ...current,
        title: patch.title !== undefined ? String(patch.title).trim() : current.title,
        description: patch.description !== undefined ? String(patch.description).trim() : current.description,
        data: patch.data ? { ...current.data, ...patch.data } : current.data,
      }
      const errors = validateNode(next)
      if (errors.length) return { ok: false, errors }
      this.applyGraph(this.nodeList.map((node) => (node.id === id ? next : node)), this.positions)
      return { ok: true, id }
    },
    deleteNode(id) {
      const current = this.nodesById[id]
      if (!current) return { ok: false, errors: [{ field: 'id', code: 'missing' }] }
      if (current.system) return { ok: false, errors: [{ field: 'id', code: 'system' }] }

      const removeIds = new Set([id])
      if (current.type === 'businessHours') {
        for (const childId of this.childIdsByParentId[id] || []) {
          if (this.nodesById[childId]?.type === 'branch') removeIds.add(childId)
        }
      }

      const nodes = this.nodeList
        .filter((node) => !removeIds.has(node.id))
        .map((node) => (removeIds.has(node.parentId) ? { ...node, parentId: null } : node))
      const positions = {}
      for (const [nodeId, position] of Object.entries(this.positions)) {
        if (!removeIds.has(nodeId)) positions[nodeId] = position
      }
      this.applyGraph(nodes, positions)
      return { ok: true, removedIds: [...removeIds] }
    },
    setPosition(id, position) {
      if (!this.nodesById[id]) return { ok: false, errors: [{ field: 'id', code: 'missing' }] }
      this.positions = { ...this.positions, [id]: { x: position.x, y: position.y } }
      return { ok: true }
    },
  },
})
