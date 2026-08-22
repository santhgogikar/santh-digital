import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("sd_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
