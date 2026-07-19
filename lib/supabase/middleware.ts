import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh user session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Let public assets and webhooks pass without auth checks
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/webhooks") ||
    path === "/favicon.ico"
  ) {
    return supabaseResponse;
  }

  const isAdminRoute = path.startsWith("/admin");
  const isClientRoute =
    path.startsWith("/overview") ||
    path.startsWith("/projects") ||
    path.startsWith("/messages") ||
    path.startsWith("/settings");

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  if (isAdminRoute || isClientRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    // Query user role via PostgREST (Edge safe)
    const { data: dbUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const role = dbUser.role;

    // Gate Client pages from Admin
    if (isClientRoute && role === "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // Gate Admin pages from Client
    if (isAdminRoute && role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from the public landing page (root route)
  if (path === "/" && user) {
    const { data: dbUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbUser) {
      const role = dbUser.role;
      const url = request.nextUrl.clone();
      url.pathname = role === "ADMIN" ? "/admin" : "/overview";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    const { data: dbUser } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!dbUser) {
      await supabase.auth.signOut();
      return supabaseResponse;
    }

    const role = dbUser.role;
    const url = request.nextUrl.clone();
    url.pathname = role === "ADMIN" ? "/admin" : "/overview";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
