// esurat/src/app/dashboard/surat/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

export default function CreateSuratPage() {
  const [nomorSurat, setNomorSurat] = useState('')
  const [perihal, setPerihal] = useState('')
  const [jenisSurat, setJenisSurat] = useState('')
  const [isiSurat, setIsiSurat] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0] || null
    setFile(uploadedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!file) {
        throw new Error('Harap unggah file surat.')
      }
      
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('Anda harus login untuk membuat surat.')
      }

      // Unggah file ke Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.data.user.id}/${fileName}`

      console.log('Uploading file to path:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('surat_files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)
      
      // PERBAIKAN: Gunakan getPublicUrl untuk mendapat URL yang benar
      const { data: publicUrlData } = supabase.storage
        .from('surat_files')
        .getPublicUrl(filePath)

      const fileUrl = publicUrlData.publicUrl
      console.log('Public URL generated:', fileUrl)

      // Simpan metadata surat ke database Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('surat')
        .insert({
          nomor_surat: nomorSurat,
          perihal: perihal,
          jenis_surat: jenisSurat,
          isi_surat: isiSurat,
          file_url: fileUrl, // Gunakan URL dari getPublicUrl
          status: 'dibuat',
          pengirim_id: user.data.user.id,
          penandatangan_id: null, // Akan diset saat assign
        })
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      console.log('Surat created successfully:', insertData)
      alert('Surat berhasil dibuat!')
      router.push('/dashboard/surat')
    } catch (err: any) {
      console.error('Error in handleSubmit:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Buat Surat Baru</h1>
        <Link href="/dashboard/surat" className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700">
          Kembali
        </Link>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="nomorSurat">
              Nomor Surat
            </label>
            <input
              type="text"
              id="nomorSurat"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="perihal">
              Perihal
            </label>
            <input
              type="text"
              id="perihal"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="jenisSurat">
              Jenis Surat
            </label>
            <input
              type="text"
              id="jenisSurat"
              value={jenisSurat}
              onChange={(e) => setJenisSurat(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="isiSurat">
              Isi Surat (Opsional)
            </label>
            <textarea
              id="isiSurat"
              value={isiSurat}
              onChange={(e) => setIsiSurat(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="fileSurat">
              Unggah File Surat (PDF/DOCX)
            </label>
            <input
              type="file"
              id="fileSurat"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-300"
              accept=".pdf,.docx"
              required
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                File terpilih: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Surat'}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}