import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
  }

  const cookieStore = cookies();

  // Build the response first so we can write cookies onto it
  const response = NextResponse.redirect(`${origin}/choose-mode`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // Write cookies onto the response, not just the cookie store
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`);
  }

  // Check if user has already chosen a mode
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: prefs } = await adminSupabase
      .from("user_preferences")
      .select("mode")
      .eq("user_id", user.id)
      .single();

    // Update redirect destination based on existing mode
    const redirectTo = prefs?.mode ? "/dashboard" : "/choose-mode";
    response.headers.set("location", `${origin}${redirectTo}`);
  } catch (e) {
    console.error("Failed to fetch user prefs:", e);
    // Fall back to choose-mode if prefs check fails
    response.headers.set("location", `${origin}/choose-mode`);
  }

  return response;
}