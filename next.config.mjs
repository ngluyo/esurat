// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'fqwybwgxnuvsvzshlaab.supabase.co', // Ganti dengan project ID Supabase Anda
      'fqwybwgxnuvsvzshlaab.supabase.co' // Berdasarkan error URL yang Anda berikan
    ],
  },
  async headers() {
    return [
      {
        // Untuk semua file dari Supabase storage
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

export default nextConfig