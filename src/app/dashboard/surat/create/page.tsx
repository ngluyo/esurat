'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Define a type for the profile data
type Profile = {
  id: string;
  full_name: string | null;
};

export default function CreateSuratPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nomorSurat, setNomorSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [jenisSurat, setJenisSurat] = useState('Masuk'); // Default to 'Masuk'
  const [isiSurat, setIsiSurat] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [penandatanganId, setPenandatanganId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch all user profiles to populate the dropdown
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (profilesError) {
        setError('Could not fetch user profiles.');
      } else {
        setProfiles(profilesData);
      }
    };
    fetchData();
  }, [router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a letter.');
      return;
    }
    setLoading(true);
    setError(null);

    let fileUrl: string | null = null;
    if (file) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('surat_files')
        .upload(filePath, file);

      if (uploadError) {
        setError(`Error uploading file: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('surat_files')
        .getPublicUrl(filePath);
      fileUrl = publicUrl;
    }

    const status = jenisSurat === 'Keluar' ? 'Draft' : 'Baru';

    const { error: insertError } = await supabase.from('surat').insert({
      nomor_surat: nomorSurat,
      perihal,
      jenis_surat: jenisSurat,
      status: status,
      isi_surat: isiSurat,
      file_url: fileUrl,
      pengirim_id: user.id,
      penandatangan_id: penandatanganId || null, // For now, this is the final signer. Verification chain will be handled later.
    });

    if (insertError) {
      setError(`Error creating letter: ${insertError.message}`);
    } else {
      router.push('/dashboard/surat'); // Redirect to letter list on success
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Buat Surat Baru</h1>
        {/* Placeholder for role check */}
        {/* <p className="mb-4 text-yellow-600">Note: This page should be restricted to SUPER_ADMIN users.</p> */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomorSurat" className="block text-sm font-medium text-gray-700">Nomor Surat</label>
              <input type="text" id="nomorSurat" value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="jenisSurat" className="block text-sm font-medium text-gray-700">Jenis Surat</label>
              <select id="jenisSurat" value={jenisSurat} onChange={(e) => setJenisSurat(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="Masuk">Surat Masuk</option>
                <option value="Keluar">Surat Keluar</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="perihal" className="block text-sm font-medium text-gray-700">Perihal</label>
            <input type="text" id="perihal" value={perihal} onChange={(e) => setPerihal(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="isiSurat" className="block text-sm font-medium text-gray-700">Isi Surat (Ringkasan)</label>
            <textarea id="isiSurat" value={isiSurat} onChange={(e) => setIsiSurat(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">File Surat (PDF)</label>
            <input type="file" id="file" onChange={handleFileChange} accept=".pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
          </div>
          <div>
            <label htmlFor="penandatangan" className="block text-sm font-medium text-gray-700">Penerima / Penandatangan Awal</label>
            <select id="penandatangan" value={penandatanganId} onChange={(e) => setPenandatanganId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="">-- Pilih Pengguna --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
              {loading ? 'Menyimpan...' : 'Simpan Surat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
