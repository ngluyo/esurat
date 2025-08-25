// esurat/src/app/dashboard/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import { useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkUser()

    // Register Service Worker untuk notifikasi
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
          console.log('Service Worker berhasil didaftarkan dengan scope:', registration.scope);
        }, function(err) {
          console.log('Pendaftaran Service Worker gagal:', err);
        });
      });
    }
  }, [router])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error saat logout:', error.message)
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Selamat Datang di e-Surat!</h1>
        <p className="mt-4 text-xl text-gray-600">Aplikasi Anda sekarang siap untuk fungsionalitas PWA dan notifikasi.</p>
        <button
          onClick={handleLogout}
          className="mt-6 rounded-md bg-indigo-600 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
