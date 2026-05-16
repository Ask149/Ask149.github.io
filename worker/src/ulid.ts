const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const TIME_LEN = 10
const RAND_LEN = 16

function encodeTime(now: number, len: number): string {
  let str = ''
  let n = now
  for (let i = len - 1; i >= 0; i--) {
    const mod = n % 32
    str = ENC.charAt(mod) + str
    n = (n - mod) / 32
  }
  return str
}

function encodeRandom(len: number): string {
  let str = ''
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < len; i++) str += ENC.charAt(bytes[i] % 32)
  return str
}

export function ulid(): string {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RAND_LEN)
}
