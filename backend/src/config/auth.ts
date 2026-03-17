import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { env } from './env'

// Fetches and caches Microsoft's public signing keys
// Used to verify that tokens were genuinely issued by Microsoft
export const jwksClient = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 60 * 1000, // 10 hours
})

export const microsoftJwtOptions = {
  audience: env.AZURE_CLIENT_ID,
  issuer: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/v2.0`,
  algorithms: ['RS256'] as jwt.Algorithm[],
}
