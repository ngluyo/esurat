'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabaseClient';

type Surat = {
  id: string;
  created_at: string;
  nomor_surat: string;
  perihal: string;
  jenis_surat: string;
  status: string;
};

export default function SuratListPage() {
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSurat = async () => {
      const { data, error } = await supabase
        .from('surat')
        .select('id, created_at, nomor_surat, perihal, jenis_surat, status')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setSuratList(data);
      }
      setLoading(false);
    };

    fetchSurat();
  }, [supabase]);

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/surat/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Surat</h1>
          <button
            onClick={() => router.push('/dashboard/surat/create')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            + Buat Surat Baru
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Surat</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perihal</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suratList.map((surat) => (
                  <tr key={surat.id} onClick={() => handleRowClick(surat.id)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">{surat.nomor_surat}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{surat.perihal}</td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{surat.jenis_surat}</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        surat.status === 'Baru' ? 'bg-blue-100 text-blue-800' :
                        surat.status === 'Didisposisi' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {surat.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">{new Date(surat.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
         {!loading && suratList.length === 0 && <p className="text-center text-gray-500 mt-4">Tidak ada surat untuk ditampilkan.</p>}
      </div>
    </div>
  );
}
