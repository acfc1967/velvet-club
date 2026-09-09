import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const url = new URL(request.url);

  // -----------------------------------------
  // OAuth parameters
  // -----------------------------------------

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const storedState = request.cookies.get(
    "velvet_oauth_state"
  )?.value;

  // -----------------------------------------
  // Environment variables
  // -----------------------------------------

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  // -----------------------------------------
  // Validate configuration
  // -----------------------------------------

  if (
    !clientId ||
    !clientSecret ||
    !sessionSecret ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    console.error(
      "Missing required environment variables."
    );

    return NextResponse.redirect(
      `${siteUrl}/?error=oauth_config`
    );
  }

  // -----------------------------------------
  // Validate OAuth state
  // -----------------------------------------

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState
  ) {
    return NextResponse.redirect(
      `${siteUrl}/?error=oauth_state`
    );
  }

  // -----------------------------------------
  // Exchange Discord authorization code
  // -----------------------------------------

  const redirectUri =
    `${siteUrl}/api/auth/discord/callback`;

  const tokenResponse = await fetch(
    "https://discord.com/api/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    }
  );

  if (!tokenResponse.ok) {
    console.error(
      "Discord token exchange failed:",
      await tokenResponse.text()
    );

    return NextResponse.redirect(
      `${siteUrl}/?error=oauth_token`
    );
  }

  const token = await tokenResponse.json();

  // -----------------------------------------
  // Retrieve Discord user
  // -----------------------------------------

  const userResponse = await fetch(
    "https://discord.com/api/v10/users/@me",
    {
      headers: {
        Authorization:
          `Bearer ${token.access_token}`,
      },
      cache: "no-store",
    }
  );

  if (!userResponse.ok) {
    console.error(
      "Discord user request failed:",
      await userResponse.text()
    );

    return NextResponse.redirect(
      `${siteUrl}/?error=oauth_user`
    );
  }

  const user = await userResponse.json();

  // -----------------------------------------
  // Build Discord avatar URL
  // -----------------------------------------

  let avatarUrl = null;

  if (user.avatar) {
    const extension = user.avatar.startsWith("a_")
      ? "gif"
      : "png";

    avatarUrl =
      `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}`;
  }

  // -----------------------------------------
  // Create Supabase admin client
  // -----------------------------------------

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // -----------------------------------------
  // Create or update Velvet profile
  // -----------------------------------------

  const { error: profileError } =
    await supabase
      .from("profiles")
      .upsert(
        {
          discord_id: user.id,
          username: user.username,
          avatar_url: avatarUrl,
          display_name:
            user.global_name || user.username,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "discord_id",
        }
      );

  if (profileError) {
    console.error(
      "Velvet profile upsert failed:",
      profileError
    );

    return NextResponse.redirect(
      `${siteUrl}/?error=profile_failed`
    );
  }

  // -----------------------------------------
  // Create Velvet session
  // -----------------------------------------

  const session = await new SignJWT({
    id: user.id,
    username: user.username,
    display_name:
      user.global_name || user.username,
    avatar: avatarUrl,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(
      new TextEncoder().encode(sessionSecret)
    );

  // -----------------------------------------
  // Redirect to dashboard
  // -----------------------------------------

  const response =
    NextResponse.redirect(
      `${siteUrl}/dashboard`
    );

  // -----------------------------------------
  // Store session cookie
  // -----------------------------------------

  response.cookies.set(
    "velvet_session",
    session,
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    }
  );

  // -----------------------------------------
  // Remove OAuth state cookie
  // -----------------------------------------

  response.cookies.delete(
    "velvet_oauth_state"
  );

  return response;
}
