import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentPath = request.nextUrl.pathname;
  
  // Bodyguard: Kick unauthenticated users trying to access the dashboard
  if (!user && currentPath.startsWith('/era-admin-x90')) {
    console.log(`[PROXY BODYGUARD] 🚨 AKSES DITOLAK! User mencoba masuk ke ${currentPath} tanpa sesi login. Menendang ke halaman utama...`);
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Optional: Redirect authenticated users away from the login page
  if (user && currentPath.startsWith('/era-login')) {
    console.log(`[PROXY BODYGUARD] ✅ User valid (${user.email}) mencoba ke /era-login. Mengarahkan langsung ke Dashboard.`);
    const url = request.nextUrl.clone()
    url.pathname = '/era-admin-x90'
    return NextResponse.redirect(url)
  }

  if (user && currentPath.startsWith('/era-admin-x90')) {
    console.log(`[PROXY BODYGUARD] 🟢 Akses Diizinkan! User: ${user.email} masuk ke Dashboard.`);
  }

  return supabaseResponse
}
