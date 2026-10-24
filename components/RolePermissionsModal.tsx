'use client';

import { X, Check, ShieldCheck, ShieldAlert, Shield, Info } from 'lucide-react';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RolePermissionsModal({
  isOpen,
  onClose,
}: RolePermissionsModalProps) {
  if (!isOpen) return null;

  const permissions = [
    {
      feature: 'View tasks, members, and team chat',
      owner: true,
      admin: true,
      member: true,
    },
    {
      feature: 'Create tasks & participate in team chat',
      owner: true,
      admin: true,
      member: true,
    },
    {
      feature: 'Edit & update own / assigned tasks',
      owner: true,
      admin: true,
      member: true,
    },
    {
      feature: 'Delete tasks created by self',
      owner: true,
      admin: true,
      member: true,
    },
    {
      feature: 'Manage all tasks (edit & delete any task)',
      owner: true,
      admin: true,
      member: false,
    },
    {
      feature: 'Invite new members',
      owner: true,
      admin: true,
      member: false,
    },
    {
      feature: 'Remove standard Members',
      owner: true,
      admin: true,
      member: false,
    },
    {
      feature: 'Change member roles (promote/demote)',
      owner: true,
      admin: false,
      member: false,
    },
    {
      feature: 'Transfer team ownership',
      owner: true,
      admin: false,
      member: false,
    },
    {
      feature: 'Update team settings & Delete team',
      owner: true,
      admin: false,
      member: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Role & Permissions Matrix</h2>
              <p className="text-xs text-slate-400">
                Detailed capabilities for Owner, Admin, and Member roles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions Table */}
        <div className="mt-6 border border-white/5 rounded-2xl overflow-hidden bg-slate-950/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-3.5 px-4">Action / Capability</th>
                <th className="py-3.5 px-3 text-center text-amber-300">Owner</th>
                <th className="py-3.5 px-3 text-center text-indigo-300">Admin</th>
                <th className="py-3.5 px-3 text-center text-emerald-300">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissions.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-medium">{p.feature}</td>

                  {/* Owner */}
                  <td className="py-3 px-3 text-center">
                    {p.owner ? (
                      <span className="inline-flex p-1 rounded-lg bg-amber-500/10 text-amber-400">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Admin */}
                  <td className="py-3 px-3 text-center">
                    {p.admin ? (
                      <span className="inline-flex p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Member */}
                  <td className="py-3 px-3 text-center">
                    {p.member ? (
                      <span className="inline-flex p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-start space-x-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p>
            All permission rules are enforced strictly on both the client interface and server-side API endpoints. Members cannot execute restricted actions even through direct HTTP requests.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
