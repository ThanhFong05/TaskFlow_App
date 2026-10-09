'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderPlus,
  Loader2,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

type TeamItem = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string };
  }>;
  _count: {
    tasks: number;
    members: number;
  };
};

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setCreateError('Team name is required');
      return;
    }

    setCreateError('');
    setCreating(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName.trim(),
          description: teamDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Failed to create team');
        setCreating(false);
        return;
      }

      setTeamName('');
      setTeamDescription('');
      setShowCreateModal(false);
      setCreating(false);
      fetchTeams();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating team');
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-white/5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collaboration Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Your Teams
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your teams, collaborate with members, and track tasks across projects
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Team Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-3xl border border-white/5">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Loading your teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Teams Found</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              You aren&apos;t a member of any team yet. Create your first team to start organizing tasks and inviting members!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Team</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const isOwner = team.ownerId === user?.id;
              const myMembership = team.members.find((m) => m.user.id === user?.id);
              const role = myMembership?.role || (isOwner ? 'OWNER' : 'MEMBER');

              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group block bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-indigo-500/40 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />

                  {/* Top: Name & Role Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        role === 'OWNER'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{role}</span>
                    </span>
                  </div>

                  {/* Name & Desc */}
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-2">
                    {team.name}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 min-h-[32px] leading-relaxed mb-6">
                    {team.description || 'No description provided.'}
                  </p>

                  {/* Stats & Arrow */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-200 font-semibold">{team._count.members}</strong> members
                      </span>
                      <span className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-200 font-semibold">{team._count.tasks}</strong> tasks
                      </span>
                    </div>

                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center font-semibold">
                      Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Create New Team</h2>
            <p className="text-slate-400 text-sm mb-6">
              You will automatically become the Owner of this team.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Frontend Engineering, Marketing..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Briefly describe what this team works on..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
