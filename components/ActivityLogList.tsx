'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  teamId: string;
  actorId: string;
  action: string;
  details: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function ActivityLogList({ teamId }: { teamId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Failed to reload team activity log:', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/teams/${teamId}/activity`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setActivities(data);
        }
      } catch (err) {
        if (!ignore) console.error('Failed to load team activity log:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [teamId]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created_task':
        return {
          icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          title: 'Task Created',
        };
      case 'updated_task':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-400" />,
          color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          title: 'Task Updated',
        };
      case 'deleted_task':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-400" />,
          color: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          title: 'Task Deleted',
        };
      case 'added_member':
        return {
          icon: <UserPlus className="w-4 h-4 text-blue-400" />,
          color: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          title: 'Member Added',
        };
      case 'removed_member':
      case 'left_team':
        return {
          icon: <UserMinus className="w-4 h-4 text-amber-400" />,
          color: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          title: 'Member Removed',
        };
      case 'updated_role':
      case 'transferred_ownership':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
          color: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          title: 'Role Changed',
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-400" />,
          color: 'bg-slate-800 text-slate-300 border-white/5',
          title: 'Activity',
        };
    }
  };

  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Team Activity Audit Trail</h3>
          <p className="text-xs text-slate-400">
            Real-time record of team tasks, members, and role changes
          </p>
        </div>

        <button
          onClick={reloadActivities}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="p-6">
        {loading && activities.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <span>Loading activity trail...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Activity className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
            <p>No recorded activities yet for this team.</p>
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-4 space-y-6">
            {activities.map((act) => {
              const badge = getActionBadge(act.action);
              const actorName =
                act.actor?.name || act.actor?.email?.split('@')[0] || 'User';

              return (
                <div key={act.id} className="relative pl-6 group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-3 top-0.5 p-1 rounded-full bg-slate-950 border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 block" />
                  </div>

                  <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 transition-colors hover:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.title}</span>
                        </span>
                        <span className="text-xs font-semibold text-white">
                          by {actorName}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 mr-1 text-slate-600" />
                        {formatActivityTime(act.createdAt)}
                      </span>
                    </div>

                    {act.details && (
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {act.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
