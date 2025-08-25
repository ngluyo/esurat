// esurat/src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Head from 'next/head' // Import Head

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'e-Surat',
  description: 'Aplikasi Manajemen Surat Elektronik',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
