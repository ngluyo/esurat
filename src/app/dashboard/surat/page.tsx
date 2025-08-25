// esurat/src/app/dashboard/surat/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Surat {
  id: string
  nomor_surat: string
  perihal: string
  status: string
  created_at: string
}

export default function SuratListPage() {
  const [suratList, setSuratList] = useState<Surat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSurat = async () => {
      setLoading(true)
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        // Redirect jika tidak ada user
        router.push('/login')
        return
      }

      // Ambil semua surat yang dibuat oleh user yang sedang login
      const { data, error } = await supabase
        .from('surat')
        .select('*')
        .eq('pengirim_id', user.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setSuratList(data as Surat[])
      }
      setLoading(false)
    }

    fetchSurat()
  }, [router])

  const handleDelete = async (suratId: string, nomorSurat: string) => {
    // Konfirmasi sebelum menghapus
    if (!confirm(`Apakah Anda yakin ingin menghapus surat "${nomorSurat}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setDeletingId(suratId)
    
    try {
      const { error } = await supabase
        .from('surat')
        .delete()
        .eq('id', suratId)

      if (error) {
        alert('Gagal menghapus surat: ' + error.message)
      } else {
        // Update state untuk menghilangkan surat yang dihapus dari daftar
        setSuratList(prevList => prevList.filter(surat => surat.id !== suratId))
        alert('Surat berhasil dihapus')
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus surat')
      console.error('Error deleting surat:', error)
    } finally {
      setDeletingId(null)
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Daftar Surat</h1>
        <Link href="/dashboard/surat/create" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
          Buat Surat Baru
        </Link>
      </div>

      <div className="mt-8">
        {suratList.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-gray-600 shadow-lg">
            <p>Belum ada surat yang Anda buat. Silakan buat surat baru.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {suratList.map((surat) => (
              <div key={surat.id} className="flex items-center justify-between rounded-xl bg-white p-6 shadow-lg">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{surat.nomor_surat}</h2>
                  <p className="mt-1 text-gray-600">Perihal: {surat.perihal}</p>
                  <p className="mt-1 text-sm text-gray-500">Dibuat pada: {new Date(surat.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${surat.status === 'dibuat' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {surat.status}
                  </span>
                  <Link href={`/dashboard/surat/${surat.id}`} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                    Lihat Detail
                  </Link>
                  <button
                    onClick={() => handleDelete(surat.id, surat.nomor_surat)}
                    disabled={deletingId === surat.id}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                  >
                    {deletingId === surat.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}