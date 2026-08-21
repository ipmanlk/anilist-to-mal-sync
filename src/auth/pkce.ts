import { createHash, randomBytes } from 'node:crypto'

const b64url = (buf: Buffer): string =>
  buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function generateVerifier(): string {
  return b64url(randomBytes(64))
}

export function challengeFor(verifier: string): string {
  return b64url(createHash('sha256').update(verifier).digest())
}

export function isPlausibleVerifier(v: string): boolean {
  return /^[A-Za-z0-9\-._~]{43,128}$/.test(v)
}

export function buildAuthorizeUrl(clientId: string, verifier: string): string {
  const u = new URL('https://myanimelist.net/v1/oauth2/authorize')
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('client_id', clientId)
  u.searchParams.set('code_challenge', challengeFor(verifier))
  u.searchParams.set('code_challenge_method', 'S256')
  return u.toString()
}
