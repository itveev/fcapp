const ALPHABET = '0123456789abcdef'

export function createNodeId(taken) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let id = ''
    for (let index = 0; index < 6; index += 1) {
      id += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
    if (!taken.has(id)) return id
  }
  throw new Error('Failed to create a unique node id')
}
