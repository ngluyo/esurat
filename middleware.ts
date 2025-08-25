// esurat/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Ambil URL dari permintaan
  const { pathname } = request.nextUrl
  const supabase = createServerClient(request.cookies)
  const { data } = await supabase.auth.getSession()

  const isLoggedIn = !!data.session
  const publicPaths = ['/login', '/register', '/'] // Halaman yang tidak memerlukan login

  // Jika pengguna tidak login dan mencoba mengakses halaman yang tidak publik, redirect ke halaman login
  if (!isLoggedIn && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman login/register, redirect ke dashboard
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Lanjutkan ke halaman yang diminta
  return NextResponse.next()
}

// Konfigurasi middleware agar hanya berjalan di path tertentu
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

// Helper untuk membuat client Supabase di sisi server (middleware)
function createServerClient(cookies: any) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        global: {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'x-supabase-api-key': supabaseKey,
          },
        },
    })
}
