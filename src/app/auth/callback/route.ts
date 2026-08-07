import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, { ...options, maxAge: 60 * 15 })
              );
            } catch {
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Admin auth flow — skip customer upsert, go straight to whitelist check
      if (next === "/api/admin/auth/check") {
        return NextResponse.redirect(`${origin}/api/admin/auth/check`);
      }

      // Normal customer login — upsert customer row
      if (isSupabaseServiceConfigured()) {
        try {
          const serviceClient = createSupabaseServiceClient();
          const user = data.user;
          const meta = user.user_metadata ?? {};

          const fullName = (meta.full_name as string) ?? "";
          const nameParts = fullName.split(" ");
          const firstName =
            (meta.first_name as string) ??
            (nameParts.length > 0 ? nameParts[0] : null) ??
            null;
          const lastName =
            (meta.last_name as string) ??
            (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null) ??
            null;

          await serviceClient.from("customers").upsert(
            {
              auth_user_id: user.id,
              email: user.email ?? "",
              first_name: firstName,
              last_name: lastName,
              accepts_marketing: Boolean(meta.accepts_marketing),
            },
            { onConflict: "auth_user_id" }
          );

          logger.info("customer upserted after OAuth", { userId: user.id });
        } catch (e) {
          logger.warn("customer upsert failed in callback", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/account?error=auth-failed`);
}
