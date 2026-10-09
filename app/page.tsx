'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import {
  CheckSquare,
  Users,
  ShieldCheck,
  Kanban,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen Task & Team Management</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-tight">
          Manage Work with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            TaFo
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          Create collaborative teams, invite coworkers, assign tasks, and track project progress with Kanban boards and role-based permissions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              href="/teams"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>Go to Your Teams Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-base px-8 py-4 rounded-2xl hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Log In</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Team Collaboration</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Create multiple teams and invite colleagues directly via email. Switch effortlessly between teams.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Kanban className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Kanban Board & Tracking</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Organize tasks across To Do, In Progress, and Done. Set due dates, priorities, and assign tasks to teammates.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all hover:-translate-y-1 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Role-Based Access</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Strict authorization rules protect your data. Owners manage teams and members, while creators and assignees control task life cycles.
          </p>
        </div>
      </div>

      {/* Interactive Preview / Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-900/30 via-slate-900/50 to-purple-900/30 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to streamline your workflow?
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Experience modern task management with TaFo on Next.js, Prisma, and Supabase.
            </p>
          </div>
          <Link
            href={user ? '/teams' : '/register'}
            className="flex-shrink-0 bg-white hover:bg-slate-100 text-slate-950 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105"
          >
            {user ? 'Open Dashboard' : 'Create Free Account'}
          </Link>
        </div>
      </div>
    </div>
  );
}
