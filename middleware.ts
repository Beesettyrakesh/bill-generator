import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Special handling for signout to prevent hydration issues
  if (pathname.includes('/api/auth/signout')) {
    return NextResponse.next();
  }

  // Handle login page access - redirect to home if already authenticated
  if (pathname.startsWith("/login")) {
    if (session) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Allow access to API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow access to static files
  if (
    pathname.includes("/_next") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes("/res/")
  ) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!session) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
