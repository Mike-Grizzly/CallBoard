import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy (replaces middleware.ts).
 *
 * Responsibilities:
 * 1. Refresh the Supabase auth session on every navigation (keeps tokens alive)
 * 2. Redirect unauthenticated users to /login for protected routes
 * 3. Redirect authenticated users away from /login and /signup to /dashboard
 */

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  // Public marketing site — must be reachable by logged-out visitors.
  "/",
  "/features",
  "/pricing",
  "/reviews",
  "/blog",
  "/faq",
  "/contact",
  // Sanity Studio (content editor) — authenticates against Sanity, not the app.
  "/studio",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createSupabaseProxyClient(request, response);

  // Refresh session — IMPORTANT: always call getUser() in the proxy so
  // Supabase can refresh expired tokens and write new cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on a public auth page → redirect to dashboard
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/signup/confirm")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files, images, and favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
