'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  full_name: string | null;
};

type Surat = {
    id: string;
    perihal: string;
    nomor_surat: string;
}

export default function CreateDisposisiPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [surat, setSurat] = useState<Surat | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [penerimaId, setPenerimaId] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Fetch the letter details
      const { data: suratData, error: suratError } = await supabase
        .from('surat')
        .select('id, perihal, nomor_surat')
        .eq('id', params.id)
        .single();

      if (suratError) {
          setError('Could not fetch surat details.');
          setLoading(false);
          return;
      }
      setSurat(suratData);

      // Fetch profiles of direct subordinates (for now, fetching all for simplicity)
      // In a real app, this should be an RPC call to a function that gets subordinates
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        // a real implementation would have: .eq('atasan_id', currentUser.id)
        .neq('id', currentUser.id); // Don't list self

      if (profilesError) {
        setError('Could not fetch user profiles.');
      } else {
        setProfiles(profilesData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.id, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !penerimaId || !instruksi) {
      setError('Penerima dan Instruksi tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('disposisi')
      .insert({
        surat_id: params.id,
        pengirim_id: user.id,
        penerima_id: penerimaId,
        instruksi: instruksi,
      })
      .select();

    if (insertError) {
      setError(`Error creating disposisi: ${insertError.message}`);
      setLoading(false);
      return;
    }

    // After creating disposition, update the surat status
    const { error: updateError } = await supabase
      .from('surat')
      .update({ status: 'Didisposisi' })
      .eq('id', params.id);

    if (updateError) {
      // Log the error, but don't block the user as the main action succeeded
      console.error('Failed to update surat status:', updateError);
    }

    router.push(`/dashboard/surat/${params.id}`);
  };

  if (loading && !surat) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Disposisi</h1>
        <p className="text-sm text-gray-600 mb-6">Untuk Surat: &quot;{surat?.perihal}&quot; ({surat?.nomor_surat})</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="penerima" className="block text-sm font-medium text-gray-700">Teruskan Kepada (Penerima)</label>
            <select
              id="penerima"
              value={penerimaId}
              onChange={(e) => setPenerimaId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Pilih Bawahan --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Catatan: Idealnya, daftar ini hanya berisi bawahan langsung Anda.</p>
          </div>
          <div>
            <label htmlFor="instruksi" className="block text-sm font-medium text-gray-700">Instruksi / Catatan</label>
            <textarea
              id="instruksi"
              value={instruksi}
              onChange={(e) => setInstruksi(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
              {loading ? 'Mengirim...' : 'Kirim Disposisi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
