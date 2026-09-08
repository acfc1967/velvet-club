import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = request.cookies;
  const storedState = cookies.get('velvet_oauth_state')?.value;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_state`);
  }

  if (!clientId || !clientSecret || !sessionSecret) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_config`);
  }

  const redirectUri = `${siteUrl}/api/auth/discord/callback`;
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_token`);
  }

  const token = await tokenResponse.json();
  const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_user`);
  }

  const user = await userResponse.json();
  const session = await new SignJWT({
    id: user.id,
    username: user.username,
    global_name: user.global_name || user.username,
    avatar: user.avatar || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(sessionSecret));

  const response = NextResponse.redirect(`${siteUrl}/dashboard`);
  response.cookies.set('velvet_session', session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  response.cookies.delete('velvet_oauth_state');
  return response;
}
