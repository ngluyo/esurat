// esurat/src/app/dashboard/surat/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

interface Surat {
  id: string
  nomor_surat: string
  perihal: string
  jenis_surat: string
  status: string
  isi_surat: string | null
  file_url: string | null
  pengirim_id: string
  penandatangan_id: string | null
}

interface Disposisi {
  id: string
  created_at: string
  instruksi: string
  profiles: {
    full_name: string
  } | null
  pengirim_id: string
}

export default function SuratDetailPage() {
  const [surat, setSurat] = useState<Surat | null>(null)
  const [disposisi, setDisposisi] = useState<Disposisi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSigning, setIsSigning] = useState(false)
  const [isUserAuthorized, setIsUserAuthorized] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const suratId = params.id as string

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: user } = await supabase.auth.getUser()

      if (!user.user) {
        router.push('/login')
        return
      }
      
      // PERBAIKAN: Gunakan query sederhana tanpa join yang kompleks
      const { data: suratData, error: suratError } = await supabase
        .from('surat')
        .select('*')
        .eq('id', suratId)
        .single()
      
      if (suratError) {
        console.error('Error fetching surat:', suratError)
        setError(suratError.message)
        setLoading(false)
        return
      }
      
      // Cek apakah user memiliki akses ke surat ini
      const hasAccess = 
        suratData.pengirim_id === user.user.id ||
        suratData.penandatangan_id === user.user.id;

      // Jika tidak memiliki akses langsung, cek melalui disposisi
      if (!hasAccess) {
        const { data: disposisiCheck } = await supabase
          .from('disposisi')
          .select('id')
          .eq('surat_id', suratId)
          .or(`pengirim_id.eq.${user.user.id},penerima_id.eq.${user.user.id}`)
          .limit(1);

        if (!disposisiCheck || disposisiCheck.length === 0) {
          setError('Anda tidak memiliki akses ke surat ini.')
          setLoading(false)
          return
        }
      }
      
      // Proses URL file
      let publicUrl = suratData.file_url;
      if (suratData.file_url) {
        if (!suratData.file_url.startsWith('http')) {
          const { data } = supabase.storage
            .from('surat_files')
            .getPublicUrl(suratData.file_url);
          publicUrl = data.publicUrl;
        }
      }
      
      setSurat({ ...suratData, file_url: publicUrl });
      setIsUserAuthorized(
        suratData.penandatangan_id === user.user.id ||
        suratData.pengirim_id === user.user.id
      );

      // Ambil data disposisi dengan query terpisah
      const { data: disposisiData, error: disposisiError } = await supabase
        .from('disposisi')
        .select('id, created_at, instruksi, pengirim_id')
        .eq('surat_id', suratId)
        .order('created_at', { ascending: false })

      if (disposisiError) {
        console.error('Error fetching disposisi:', disposisiError)
      } else if (disposisiData && disposisiData.length > 0) {
        // Ambil data profiles dalam query terpisah
        const pengirimIds = [...new Set(disposisiData.map(d => d.pengirim_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', pengirimIds);

        if (profilesError) {
          console.error('Error fetching profiles for disposisi:', profilesError);
          setDisposisi(disposisiData.map(d => ({
            ...d,
            profiles: null
          })) as Disposisi[]);
        } else {
          // Gabungkan data
          const disposisiWithProfiles = disposisiData.map(d => {
            const profile = profilesData?.find(p => p.id === d.pengirim_id);
            return {
              ...d,
              profiles: profile || null
            };
          });
          setDisposisi(disposisiWithProfiles as Disposisi[]);
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [suratId, router])

  const handleSign = async () => {
    setIsSigning(true)
    setError(null)
    try {
      if (!surat) return

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: updateData, error } = await supabase
        .from('surat')
        .update({ 
          status: 'ditandatangani', 
          penandatangan_id: user.user.id 
        })
        .eq('id', surat.id)
        .select()

      if (error) {
        console.error('Error signing surat:', error)
        throw error
      }
      
      setSurat({ ...surat, status: 'ditandatangani', penandatangan_id: user.user.id })
      alert('Surat berhasil ditandatangani!')

    } catch (err: any) {
      console.error('Error in handleSign:', err)
      setError(err.message)
    } finally {
      setIsSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Memuat data surat...</p>
        </div>
      </div>
    )
  }

  if (error || !surat) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="mt-2 text-red-600">{error || 'Surat tidak ditemukan.'}</p>
            <Link 
              href="/dashboard/surat" 
              className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Kembali ke Daftar Surat
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Detail Surat</h1>
        <Link href="/dashboard/surat" className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">
          Kembali ke Daftar
        </Link>
      </div>
      
      <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">{surat.nomor_surat}</h2>
          <p className="text-gray-600">
            <strong>Perihal:</strong> {surat.perihal}
          </p>
          <p className="text-gray-600">
            <strong>Jenis Surat:</strong> {surat.jenis_surat}
          </p>
          <p className="text-gray-600">
            <strong>Status:</strong> 
            <span className={`ml-2 inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium ${
              surat.status === 'dibuat' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {surat.status}
            </span>
          </p>
          {surat.isi_surat && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-gray-700">Isi Surat</h3>
              <p className="mt-2 text-gray-600 whitespace-pre-line">{surat.isi_surat}</p>
            </div>
          )}
        </div>
        
        {isUserAuthorized && surat.status === 'dibuat' && (
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleSign}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={isSigning}
            >
              {isSigning ? 'Menandatangani...' : 'Tanda Tangani'}
            </button>
            <Link 
              href={`/dashboard/surat/${suratId}/disposisi/create`} 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Buat Disposisi
            </Link>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {surat.file_url && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700">Pratinjau Dokumen</h3>
            <div className="mt-4 rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: '70vh' }}>
              <iframe
                src={surat.file_url}
                className="w-full h-full"
                title="Pratinjau Dokumen"
                onError={(e) => {
                  console.error('Iframe error:', e)
                }}
              />
            </div>
            <div className="mt-2 text-center space-x-4">
              <a 
                href={surat.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Buka di tab baru →
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(surat.file_url || '')}
                className="text-gray-600 hover:text-gray-800 text-sm ml-4"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}

        {/* Bagian untuk menampilkan disposisi */}
        {disposisi.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700">Daftar Disposisi</h3>
            <div className="mt-4 space-y-4">
              {disposisi.map((item) => (
                <div key={item.id} className="rounded-lg bg-gray-50 p-4 shadow-sm">
                  <p className="text-sm text-gray-500">
                    Dari: <span className="font-medium text-gray-700">
                      {item.profiles?.full_name || 'Pengguna Tidak Dikenal'}
                    </span>
                  </p>
                  <p className="mt-2 text-gray-600">{item.instruksi}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    Dibuat pada: {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}