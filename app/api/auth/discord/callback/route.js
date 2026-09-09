import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const storedState = request.cookies.get("velvet_oauth_state")?.value;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_state`);
  }

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${siteUrl}/api/auth/discord/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_token`);
  }

  const token = await tokenResponse.json();

  const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!userResponse.ok) {
    return NextResponse.redirect(`${siteUrl}/?error=oauth_user`);
  }

  const user = await userResponse.json();

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from("profiles")
    .upsert({
      discord_id: user.id,
      username: user.username,
      avatar_url: avatarUrl,
      display_name: user.global_name || user.username,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "discord_id",
    });

  if (error) {
    console.error("SUPABASE PROFILE ERROR:", error.message, error.details, error.hint);
  }

  const session = await new SignJWT({
    id: user.id,
    username: user.username,
    display_name: user.global_name || user.username,
    avatar: avatarUrl,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(sessionSecret));

  const response = NextResponse.redirect(`${siteUrl}/dashboard`);

  response.cookies.set("velvet_session", session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  response.cookies.delete("velvet_oauth_state");

  return response;
}
