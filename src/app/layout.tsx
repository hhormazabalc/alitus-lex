import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'LEX Altius · Suite Jurídica Corporativa',
    template: '%s | LEX Altius',
  },
  description:
    'Plataforma corporativa para firmas legales en Bolivia. Gestiona expedientes, clientes y flujos procesales conforme a la normativa nacional.',
  keywords: ['abogados', 'jurídico', 'casos', 'bolivia', 'legaltech', 'corporativo', 'lex altius'],
  authors: [{ name: 'Altius Ignite', url: 'https://www.altiusignite.com' }],
  creator: 'Altius Ignite',
  publisher: 'Altius Ignite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  openGraph: {
    type: 'website',
    locale: 'es_BO',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'LEX Altius',
    title: 'LEX Altius · Suite Jurídica Corporativa',
    description:
      'Gestión integral de expedientes, clientes y timeline procesal adaptado al marco legal boliviano.',
    images: [
      {
        url: '/logo.svg',
        width: 200,
        height: 60,
        alt: 'LEX Altius',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LEX Altius · Suite Jurídica Corporativa',
    description:
      'Gestión integral de expedientes, clientes y timeline procesal adaptado al marco legal boliviano.',
    images: ['/logo.svg'],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-BO" className="h-full">
      <body
        className={`${inter.className} h-full min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(140%_90%_at_15%_-10%,rgba(82,153,255,0.5),rgba(3,14,36,0)_60%),radial-gradient(120%_80%_at_85%_12%,rgba(42,206,255,0.32),rgba(3,14,36,0)_55%),linear-gradient(145deg,#030d24_0%,#041a3d_45%,#063067_100%)]" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 mix-blend-screen bg-[radial-gradient(circle_at_45%_-15%,rgba(255,255,255,0.4),transparent_60%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.2),transparent_55%)]" />
          <div className="relative min-h-screen">
            <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7 sm:px-8 lg:px-10">
              <a
                href="https://www.altiusignite.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-lg shadow-[#1b2f83]/30 backdrop-blur-md transition hover:border-cyan-400/60 hover:text-cyan-200"
              >
                LEX ALTIUS
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium tracking-[0.18em] text-cyan-200/90 transition group-hover:bg-cyan-500/20 group-hover:text-white">
                  Built by Altius Ignite
                </span>
              </a>
              <a
                href="https://www.altiusignite.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-xs font-medium text-slate-200/70 transition hover:text-cyan-200 sm:inline-flex"
              >
                www.altiusignite.com
              </a>
            </header>
            <main className="relative z-10 min-h-screen pb-14 pt-6">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
