'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/hooks/useNotifications';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Users,
  ShieldCheck,
  Info,
  ExternalLink,
} from 'lucide-react';

export default function NotificationBell({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'TEAM_INVITED':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'ROLE_UPDATED':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${d.toLocaleDateString()}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors relative flex items-start space-x-3 group ${
                    n.isRead ? 'bg-transparent hover:bg-white/[0.02]' : 'bg-indigo-950/20 hover:bg-indigo-950/30'
                  }`}
                >
                  {/* Icon badge */}
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-800 border border-white/5 flex-shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {formatNotificationTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>

                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5 font-medium transition-colors"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    )}
                  </div>

                  {/* Mark single as read */}
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
