import { NextRequest, NextResponse } from "next/server"
import { jwtVerify, base64url } from "jose"

export async function middleware (req: NextRequest) {
  const jwtToken = req.cookies.get("token")?.value

  if (!jwtToken) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  try {
    const base64Secret = process.env.NEXT_PUBLIC_SECRET_JWT
    if (base64Secret) {
      const secret = base64url.decode(base64Secret)
      await jwtVerify(jwtToken, secret)
      return NextResponse.next()
    }
  } catch (error) {
    console.error("JWT verification failed:", error)
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  return NextResponse.next()
}

// Define the paths where the middleware should be applied
export const config = {
  matcher: [
    "/",
    "/admin/:path*"
  ]
}
