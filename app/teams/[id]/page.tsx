'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTeamRealtime } from '@/lib/hooks/useTeamRealtime';
import TeamChat, { ChatMessage } from '@/components/TeamChat';
import RoleBadge from '@/components/RoleBadge';
import RolePermissionsModal from '@/components/RolePermissionsModal';
import ActivityLogList from '@/components/ActivityLogList';
import {
  Users,
  Plus,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit3,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Kanban,
  List,
  UserPlus,
  X,
  Clock,
  Check,
  MoreVertical,
  Loader2,
  Settings,
  MessageSquare,
  Activity,
  Info,
  Radio,
  Lock,
} from 'lucide-react';

type Member = {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  teamId: string;
  assigneeId: string | null;
  creatorId: string | null;
  createdAt: string;
  assignee?: { id: string; name: string | null; email: string } | null;
  creator?: { id: string; name: string | null; email: string } | null;
};

type TeamDetails = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  currentUserRole: string;
  members: Member[];
  tasks: Task[];
};

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: teamId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat' | 'members' | 'activity'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskFormError, setTaskFormError] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Member invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit team form
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  // Live incoming message state for chat
  const [liveIncomingMessage, setLiveIncomingMessage] = useState<ChatMessage | null>(null);

  // Real-time Update Toast Notifications
  interface ToastItem {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning';
  }
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Live task update callbacks with Toast notifications
  const handleLiveTaskCreated = useCallback((newTask: Task) => {
    setTeam((prev) => {
      if (!prev) return prev;
      if (prev.tasks.some((t) => t.id === newTask.id)) return prev;
      return { ...prev, tasks: [newTask, ...prev.tasks] };
    });
    addToast('Task Created', `"${newTask.title}" was created by a teammate`, 'success');
  }, [addToast]);

  const handleLiveTaskUpdated = useCallback((updatedTask: Task) => {
    setTeam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
      };
    });
    addToast('Task Updated', `"${updatedTask.title}" was updated by a teammate`, 'info');
  }, [addToast]);

  const handleLiveTaskDeleted = useCallback((taskId: string) => {
    setTeam((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });
    addToast('Task Deleted', 'A task was deleted from the board', 'warning');
  }, [addToast]);

  const handleLiveMessage = useCallback((msg: ChatMessage) => {
    setLiveIncomingMessage(msg);
    if (activeTab !== 'chat') {
      const senderName = msg.sender?.name || msg.sender?.email?.split('@')[0] || 'Teammate';
      addToast('New Team Message', `${senderName}: ${msg.content || 'Sent an attachment'}`, 'info');
    }
  }, [activeTab, addToast]);

  // Supabase Realtime Hook
  const {
    isConnected,
    onlineUsers,
    typingUsers,
    broadcastNewMessage,
    broadcastTaskCreated,
    broadcastTaskUpdated,
    broadcastTaskDeleted,
    broadcastTyping,
  } = useTeamRealtime({
    teamId,
    currentUser: user,
    onNewMessage: handleLiveMessage,
    onTaskCreated: handleLiveTaskCreated,
    onTaskUpdated: handleLiveTaskUpdated,
    onTaskDeleted: handleLiveTaskDeleted,
  });

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        if (res.status === 403) setError('You do not have access to this team.');
        else if (res.status === 404) setError('Team not found.');
        else setError('Failed to load team.');
        return;
      }
      const data = await res.json();
      setTeam(data);
      setEditTeamName(data.name);
      setEditTeamDescription(data.description || '');
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading team data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  // Role permissions helpers
  const currentRole = team?.currentUserRole || 'MEMBER';
  const isOwner = currentRole === 'OWNER' || team?.ownerId === user?.id;
  const isAdmin = currentRole === 'ADMIN';
  const isMemberOnly = currentRole === 'MEMBER';
  const canManageMembers = isOwner || isAdmin;
  const canManageAllTasks = isOwner || isAdmin;

  // Check if current user can delete a specific task
  const canDeleteTask = (task: Task) => {
    if (isOwner || isAdmin) return true;
    return task.creatorId === user?.id;
  };

  // Open Create/Edit Task Modal
  const openTaskModal = (task?: Task) => {
    setTaskFormError('');
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description || '');
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
      setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setTaskAssigneeId(task.assigneeId || '');
    } else {
      setEditingTask(null);
      setTaskTitle('');
      setTaskDescription('');
      setTaskStatus('To Do');
      setTaskPriority('Medium');
      setTaskDueDate('');
      setTaskAssigneeId('');
    }
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskFormError('Task title is required');
      return;
    }

    setTaskSubmitting(true);
    setTaskFormError('');

    try {
      const payload = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
        assigneeId: taskAssigneeId || null,
      };

      let res;
      if (editingTask) {
        res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/teams/${teamId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setTaskFormError(data.error || 'Failed to save task');
        setTaskSubmitting(false);
        return;
      }

      // Update state locally and broadcast live update
      if (editingTask) {
        handleLiveTaskUpdated(data);
        broadcastTaskUpdated(data);
      } else {
        handleLiveTaskCreated(data);
        broadcastTaskCreated(data);
      }

      setShowTaskModal(false);
      setTaskSubmitting(false);
    } catch (err: any) {
      setTaskFormError(err.message || 'Error saving task');
      setTaskSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Optimistic update
      setTeam((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      });

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        // Broadcast status update to other online members
        broadcastTaskUpdated(updatedTask);
      } else {
        fetchTeam(); // rollback on failure
      }
    } catch (err) {
      console.error(err);
      fetchTeam();
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!canDeleteTask(task)) {
      alert('Forbidden: Members can only delete tasks they created. Admins and Owners can delete any task.');
      return;
    }

    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

    try {
      // Optimistic delete
      handleLiveTaskDeleted(task.id);
      broadcastTaskDeleted(task.id);

      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete task');
        fetchTeam(); // rollback
      }
    } catch (err) {
      console.error(err);
      fetchTeam();
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: isOwner ? inviteRole : 'MEMBER',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Failed to add member');
        setInviting(false);
        return;
      }

      setInviteSuccess(`Successfully added ${inviteEmail} as ${data.role || 'Member'}!`);
      setInviteEmail('');
      setInviting(false);
      fetchTeam();
      setTimeout(() => setShowMemberModal(false), 1200);
    } catch (err: any) {
      setInviteError(err.message || 'Error adding member');
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (targetUserId: string, newRole: string) => {
    if (!isOwner) {
      alert('Only the team Owner can change member roles.');
      return;
    }

    if (newRole === 'OWNER') {
      if (!confirm('Are you sure you want to TRANSFER OWNERSHIP of this team? You will become an Admin.')) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${targetUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchTeam();
      } else {
        alert(data.error || 'Failed to update member role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (targetMember: Member) => {
    const isSelf = targetMember.user.id === user?.id;
    const confirmMsg = isSelf
      ? 'Are you sure you want to LEAVE this team?'
      : `Remove ${targetMember.user.email} from this team?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${targetMember.user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (isSelf) {
          router.push('/teams');
        } else {
          fetchTeam();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeam(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editTeamName.trim(),
          description: editTeamDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setShowEditTeamModal(false);
        fetchTeam();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Are you SURE you want to delete this team? All its tasks and messages will be permanently removed.`)) return;
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/teams');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete team');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks
  const filteredTasks = (team?.tasks || []).filter((task) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesAssignee =
      assigneeFilter === 'All' ||
      (assigneeFilter === 'Unassigned' && !task.assigneeId) ||
      task.assigneeId === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Low':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'To Do':
      default:
        return 'bg-slate-800 text-slate-300 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Loading workspace & real-time connection...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Workspace Error</h2>
        <p className="text-slate-400 text-sm mb-6">{error || 'Team not found.'}</p>
        <Link
          href="/teams"
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Teams</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Role Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Link
              href="/teams"
              className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Teams
            </Link>

            {/* Live Indicator */}
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isConnected ? 'Real-time Live' : 'Connecting Realtime...'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {team.name}
            </h1>
            <RoleBadge role={currentRole} size="md" />

            <button
              onClick={() => setShowPermissionsModal(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              title="View role permissions matrix"
            >
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Permissions Matrix</span>
            </button>
          </div>

          {team.description && (
            <p className="text-slate-400 text-sm max-w-2xl">{team.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => openTaskModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>

          {canManageMembers && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center space-x-2 bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Invite Member</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setShowEditTeamModal(true)}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Team settings & deletion (Owner only)"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs (Tasks, Real-time Chat, Members, Audit Log) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks ({team.tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Team Chat</span>
            {onlineUsers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({team.members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'activity'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* View Switcher (for Tasks tab) */}
        {activeTab === 'tasks' && (
          <div className="flex items-center space-x-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table / List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: LIVE TASK BOARD */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by keyword..."
                className="w-full bg-slate-950/70 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status */}
              <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-white font-medium outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="All">All</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                <span className="text-[11px] font-semibold text-slate-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-white font-medium outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Assignee */}
              <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-400">
                <span className="text-[11px] font-semibold text-slate-500">Assignee:</span>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="bg-transparent text-white font-medium outline-none cursor-pointer max-w-[120px] truncate [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="All">All</option>
                  <option value="Unassigned">Unassigned</option>
                  {team.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Kanban Board View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['To Do', 'In Progress', 'Done'] as const).map((columnStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);
                return (
                  <div
                    key={columnStatus}
                    className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex flex-col min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            columnStatus === 'Done'
                              ? 'bg-emerald-400'
                              : columnStatus === 'In Progress'
                              ? 'bg-indigo-400 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        <h3 className="font-bold text-sm text-white">{columnStatus}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                      {columnTasks.length === 0 ? (
                        <div className="h-32 flex items-center justify-center border border-white/5 border-dashed rounded-2xl text-slate-600 text-xs font-medium">
                          No tasks in {columnStatus}
                        </div>
                      ) : (
                        columnTasks.map((task) => {
                          const userCanDelete = canDeleteTask(task);

                          return (
                            <div
                              key={task.id}
                              className="bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 shadow-lg hover:shadow-indigo-500/5 transition-all group relative"
                            >
                              {/* Badges & Actions */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>

                                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openTaskModal(task)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                                    title="Edit Task"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {userCanDelete ? (
                                    <button
                                      onClick={() => handleDeleteTask(task)}
                                      className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                      title={
                                        isOwner || isAdmin
                                          ? `Delete Task (${currentRole} privilege)`
                                          : 'Delete Task (Created by you)'
                                      }
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1 rounded-lg text-slate-600 cursor-not-allowed"
                                      title="Members can only delete their own tasks"
                                    >
                                      <Lock className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Title & Description */}
                              <h4 className="font-bold text-sm text-slate-100 mb-1 group-hover:text-indigo-300 transition-colors">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              {/* Due Date & Assignee */}
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-white/5">
                                <div className="flex items-center space-x-1">
                                  {task.dueDate ? (
                                    <span className="flex items-center text-slate-400">
                                      <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">No due date</span>
                                  )}
                                </div>

                                {task.assignee ? (
                                  <div
                                    className="flex items-center space-x-1.5"
                                    title={`Assigned to ${task.assignee.name || task.assignee.email}`}
                                  >
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-[10px] font-bold text-white flex items-center justify-center uppercase">
                                      {(task.assignee.name || task.assignee.email).charAt(0)}
                                    </div>
                                    <span className="text-slate-300 max-w-[80px] truncate">
                                      {task.assignee.name || task.assignee.email.split('@')[0]}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic">Unassigned</span>
                                )}
                              </div>

                              {/* Quick Move Status selector */}
                              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">Move to:</span>
                                <div className="flex space-x-1">
                                  {(['To Do', 'In Progress', 'Done'] as const)
                                    .filter((s) => s !== columnStatus)
                                    .map((target) => (
                                      <button
                                        key={target}
                                        onClick={() => handleStatusChange(task.id, target)}
                                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/40 text-slate-300 hover:text-white transition-colors border border-white/5"
                                      >
                                        {target}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table / List View */}
          {viewMode === 'list' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Task</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Priority</th>
                      <th className="py-4 px-4">Assignee</th>
                      <th className="py-4 px-4">Due Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          No tasks match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const userCanDelete = canDeleteTask(task);

                        return (
                          <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-white text-sm">{task.title}</div>
                              {task.description && (
                                <div className="text-slate-400 text-xs line-clamp-1 mt-0.5">
                                  {task.description}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase cursor-pointer outline-none [&>option]:text-slate-900 [&>option]:bg-white ${getStatusBadge(
                                  task.status
                                )}`}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {task.assignee ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-5 h-5 rounded-full bg-indigo-500/30 text-[10px] font-bold text-indigo-300 flex items-center justify-center uppercase">
                                    {(task.assignee.name || task.assignee.email).charAt(0)}
                                  </div>
                                  <span className="text-slate-200">
                                    {task.assignee.name || task.assignee.email.split('@')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-600 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-400">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => openTaskModal(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {userCanDelete ? (
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span
                                  className="p-1.5 rounded-lg text-slate-600 inline-block"
                                  title="Cannot delete tasks of others"
                                >
                                  <Lock className="w-3.5 h-3.5 inline" />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REAL-TIME TEAM CHAT */}
      {activeTab === 'chat' && (
        <TeamChat
          teamId={teamId}
          currentUser={user}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          broadcastNewMessage={broadcastNewMessage}
          broadcastTyping={broadcastTyping}
          isConnected={isConnected}
          incomingMessage={liveIncomingMessage}
        />
      )}

      {/* TAB 3: MEMBER MANAGEMENT & ADVANCED RBAC */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Team Members & Permissions</h2>
              <p className="text-slate-400 text-xs">
                Manage member access, roles (Owner, Admin, Member), and invitations
              </p>
            </div>
            {canManageMembers && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="divide-y divide-white/5">
              {team.members.map((member) => {
                const isMemberOwner = member.role === 'OWNER';
                const isMemberAdmin = member.role === 'ADMIN';
                const isSelf = member.user.id === user?.id;

                // Who can remove this member:
                // - Self can always leave (unless self is Owner)
                // - Owner can remove anyone except self
                // - Admin can remove Members only (cannot remove Owner or Admins)
                let canRemove = false;
                if (isSelf && !isMemberOwner) canRemove = true;
                else if (isOwner && !isMemberOwner) canRemove = true;
                else if (isAdmin && member.role === 'MEMBER') canRemove = true;

                return (
                  <div
                    key={member.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center uppercase shadow-md shadow-indigo-500/10">
                        {(member.user.name || member.user.email).charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white text-sm">
                            {member.user.name || member.user.email.split('@')[0]}
                          </h4>
                          {isSelf && (
                            <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                              You
                            </span>
                          )}
                          <RoleBadge role={member.role} />
                        </div>
                        <p className="text-slate-400 text-xs">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Role Dropdown (Owner can promote/demote or transfer ownership) */}
                      {isOwner && !isSelf ? (
                        <div className="flex items-center space-x-1.5 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs">
                          <span className="text-[10px] text-slate-500 font-medium">Role:</span>
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.user.id, e.target.value)}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer [&>option]:text-slate-900 [&>option]:bg-white"
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OWNER">Transfer Owner</option>
                          </select>
                        </div>
                      ) : null}

                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>

                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isSelf ? 'Leave Team' : 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL / ACTIVITY LOG */}
      {activeTab === 'activity' && <ActivityLogList teamId={teamId} />}

      {/* Task Modal (Create & Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {editingTask ? 'Update task details and assignees' : 'Add a task to this team workspace'}
            </p>

            {taskFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {taskFormError}
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket, Fix Login Bug..."
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Task instructions, links, or notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Assignee
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {team.members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name || m.user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {taskSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Invite Member</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter the email of a registered user to add them to this team workspace.
            </p>

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Member Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              {isOwner && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Initial Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 [&>option]:text-slate-900 [&>option]:bg-white"
                  >
                    <option value="MEMBER">Member (Standard access)</option>
                    <option value="ADMIN">Admin (Can manage tasks & members)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Add Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Delete Team Modal (Owner Only) */}
      {showEditTeamModal && isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Team Settings (Owner)</h2>
            <p className="text-slate-400 text-sm mb-6">
              Update team details or permanently delete the workspace.
            </p>

            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Team</span>
                </button>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditTeamModal(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTeam}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    {savingTeam ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Matrix Modal */}
      <RolePermissionsModal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
      />

      {/* Floating Real-time Update Toasts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-4 flex items-start space-x-3 ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 border-rose-500/40 text-rose-300'
                : 'bg-slate-900/95 border-indigo-500/40 text-indigo-300'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white mb-0.5">{toast.title}</h5>
              <p className="text-xs text-slate-300 leading-snug">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
