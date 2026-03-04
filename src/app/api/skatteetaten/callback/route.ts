import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUrls } from "@/lib/skatteetaten/constants";
import { exchangeToken } from "@/lib/skatteetaten/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/mva?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/mva?error=missing_code", request.url)
    );
  }

  try {
    const urls = getUrls();
    const clientId = process.env.IDPORTEN_CLIENT_ID;
    const redirectUri = process.env.IDPORTEN_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error("Missing ID-porten configuration");
    }

    // Exchange authorization code for ID-porten token
    const tokenResponse = await fetch(urls.idPortenToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      throw new Error(`ID-porten token exchange failed: ${text}`);
    }

    const tokenData = await tokenResponse.json();
    const idPortenToken: string = tokenData.access_token;

    // Exchange ID-porten token for Altinn token
    const altinnToken = await exchangeToken(idPortenToken);

    // Store Altinn token in encrypted HTTP-only cookie (8 hours)
    const cookieStore = await cookies();
    cookieStore.set("altinn_token", altinnToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // Redirect back to MVA page, optionally with state (year-term)
    const redirectPath = state ? `/mva?submitted=${state}` : "/mva";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  } catch (err) {
    console.error("Skatteetaten callback error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown authentication error";
    return NextResponse.redirect(
      new URL(`/mva?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
