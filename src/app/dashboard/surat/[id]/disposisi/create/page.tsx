// esurat/src/app/dashboard/surat/[id]/disposisi/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  jabatan: string
}

export default function CreateDisposisiPage() {
  const [instruksi, setInstruksi] = useState('')
  const [penerimaId, setPenerimaId] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const suratId = params.id as string

  useEffect(() => {
    async function fetchUsers() {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, jabatan')
        .order('full_name')

      if (usersError) {
        setError(usersError.message)
      } else {
        setUsers(usersData || [])
      }
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        throw new Error('Anda harus login untuk membuat disposisi.')
      }

      const { data: newDisposisi, error: insertError } = await supabase
        .from('disposisi')
        .insert({
          surat_id: suratId,
          pengirim_id: user.user.id,
          penerima_id: penerimaId,
          instruksi: instruksi,
        })
        .select()
      
      if (insertError) {
        throw insertError
      }

      // Kirim notifikasi ke penerima
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY_HERE')
        });

        const res = await fetch('/api/send-push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            title: 'Disposisi Baru',
            body: `Anda memiliki disposisi baru dari ${user.user.email} untuk surat dengan ID ${suratId}`,
          }),
        });

        if (!res.ok) {
            console.error('Gagal mengirim notifikasi push');
        }
      }

      alert('Disposisi berhasil dibuat!')
      router.push(`/dashboard/surat/${suratId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fungsi utilitas untuk mengubah VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800">Memuat...</div>
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-100 text-red-600">Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Buat Disposisi</h1>
        <Link href={`/dashboard/surat/${suratId}`} className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">
          Kembali
        </Link>
      </div>
      
      <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="penerimaId">
              Penerima Disposisi
            </label>
            <select
              id="penerimaId"
              value={penerimaId}
              onChange={(e) => setPenerimaId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Pilih Penerima</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.jabatan || 'Jabatan tidak diketahui'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="instruksi">
              Instruksi
            </label>
            <textarea
              id="instruksi"
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Disposisi'}
          </button>
        </form>
      </div>
    </div>
  )
}
