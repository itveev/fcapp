import { useVueFlow } from '@vue-flow/core'
import { placeNearCenter } from '../utils/placement'

export const FLOW_ID = 'workflow'

export function useFlowViewport() {
  return useVueFlow({ id: FLOW_ID })
}

export function positionInViewport(screenToFlowCoordinate, pane, slot) {
  if (!pane) return undefined
  const rect = pane.getBoundingClientRect()
  if (!rect.width || !rect.height) return undefined
  const center = screenToFlowCoordinate({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
  return placeNearCenter(center, slot)
}
