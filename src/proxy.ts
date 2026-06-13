import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const protectedPaths = ["/library", "/albums", "/playlists", "/favorites", "/admin"]
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return Response.redirect(url)
  }

  const authPaths = ["/login", "/signup"]
  if (user && authPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return Response.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|.*\\.svg).*)",
  ],
}
