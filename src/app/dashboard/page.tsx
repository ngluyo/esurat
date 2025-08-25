'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

type Surat = {
  id: string;
  perihal: string;
  nomor_surat: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [suratUntukDisposisi, setSuratUntukDisposisi] = useState<Surat[]>([]);
  const [suratUntukVerifikasi, setSuratUntukVerifikasi] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch surat awaiting verification
        const { data: verifikasiData } = await supabase
          .from('surat')
          .select('id, perihal, nomor_surat')
          .eq('penandatangan_id', user.id)
          .eq('status', 'Menunggu Verifikasi');
        setSuratUntukVerifikasi(verifikasiData || []);

        // TODO: Fetch surat awaiting disposition (more complex logic needed)
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-700">Loading...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <h1 className="text-xl font-bold text-gray-900">Dashboard eSurat</h1>
        <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
            <button
                onClick={handleLogout}
                className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
            >
                Logout
            </button>
        </div>
      </header>
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">Surat Menunggu Disposisi</h2>
                <div className="p-6 bg-white rounded-lg shadow">
                    <p className="text-gray-600">[Placeholder untuk daftar surat yang perlu didisposisi]</p>
                </div>
            </div>
            <div>
                <h2 className="mb-4 text-2xl font-semibold text-gray-800">Surat Menunggu Verifikasi Anda</h2>
                <div className="p-6 bg-white rounded-lg shadow">
                    {suratUntukVerifikasi.length > 0 ? (
                        <ul className="space-y-2">
                            {suratUntukVerifikasi.map(s => (
                                <li key={s.id} onClick={() => router.push(`/dashboard/surat/${s.id}`)} className="text-indigo-600 hover:underline cursor-pointer">
                                    {s.perihal} ({s.nomor_surat})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">Tidak ada surat yang menunggu verifikasi Anda.</p>
                    )}
                </div>
            </div>
        </div>

        <div className="mt-8">
             <button
                onClick={() => router.push('/dashboard/surat')}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
            >
                Lihat Semua Surat
            </button>
            <button
                onClick={() => router.push('/dashboard/surat/create')}
                className="ml-4 px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none"
            >
                Buat Surat Baru
            </button>
        </div>
      </main>
    </div>
  );
}
