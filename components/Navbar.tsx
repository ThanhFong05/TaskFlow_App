'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { CheckSquare, LogOut, User as UserIcon, Plus } from 'lucide-react';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User';

  return (
    <nav className="bg-slate-950/70 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center mr-3 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300 leading-none">
                  TaFo
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400/80 -mt-0.5">
                  Task & Team
                </span>
              </div>
            </Link>

            <div className="hidden sm:flex sm:space-x-4">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Home
              </Link>
              {user && (
                <Link
                  href="/teams"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    pathname.startsWith('/teams')
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Teams & Tasks
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs uppercase shadow-sm">
                    {displayName.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-200 hidden md:inline max-w-[120px] truncate">
                    {displayName}
                  </span>
                </div>

                <button
                  onClick={signOut}
                  className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-white px-4 py-2 text-sm font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
