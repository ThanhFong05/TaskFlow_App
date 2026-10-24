'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Loader2,
  Users,
  MessageSquare,
  Circle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { OnlineUser } from '@/lib/hooks/useTeamRealtime';

export interface ChatMessage {
  id: string;
  content: string;
  teamId: string;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface TeamChatProps {
  teamId: string;
  currentUser: {
    id: string;
    name?: string | null;
    email?: string;
  } | null;
  onlineUsers: OnlineUser[];
  typingUsers: string[];
  broadcastNewMessage: (msg: any) => void;
  broadcastTyping: (isTyping: boolean) => void;
  isConnected: boolean;
  incomingMessage?: ChatMessage | null;
}

export default function TeamChat({
  teamId,
  currentUser,
  onlineUsers,
  typingUsers,
  broadcastNewMessage,
  broadcastTyping,
  isConnected,
  incomingMessage,
}: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial message history
  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const res = await fetch(`/api/teams/${teamId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [teamId]);

  // Handle incoming live broadcast message
  useEffect(() => {
    if (incomingMessage && incomingMessage.teamId === teamId) {
      setMessages((prev) => {
        // Prevent duplicate if already added
        if (prev.some((m) => m.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
    }
  }, [incomingMessage, teamId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Notify others that user is typing
    broadcastTyping(true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || sending) return;

    setSending(true);
    // Stop typing broadcast
    broadcastTyping(false);

    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        // Optimistic / Local append
        setMessages((prev) => [...prev, savedMessage]);
        // Broadcast to other team members in real-time
        broadcastNewMessage(savedMessage);
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
      {/* Chat Room Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">Team Chat Room</h3>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                <span>{isConnected ? 'Real-time Live' : 'Connecting...'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live collaboration for all team members
            </p>
          </div>
        </div>

        {/* Online Members Pill List */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Online ({onlineUsers.length}):
          </span>
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {onlineUsers.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic">No one online</span>
            ) : (
              onlineUsers.slice(0, 5).map((u) => (
                <div
                  key={u.userId}
                  className="relative group cursor-pointer"
                  title={`${u.name} (${u.email}) - Online`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-slate-900 text-white text-[10px] font-bold flex items-center justify-center uppercase shadow-sm">
                    {u.name.charAt(0)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
                </div>
              ))
            )}
            {onlineUsers.length > 5 && (
              <span className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 text-[10px] font-semibold text-slate-300 flex items-center justify-center">
                +{onlineUsers.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <span>Loading message history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-white/5 border-dashed rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No messages yet</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Be the first to say hello! Messages appear instantly in real time for everyone online.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const senderName = msg.sender?.name || msg.sender?.email?.split('@')[0] || 'User';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold uppercase shadow-md ${
                    isMe
                      ? 'bg-gradient-to-tr from-indigo-500 to-violet-600 text-white'
                      : 'bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  {senderName.charAt(0)}
                </div>

                {/* Message Bubble Container */}
                <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {/* Sender Name & Time */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
                    <span className="font-semibold text-slate-300">
                      {isMe ? 'You' : senderName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-md ${
                      isMe
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="px-6 py-1.5 text-[11px] text-indigo-400 bg-indigo-950/30 border-t border-indigo-500/10 flex items-center space-x-2 animate-in fade-in">
          <span className="flex space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
          </span>
          <span>
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/5 bg-slate-950/70 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message to your team... (Press Enter to send)"
          className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:hover:from-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 transition-all focus:outline-none"
          title="Send message"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
