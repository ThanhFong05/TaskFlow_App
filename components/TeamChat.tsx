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
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Maximize2,
  X,
  File,
} from 'lucide-react';
import { OnlineUser } from '@/lib/hooks/useTeamRealtime';

export interface ChatMessage {
  id: string;
  content: string;
  teamId: string;
  senderId: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
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

  // File Attachment State
  const [pendingFile, setPendingFile] = useState<{
    url: string;
    name: string;
    type: 'image' | 'file';
    size: number;
  } | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox Preview Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

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
    broadcastTyping(true);

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 2000);
  };

  // Canvas-based Image Compression
  const compressImageWithCanvas = (file: File): Promise<{ url: string; name: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({
              url: e.target?.result as string,
              name: file.name,
              size: file.size,
            });
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          resolve({
            url: compressed,
            name: file.name,
            size: Math.round((compressed.length * 3) / 4),
          });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller file.');
      return;
    }

    setCompressing(true);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageWithCanvas(file);
        setPendingFile({
          url: compressed.url,
          name: compressed.name,
          type: 'image',
          size: compressed.size,
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setPendingFile({
            url: reader.result as string,
            name: file.name,
            type: 'file',
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File compression error:', err);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if ((!content && !pendingFile) || sending || compressing) return;

    setSending(true);
    broadcastTyping(false);

    try {
      const payload: any = {
        content: content || (pendingFile?.type === 'image' ? 'Sent an image' : 'Sent an attachment'),
        fileUrl: pendingFile?.url || null,
        fileName: pendingFile?.name || null,
        fileType: pendingFile?.type || null,
        fileSize: pendingFile?.size || null,
      };

      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        setMessages((prev) => [...prev, savedMessage]);
        broadcastNewMessage(savedMessage);
        setInputValue('');
        setPendingFile(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[680px]">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />

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
              Live collaboration, typing status, presence & file attachments
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
              Be the first to say hello! You can send text messages or attach compressed images and files.
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
                <div className={`max-w-[80%] sm:max-w-[70%] space-y-1.5 ${isMe ? 'text-right' : 'text-left'}`}>
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

                  {/* Bubble Content */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md space-y-2 ${
                      isMe
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-white/5 rounded-tl-none'
                    }`}
                  >
                    {/* Text Message */}
                    {msg.content && (
                      <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {/* Image Attachment with Lightbox */}
                    {msg.fileUrl && msg.fileType === 'image' && (
                      <div className="relative group rounded-xl overflow-hidden border border-white/10 max-w-sm mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.fileUrl}
                          alt={msg.fileName || 'Attached image'}
                          className="w-full max-h-64 object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                          onClick={() =>
                            setLightboxImage({
                              url: msg.fileUrl!,
                              name: msg.fileName || 'image.jpg',
                            })
                          }
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-3 transition-opacity">
                          <button
                            onClick={() =>
                              setLightboxImage({
                                url: msg.fileUrl!,
                                name: msg.fileName || 'image.jpg',
                              })
                            }
                            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                            title="Preview image in Lightbox"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName || 'image.jpg'}
                            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                            title="Download image"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Generic File Attachment */}
                    {msg.fileUrl && msg.fileType === 'file' && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-white/10 mt-2 gap-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                            <File className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate text-white">
                              {msg.fileName || 'Attachment'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatFileSize(msg.fileSize)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={msg.fileUrl}
                          download={msg.fileName || 'file'}
                          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white flex-shrink-0 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
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

      {/* Pending Attachment Preview Bar */}
      {pendingFile && (
        <div className="px-4 py-2 bg-slate-950/80 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {pendingFile.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingFile.url}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate max-w-[200px]">
                {pendingFile.name}
              </p>
              <p className="text-[10px] text-emerald-400">
                {pendingFile.type === 'image' ? 'Canvas compressed' : 'Ready'} •{' '}
                {formatFileSize(pendingFile.size)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setPendingFile(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/5 bg-slate-950/70 flex items-center gap-2"
      >
        {/* Attach File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-colors focus:outline-none"
          title="Attach image or document"
        >
          {compressing ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message or attach a file... (Enter to send)"
          className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <button
          type="submit"
          disabled={(!inputValue.trim() && !pendingFile) || sending || compressing}
          className="p-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-2xl shadow-lg shadow-indigo-600/30 transition-all focus:outline-none"
          title="Send message"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-white/5 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-semibold text-white truncate max-w-md">
                {lightboxImage.name}
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.name}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image View */}
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
