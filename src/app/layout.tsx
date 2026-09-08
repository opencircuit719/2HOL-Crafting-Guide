import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAllObjects } from "@/lib/data";
import HeaderSearch from "@/components/HeaderSearch";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { Coffee } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Two Hours One Life",
  description: "Interactive crafting guide for Two Hours One Life",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const objects = await getAllObjects();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head></head>
      <body className="min-h-full flex flex-col bg-white text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-4">
              <a href="/" className="text-xl font-bold tracking-tight text-amber-600 hover:text-amber-700 transition-colors shrink-0 dark:text-amber-400 dark:hover:text-amber-300">
                <span className="sm:hidden">2HOL</span>
                <span className="hidden sm:inline">Two Hours One Life</span>
              </a>
              <HeaderSearch objects={objects} />
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400 font-mono hidden lg:inline dark:text-zinc-500">
                  Interactive crafting guide
                </span>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-zinc-800 dark:text-zinc-500">
            <p>
              Data from{" "}
              <a
                href="https://twohoursonelife.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline dark:text-amber-400"
              >
                Two Hours One Life
              </a>
              . Not affiliated with the game developers.
            </p>
          </footer>
        </ThemeProvider>
        <a
          href="https://buymeacoffee.com/opencircuit"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-white transition-colors shadow-lg"
          aria-label="Buy me a coffee"
        >
          <Coffee className="w-5 h-5" />
        </a>
      </body>
    </html>
  );
}
