'use client';

import { Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

export default function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const normalized = (role || 'MEMBER').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-white/10';
  let Icon = User;
  let label = 'Member';

  if (normalized === 'OWNER') {
    styles = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    Icon = ShieldAlert;
    label = 'Owner';
  } else if (normalized === 'ADMIN') {
    styles = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    Icon = ShieldCheck;
    label = 'Admin';
  } else {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
    Icon = Shield;
    label = 'Member';
  }

  const sizeClass =
    size === 'md'
      ? 'px-3 py-1 text-xs space-x-1.5'
      : 'px-2 py-0.5 text-[10px] space-x-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${styles} ${sizeClass}`}
    >
      <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      <span>{label}</span>
    </span>
  );
}
