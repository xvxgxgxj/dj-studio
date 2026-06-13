import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "DJ Studio - منصة الموسيقى الشخصية",
  description: "منصة الموسيقى الشخصية الخاصة بك - استمع ونظم وأدر مكتبتك الموسيقية",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DJ Studio",
  },
  applicationName: "DJ Studio",
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full bg-black text-white font-[family-name:var(--font-noto-arabic)]">
        {children}
      </body>
    </html>
  )
}
