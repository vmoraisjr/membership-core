import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE } from "@/lib/auth/constants";

export function middleware(
  request: NextRequest
) {
  const sessionToken =
    request.cookies.get(
      AUTH_SESSION_COOKIE
    )?.value;
  const { pathname, search } =
    request.nextUrl;

  if (
    pathname.startsWith("/dashboard") &&
    !sessionToken
  ) {
    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "next",
      `${pathname}${search}`
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
