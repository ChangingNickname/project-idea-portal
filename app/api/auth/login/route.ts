import { NextResponse } from 'next/server'
import { getAuthUrl, KEYCLOAK_CONFIG, getRedirectUri } from '@/config/keycloak'

export async function GET(request: Request) {
  const authUrl = new URL(getAuthUrl())

  authUrl.searchParams.append('client_id', KEYCLOAK_CONFIG.clientId)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'openid profile email')
  authUrl.searchParams.append('redirect_uri', getRedirectUri(request))

  return NextResponse.redirect(authUrl.toString())
} 