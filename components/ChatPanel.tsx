"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessagesAction, sendMessageAction } from "@/app/actions/messages";
import { uploadAttachment } from "@/app/actions/attachments";
import { AttachmentLink } from "@/components/AttachmentLink";

interface ChatPanelProps {
  projectId: string;
  currentUserId: string;
  theme?: "dark" | "light";
}

interface Message {
  id: string;
  body: string | null;
  attachmentId: string | null;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  attachment?: {
    id: string;
    fileName: string;
    sizeBytes: number;
  } | null;
}

export function ChatPanel({ projectId, currentUserId, theme = "dark" }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLight = theme === "light";

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial messages on load
  const loadMessages = async () => {
    try {
      const data = await getMessagesAction(projectId);
      setMessages(data as any);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [projectId]);

  // Scroll on message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to Supabase Realtime postgres_changes
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`project-chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ProjectMessage",
          filter: `projectId=eq.${projectId}`,
        },
        async () => {
          await loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Send message handler
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const text = inputText;
    setInputText("");

    try {
      await sendMessageAction(projectId, text);
    } catch (err: any) {
      alert(err.message || "Failed to send message");
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  // File Attachment Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);

      const attachment = await uploadAttachment(data);
      await sendMessageAction(projectId, `Attached file: ${file.name}`, attachment.id);
    } catch (err: any) {
      alert(err.message || "Failed to upload chat file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const containerClasses = isLight
    ? "flex flex-col bg-white rounded-3xl h-full min-h-[500px] overflow-hidden"
    : "flex flex-col bg-zinc-900/20 border border-zinc-800 rounded-2xl h-[550px] overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Header — Render header only in dark mode or if light panel wrapper doesn't render its own */}
      {!isLight && (
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
          <div>
            <h3 className="text-sm font-bold text-zinc-200">Project Discussion</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Live updates enabled via Supabase Realtime</p>
          </div>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center text-zinc-400 py-12 select-none">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isLight ? "bg-purple-50 text-purple-600" : "bg-zinc-800 text-violet-400"}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className={`text-base font-bold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>Project Discussion</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-[220px]">
              Start the conversation with the project team.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender.id === currentUserId;
            
            const avatarClasses = isMe
              ? isLight ? "bg-purple-600 text-white" : "bg-violet-600 text-white"
              : isLight ? "bg-zinc-200 text-zinc-700" : "bg-zinc-800 text-zinc-300";

            const bubbleClasses = isMe
              ? isLight
                ? "bg-purple-600 text-white rounded-tr-none shadow-sm"
                : "bg-violet-600/10 border border-violet-500/20 text-zinc-200 rounded-tr-none"
              : isLight
                ? "bg-zinc-100 border border-zinc-200/60 text-zinc-800 rounded-tl-none shadow-sm"
                : "bg-zinc-900 border border-zinc-800/80 text-zinc-300 rounded-tl-none";

            return (
              <div key={message.id} className={`flex items-start space-x-3 max-w-[88%] ${isMe ? "ml-auto flex-row-reverse space-x-reverse" : ""}`}>
                {/* Initials avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${avatarClasses}`}>
                  {(message.sender.name || message.sender.email).charAt(0).toUpperCase()}
                </div>
                
                {/* Text Bubble */}
                <div className="space-y-1 min-w-0">
                  <div className={`flex items-center space-x-2 text-[10px] ${isMe ? "justify-end space-x-reverse" : ""}`}>
                    <span className={`font-bold ${isLight ? "text-zinc-600" : "text-zinc-300"}`}>
                      {isMe ? "You" : message.sender.name || "Client"}
                    </span>
                    <span className="text-zinc-400 font-medium">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${bubbleClasses}`}>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    
                    {/* Render attached files if any */}
                    {message.attachment && (
                      <div className="mt-3.5 pt-3.5 border-t border-zinc-200/40 max-w-[280px]">
                        <AttachmentLink
                          id={message.attachment.id}
                          fileName={message.attachment.fileName}
                          sizeBytes={message.attachment.sizeBytes}
                          variant={isLight ? "light" : "dark"}
                        />
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

      {/* Input Footer Area */}
      <div className={`p-4 border-t ${isLight ? "border-zinc-100 bg-zinc-50/50" : "border-zinc-800 bg-zinc-900/10"}`}>
        <form onSubmit={handleSend} className="flex items-center space-x-2.5">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isUploading || isSending}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            className={`p-2.5 rounded-xl border transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-500 hover:text-purple-600 hover:border-purple-300 shadow-sm"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Upload file"
          >
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin block" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="Message team..."
            className={`flex-1 text-xs rounded-xl px-4 py-2.5 outline-none transition-all ${
              isLight
                ? "bg-zinc-100/80 border border-zinc-200/80 focus:border-purple-600 focus:bg-white text-zinc-800 placeholder-zinc-400"
                : "bg-zinc-950 border border-zinc-800 focus:border-violet-500 text-zinc-200"
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className={`p-2.5 rounded-xl text-white font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40 shadow-sm ${
              isLight
                ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
                : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {isSending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
