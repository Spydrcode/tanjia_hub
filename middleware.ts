import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { tanjiaServerConfig } from "@/lib/tanjia-config";

export function middleware(request: NextRequest) {
  // AUTH DISABLED FOR DEVELOPMENT: Allow all /tanjia routes without login
  // if (request.nextUrl.pathname.startsWith("/tanjia") && !request.nextUrl.pathname.startsWith("/tanjia/login")) {
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

  const { pathname, searchParams } = request.nextUrl;
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
