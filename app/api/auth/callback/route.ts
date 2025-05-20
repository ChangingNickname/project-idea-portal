import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { KEYCLOAK_CONFIG, getTokenUrl, getRedirectUri } from '@/config/keycloak'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    console.error('No code received from Keycloak')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    console.log('Exchanging code for tokens...')
    // Exchange code for tokens
    const tokenResponse = await fetch(getTokenUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CONFIG.clientId,
        client_secret: KEYCLOAK_CONFIG.clientSecret,
        code: code,
        redirect_uri: getRedirectUri(request),
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Failed to get tokens:', errorText)
      throw new Error(`Failed to get tokens: ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log('Successfully received tokens')

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/', request.url))

    // Set the access token in a cookie
    response.cookies.set('keycloak_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expires_in, // Keycloak token expiration time
    })

    return response
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 