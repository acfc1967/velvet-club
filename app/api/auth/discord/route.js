import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function GET(request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  if (!clientId) {
    return NextResponse.json({ error: 'Discord OAuth is not configured yet.' }, { status: 503 });
  }

  const state = crypto.randomBytes(24).toString('hex');
  const redirectUri = `${siteUrl}/api/auth/discord/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'identify',
    state,
    redirect_uri: redirectUri,
    prompt: 'consent',
  });

  const response = NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  response.cookies.set('velvet_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
