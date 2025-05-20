export const KEYCLOAK_CONFIG = {
  realm: 'project_idea',
  clientId: 'front',
  clientSecret: 'rwCJ9SR6aVTC5Qvz4MBUf15OqJX5wsHY',
  authServerUrl: 'http://localhost:10000',
  redirectUri: '/api/auth/callback',
} as const

// Helper functions for Keycloak URLs
export const getKeycloakUrl = (path: string) => 
  `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}${path}`

export const getAuthUrl = () => 
  getKeycloakUrl('/protocol/openid-connect/auth')

export const getTokenUrl = () => 
  getKeycloakUrl('/protocol/openid-connect/token')

export const getCertsUrl = () => 
  getKeycloakUrl('/protocol/openid-connect/certs')

export const getRedirectUri = (request?: Request) => {
  if (!request) return KEYCLOAK_CONFIG.redirectUri
  const url = new URL(request.url)
  return `${url.origin}${KEYCLOAK_CONFIG.redirectUri}`
} 