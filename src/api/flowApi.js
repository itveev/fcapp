let records = []

function clone(value) {
  return structuredClone(value)
}

export function resetFlowApi(seed) {
  records = clone(seed)
}

export function fetchFlow() {
  return Promise.resolve(clone(records))
}

export function saveFlow(payload) {
  records = clone(payload)
  return Promise.resolve(clone(records))
}
