let records = []

export function resetFlowApi(seed) {
  records = structuredClone(seed)
}

export function fetchFlow() {
  return Promise.resolve(structuredClone(records))
}

export function saveFlow(payload) {
  records = structuredClone(payload)
  return Promise.resolve(structuredClone(records))
}
