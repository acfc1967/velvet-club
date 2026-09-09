import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = request.cookies;

  const storedState = cookies.get("velvet_oauth_state")?.value;

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || url.origin;


  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      `${siteUrl}/?error=oauth_state`
    );
  }


  const redirectUri =
    `${siteUrl}/api/auth/discord/callback`;


  const tokenResponse = await fetch(
    "https://discord.com/api/oauth2/token",
    {
      method: "POST",
      headers:{
        "Content-Type":
        "application/x-www-form-urlencoded",
      },

      body:new URLSearchParams({
        client_id:clientId,
        client_secret:clientSecret,
        grant_type:"authorization_code",
        code,
        redirect_uri:redirectUri,
      }),
    }
  );


  const token = await tokenResponse.json();


  const userResponse = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers:{
        Authorization:
        `Bearer ${token.access_token}`,
      },
    }
  );


  const user = await userResponse.json();



  // Create Supabase connection

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );


  // Create/update user profile

  await supabase
    .from("profiles")
    .upsert({
      discord_id:user.id,
      username:user.username,
      global_name:user.global_name,
      avatar:user.avatar,
    },
    {
      onConflict:"discord_id"
    });



  const session = await new SignJWT({
    id:user.id,
    username:user.username,
    avatar:user.avatar,
  })
  .setProtectedHeader({
    alg:"HS256"
  })
  .setIssuedAt()
  .setExpirationTime("7d")
  .sign(
    new TextEncoder().encode(sessionSecret)
  );



  const response =
    NextResponse.redirect(
      `${siteUrl}/dashboard`
    );


  response.cookies.set(
    "velvet_session",
    session,
    {
      httpOnly:true,
      secure:true,
      sameSite:"lax",
      maxAge:60*60*24*7,
      path:"/",
    }
  );


  response.cookies.delete(
    "velvet_oauth_state"
  );


  return response;
}
