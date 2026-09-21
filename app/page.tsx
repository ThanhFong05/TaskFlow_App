"use client";

import { useState, useEffect } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  // Create Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [error, setError] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, status }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setStatus("To Do");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      alert("Title is required");
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => filter === "All" || t.status === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-12 pb-6">
        <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl drop-shadow-sm">
          Supercharge your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">productivity</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          The elegant, public task board for everyone. Add, edit, or track tasks in real-time without the hassle of logging in.
        </p>
      </div>

      {/* Create Task Card */}
      <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-black/40 border border-white/5 p-8 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
          <span className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mr-4 text-sm shadow-inner">✨</span>
          Create New Task
        </h2>
        
        <form onSubmit={handleCreate} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Task Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full rounded-2xl border-white/10 bg-slate-950/50 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-100 sm:text-base px-5 py-4 border outline-none transition-all duration-300 placeholder-slate-600 shadow-inner"
              placeholder="What needs to be done?"
            />
            {error && <p className="mt-2 text-sm font-medium text-rose-400 flex items-center"><svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>{error}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-2xl border-white/10 bg-slate-950/50 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-100 sm:text-base px-5 py-4 border outline-none transition-all duration-300 h-32 resize-none placeholder-slate-600 shadow-inner"
              placeholder="Add details, notes, or links..."
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 pt-2">
            <div className="w-full sm:w-2/5">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
              <div className="relative group">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full rounded-2xl border-white/10 bg-slate-950/50 focus:bg-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-200 sm:text-base px-5 py-4 border outline-none transition-all duration-300 appearance-none cursor-pointer shadow-inner"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-500 group-hover:text-slate-300 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex justify-center items-center py-4 px-10 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] text-base font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              Add Task <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Task List Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Your Tasks</h2>
          <div className="flex items-center space-x-3 bg-slate-900/50 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5 shadow-lg">
            <span className="text-sm font-semibold text-slate-400 pl-4">Filter:</span>
            <div className="relative group">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border-transparent bg-transparent hover:bg-white/5 focus:bg-slate-800 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm px-4 py-2 outline-none transition-colors appearance-none cursor-pointer font-bold text-slate-200 pr-10"
              >
                <option value="All">All Tasks</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 group-hover:text-slate-300 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 rounded-[2rem] border border-white/5 border-dashed">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-6"></div>
            <p className="text-indigo-300/70 font-medium animate-pulse tracking-wide">Fetching your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 backdrop-blur-sm rounded-[2rem] border border-white/5 border-dashed transition-all hover:bg-slate-900/50">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
              <svg className="h-12 w-12 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No tasks found</h3>
            <p className="text-slate-400 max-w-sm text-center leading-relaxed">It looks a little empty here. Get started by creating a new task above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-slate-900/60 backdrop-blur-xl rounded-[1.5rem] border border-white/5 p-6 transition-all duration-300 hover:bg-slate-800/80 hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {editingId === task.id ? (
                  <div className="space-y-4 w-full animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="block w-full rounded-xl border-indigo-500/50 bg-slate-950 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 text-white sm:text-lg font-semibold px-5 py-3 outline-none transition-all shadow-inner"
                      placeholder="Task title"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="block w-full rounded-xl border-white/10 bg-slate-950/50 focus:bg-slate-950 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 text-slate-300 sm:text-base px-5 py-4 resize-none h-24 outline-none transition-all shadow-inner"
                      placeholder="Task description"
                    />
                    <div className="flex space-x-3 justify-end pt-2">
                      <button onClick={cancelEditing} className="px-6 py-2.5 text-sm font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5">Cancel</button>
                      <button onClick={() => saveEdit(task.id)} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] rounded-xl transition-all">Save Changes</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-bold transition-colors duration-300 ${task.status === 'Done' ? 'text-slate-500 line-through decoration-slate-600' : 'text-white group-hover:text-indigo-100'}`}>
                          {task.title}
                        </h3>
                        {task.status === 'Done' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Done</span>
                        )}
                      </div>
                      {task.description && (
                        <p className={`text-base mt-2 leading-relaxed ${task.status === 'Done' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="mt-5 flex items-center text-xs font-semibold text-slate-500 bg-slate-950/50 inline-flex px-3 py-1.5 rounded-lg border border-white/5">
                        <svg className="w-4 h-4 mr-2 text-indigo-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center sm:flex-col sm:items-end gap-4 mt-4 sm:mt-0">
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`rounded-xl px-5 py-2.5 text-sm font-bold border transition-all ${
                            task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 
                            task.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : 
                            'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
                          } focus:outline-none focus:ring-4 focus:ring-slate-700 cursor-pointer appearance-none text-center pr-10 shadow-sm`}
                        >
                          <option value="To Do" className="bg-slate-900">To Do</option>
                          <option value="In Progress" className="bg-slate-900">In Progress</option>
                          <option value="Done" className="bg-slate-900">Done</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 ${
                            task.status === 'Done' ? 'text-emerald-500' : 
                            task.status === 'In Progress' ? 'text-amber-500' : 
                            'text-slate-400'
                          }`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/5 p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg translate-y-2 sm:translate-y-0 sm:translate-x-2 group-hover:translate-x-0 group-hover:translate-y-0">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 p-2.5 rounded-lg transition-all"
                          title="Edit task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <div className="w-px h-5 bg-white/10 mx-1"></div>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2.5 rounded-lg transition-all"
                          title="Delete task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
