'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <div className="text-center p-10 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          Selamat Datang di eSurat
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Solusi modern untuk manajemen persuratan dan tata naskah dinas elektronik di lingkungan pemerintahan. Efisien, transparan, dan akuntabel.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/register')}
            className="px-8 py-3 text-lg font-semibold text-indigo-700 bg-indigo-100 rounded-lg shadow-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            Register
          </button>
        </div>
      </div>
      <footer className="absolute bottom-0 py-4">
        <p className="text-sm text-gray-500">
          Powered by Sistem Pemerintahan Berbasis Elektronik (SPBE)
        </p>
      </footer>
    </div>
  );
}
