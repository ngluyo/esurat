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

  if (loading) {
      return (
        <div className="p-8">
            <p className="text-gray-700">Loading dashboard data...</p>
        </div>
    );
  }

  return (
    <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Surat Menunggu Disposisi</h2>
                <div className="p-6 bg-white rounded-lg shadow">
                    <p className="text-gray-600">[Placeholder untuk daftar surat yang perlu didisposisi]</p>
                </div>
            </div>
            <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">Surat Menunggu Verifikasi Anda</h2>
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
    </div>
  );
}
