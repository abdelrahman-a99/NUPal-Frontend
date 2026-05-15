import "./globals.css";

import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "NUPal - Your Academic Journey, Simplified",
  description: "AI-powered academic advising platform for Nile University students. Plan your courses, track your progress, and achieve your educational goals.",
  keywords: ["Nile University", "Academic Advising", "Course Planning", "AI Advisor", "Student Success", "NUPal"],
  authors: [{ name: "NUPal Team" }],
  openGraph: {
    title: "NUPal - Academic Advising Simplified",
    description: "The intelligent way to navigate your academic journey at Nile University.",
    url: "https://nupal.edu.eg",
    siteName: "NUPal",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NUPal - Academic Advising Simplified",
    description: "The intelligent way to navigate your academic journey at Nile University.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2F80ED" />
      </head>
      <body className={`${poppins.className} flex min-h-screen flex-col`} suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
