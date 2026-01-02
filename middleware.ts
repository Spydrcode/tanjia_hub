import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Redirect legacy presentation routes to share
  if (pathname === "/tanjia/present" || pathname === "/tanjia/presentation") {
    const shareUrl = new URL("/tanjia/share", request.url);
    shareUrl.search = searchParams.toString(); // preserve query params
    return NextResponse.redirect(shareUrl, 301); // permanent redirect
  }

  // AUTH DISABLED FOR DEVELOPMENT: Allow all /tanjia routes without login
  // if (pathname.startsWith("/tanjia") && !pathname.startsWith("/tanjia/login")) {
  //   const hasAuthCookie = request.cookies
  //     .getAll()
  //     .some((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"));
  //   if (!hasAuthCookie) {
  //     const loginUrl = new URL("/tanjia/login", request.url);
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }

  if (!tanjiaServerConfig.helperPasscodeEnabled || !tanjiaServerConfig.helperPasscode) {
    return NextResponse.next();
  }
  if (!pathname.startsWith("/tanjia/helper")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/tanjia/helper/login")) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("tanjia_auth");
  if (authCookie?.value === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/tanjia/helper/login", request.url);
  if (searchParams.toString()) {
    loginUrl.search = searchParams.toString();
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/tanjia/:path*"],
};
