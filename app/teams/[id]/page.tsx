'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
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
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);

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
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit team form
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

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

  const isOwner = team?.currentUserRole === 'OWNER' || team?.ownerId === user?.id;

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

      setShowTaskModal(false);
      setTaskSubmitting(false);
      fetchTeam();
    } catch (err: any) {
      setTaskFormError(err.message || 'Error saving task');
      setTaskSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    const canDelete =
      isOwner ||
      task.creatorId === user?.id ||
      task.assigneeId === user?.id;

    if (!canDelete) {
      alert('Only the task creator, assignee, or team owner can delete this task.');
      return;
    }

    if (!confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
      else {
        const data = await res.json();
        alert(data.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Failed to add member');
        setInviting(false);
        return;
      }

      setInviteSuccess(`Successfully added ${inviteEmail}!`);
      setInviteEmail('');
      setInviting(false);
      fetchTeam();
      setTimeout(() => setShowMemberModal(false), 1200);
    } catch (err: any) {
      setInviteError(err.message || 'Error adding member');
      setInviting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from this team?`)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTeam();
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
    if (!confirm(`Are you SURE you want to delete this team? All its tasks will be removed.`)) return;
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
        <p className="text-slate-400 font-medium">Loading workspace...</p>
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
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <Link
            href="/teams"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Teams
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {team.name}
            </h1>
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                team.currentUserRole === 'OWNER'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{team.currentUserRole}</span>
            </span>
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

          {isOwner && (
            <>
              <button
                onClick={() => setShowMemberModal(true)}
                className="flex items-center space-x-2 bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Invite Member</span>
              </button>
              <button
                onClick={() => setShowEditTeamModal(true)}
                className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title="Team settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Tabs & Counters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2 bg-slate-900/60 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasks ({team.tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({team.members.length})</span>
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

      {/* Tab 1: TASKS SECTION */}
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
                  <option value="All" className="text-slate-900 bg-white">All</option>
                  <option value="To Do" className="text-slate-900 bg-white">To Do</option>
                  <option value="In Progress" className="text-slate-900 bg-white">In Progress</option>
                  <option value="Done" className="text-slate-900 bg-white">Done</option>
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
                  <option value="All" className="text-slate-900 bg-white">All</option>
                  <option value="Low" className="text-slate-900 bg-white">Low</option>
                  <option value="Medium" className="text-slate-900 bg-white">Medium</option>
                  <option value="High" className="text-slate-900 bg-white">High</option>
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
                  <option value="All" className="text-slate-900 bg-white">All</option>
                  <option value="Unassigned" className="text-slate-900 bg-white">Unassigned</option>
                  {team.members.map((m) => (
                    <option key={m.user.id} value={m.user.id} className="text-slate-900 bg-white">
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
                          const canDelete =
                            isOwner ||
                            task.creatorId === user?.id ||
                            task.assigneeId === user?.id;

                          return (
                            <div
                              key={task.id}
                              className="bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 shadow-lg hover:shadow-indigo-500/5 transition-all group relative"
                            >
                              {/* Card Header: Badges & Actions */}
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
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteTask(task)}
                                      className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                      title="Delete Task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
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

          {/* List / Table View */}
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
                        const canDelete =
                          isOwner ||
                          task.creatorId === user?.id ||
                          task.assigneeId === user?.id;

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
                                <option value="To Do" className="text-slate-900 bg-white">To Do</option>
                                <option value="In Progress" className="text-slate-900 bg-white">In Progress</option>
                                <option value="Done" className="text-slate-900 bg-white">Done</option>
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
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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

      {/* Tab 2: MEMBERS SECTION */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Team Members</h2>
              <p className="text-slate-400 text-xs">Users who have access to this team and its tasks</p>
            </div>
            {isOwner && (
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
                return (
                  <div
                    key={member.id}
                    className="p-5 flex items-center justify-between hover:bg-white/[0.01] transition-colors"
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
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isMemberOwner
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'bg-slate-800 text-slate-300 border border-white/5'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => handleRemoveMember(member.user.id, member.user.email)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
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

      {/* Task Modal (Create & Edit) */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
                  placeholder="e.g. Design Landing Page, Fix Bug..."
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
                    <option value="To Do" className="text-slate-900 bg-white">To Do</option>
                    <option value="In Progress" className="text-slate-900 bg-white">In Progress</option>
                    <option value="Done" className="text-slate-900 bg-white">Done</option>
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
                    <option value="Low" className="text-slate-900 bg-white">Low</option>
                    <option value="Medium" className="text-slate-900 bg-white">Medium</option>
                    <option value="High" className="text-slate-900 bg-white">High</option>
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
                    <option value="" className="text-slate-900 bg-white">Unassigned</option>
                    {team.members.map((m) => (
                      <option key={m.user.id} value={m.user.id} className="text-slate-900 bg-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Invite Member</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter the email of a registered user to add them to this team.
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

      {/* Edit / Delete Team Modal */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-white mb-2">Team Settings</h2>
            <p className="text-slate-400 text-sm mb-6">
              Update team details or delete the team permanently.
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
    </div>
  );
}
