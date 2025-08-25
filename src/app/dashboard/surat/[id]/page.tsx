'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

type ProfileRelation = {
  id: string;
  full_name: string | null;
};

type Disposisi = {
  id: string;
  created_at: string;
  instruksi: string | null;
  pengirim: ProfileRelation[]; // Changed to array
  penerima: ProfileRelation[]; // Changed to array
};

type SuratDetail = {
  id: string;
  created_at: string;
  nomor_surat: string;
  perihal: string;
  jenis_surat: string;
  status: string;
  isi_surat: string | null;
  file_url: string | null;
  pengirim: ProfileRelation[] | null;
  penandatangan: ProfileRelation[] | null;
};

export default function SuratDetailPage({ params }: { params: { id: string } }) {
  const [surat, setSurat] = useState<SuratDetail | null>(null);
  const [disposisiHistory, setDisposisiHistory] = useState<Disposisi[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: suratData, error: suratError } = await supabase
        .from('surat')
        .select(`
          id,
          created_at,
          nomor_surat,
          perihal,
          jenis_surat,
          status,
          isi_surat,
          file_url,
          pengirim:profiles!surat_pengirim_id_fkey(id, full_name),
          penandatangan:profiles!surat_penandatangan_id_fkey(id, full_name)
        `)
        .eq('id', params.id)
        .single();

      if (suratError) {
        setError(suratError.message);
        setLoading(false);
        return;
      }
      setSurat(suratData as SuratDetail);

      const { data: disposisiData, error: disposisiError } = await supabase
        .from('disposisi')
        .select(`
          id,
          created_at,
          instruksi,
          pengirim:profiles!disposisi_pengirim_id_fkey(id, full_name),
          penerima:profiles!disposisi_penerima_id_fkey(id, full_name)
        `)
        .eq('surat_id', params.id)
        .order('created_at', { ascending: true });
      
      if (disposisiError) {
        console.error("Error fetching disposition history:", disposisiError.message);
      } else {
        setDisposisiHistory(disposisiData as any[] as Disposisi[]);
      }

      setLoading(false);
    };

    if (params.id) {
      fetchDetails();
    }
  }, [params.id, supabase]);

  const handleAjukanVerifikasi = async () => {
    if (!currentUser) {
        alert('You must be logged in.');
        return;
    }
    setLoading(true);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('atasan_id')
        .eq('id', currentUser.id)
        .single();
    if (profileError || !profile || !profile.atasan_id) {
        alert('Error: Atasan tidak ditemukan. Pastikan profil Anda sudah diatur dengan benar oleh admin.');
        setLoading(false);
        return;
    }
    const { error: updateError } = await supabase
        .from('surat')
        .update({ status: 'Menunggu Verifikasi', penandatangan_id: profile.atasan_id })
        .eq('id', params.id);
    if (updateError) {
        alert(`Error: ${updateError.message}`);
    } else {
        alert('Surat berhasil diajukan untuk verifikasi.');
        router.refresh();
    }
    setLoading(false);
  };

  const handleVerifikasi = async (isApproved: boolean) => {
    if (!currentUser) {
        alert('You must be logged in.');
        return;
    }
    setLoading(true);

    if (!isApproved) {
        const { error } = await supabase
            .from('surat')
            .update({ status: 'Draft' })
            .eq('id', params.id);
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Surat telah ditolak dan dikembalikan ke status Draft.');
            router.refresh();
        }
        setLoading(false);
        return;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('atasan_id')
        .eq('id', currentUser.id)
        .single();
    if (profileError) {
        alert('Could not verify user profile.');
        setLoading(false);
        return;
    }

    if (profile.atasan_id) {
        const { error } = await supabase
            .from('surat')
            .update({ penandatangan_id: profile.atasan_id })
            .eq('id', params.id);
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Surat disetujui dan diteruskan ke atasan berikutnya.');
            router.refresh();
        }
    } else {
        const { error } = await supabase
            .from('surat')
            .update({ status: 'Disetujui' })
            .eq('id', params.id);
        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Surat telah disetujui sepenuhnya.');
            router.refresh();
        }
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8"><p>Loading surat details...</p></div>;
  if (error) return <div className="p-8"><p className="text-red-600">Error: {error}</p></div>;
  if (!surat) return <div className="p-8"><p>Surat not found.</p></div>;

  const getFullName = (relation: ProfileRelation[] | null) => {
    if (relation && relation.length > 0) {
      return relation[0].full_name ?? 'N/A';
    }
    return 'N/A';
  }

  const getId = (relation: ProfileRelation[] | null) => {
    if (relation && relation.length > 0) {
      return relation[0].id;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Kembali ke Daftar Surat
        </button>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{surat.perihal}</h1>
              <p className="text-sm text-gray-500">Nomor: {surat.nomor_surat}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                surat.status === 'Baru' ? 'bg-blue-100 text-blue-800' : 
                surat.status === 'Didisposisi' ? 'bg-yellow-100 text-yellow-800' :
                surat.status === 'Draft' ? 'bg-gray-200 text-gray-800' :
                surat.status === 'Menunggu Verifikasi' ? 'bg-purple-100 text-purple-800' :
                surat.status === 'Disetujui' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
            }`}>
                {surat.status}
            </span>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Jenis Surat</dt>
                <dd className="mt-1 text-sm text-gray-900">{surat.jenis_surat}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Tanggal Dibuat</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(surat.created_at).toLocaleString()}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Pengirim</dt>
                <dd className="mt-1 text-sm text-gray-900">{getFullName(surat.pengirim)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Penerima / Penandatangan</dt>
                <dd className="mt-1 text-sm text-gray-900">{getFullName(surat.penandatangan)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Isi Ringkas</dt>
                <dd className="mt-1 text-sm text-gray-900">{surat.isi_surat ?? 'Tidak ada ringkasan.'}</dd>
              </div>
              {surat.file_url && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">File Terlampir</dt>
                  <dd className="mt-1 text-sm">
                    <Link href={surat.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
                      Lihat File PDF
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

           <div className="mt-8 flex justify-end space-x-4">
                {surat.jenis_surat === 'Masuk' && (
                    <button
                        onClick={() => router.push(`/dashboard/surat/${surat.id}/disposisi/create`)}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                        Buat Disposisi
                    </button>
                )}
                 {surat.jenis_surat === 'Keluar' && surat.status === 'Draft' && getId(surat.pengirim) === currentUser?.id && (
                    <button
                        onClick={handleAjukanVerifikasi}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Ajukan Verifikasi
                    </button>
                )}
                {surat.status === 'Menunggu Verifikasi' && getId(surat.penandatangan) === currentUser?.id && (
                    <>
                        <button
                            onClick={() => handleVerifikasi(false)}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Tolak
                        </button>
                        <button
                            onClick={() => handleVerifikasi(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Setujui & Teruskan
                        </button>
                    </>
                )}
            </div>
        </div>

        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Riwayat Disposisi</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              {disposisiHistory.length > 0 ? (
                <ul className="space-y-4">
                  {disposisiHistory.map((d, index) => (
                    <li key={d.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-gray-800">
                          {getFullName(d.pengirim as any)} &rarr; {getFullName(d.penerima as any)}
                        </p>
                        <span className="text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{d.instruksi}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Belum ada riwayat disposisi untuk surat ini.</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
