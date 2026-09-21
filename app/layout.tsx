import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow | Manage Tasks & Teams",
  description: "A simple task and team management application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-900/20 via-slate-900/10 to-transparent pointer-events-none -z-10"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none -z-10"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none -z-10"></div>
        <Navbar />
        <main className="flex-1 w-full relative z-0">
          {children}
        </main>
      </body>
    </html>
  );
}
