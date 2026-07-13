"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMessagesAction, sendMessageAction } from "@/app/actions/messages";
import { uploadAttachment } from "@/app/actions/attachments";
import { AttachmentLink } from "@/components/AttachmentLink";

interface ChatPanelProps {
  projectId: string;
  currentUserId: string;
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

export function ChatPanel({ projectId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch initial messages on load
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

  // 2. Subscribe to Supabase Realtime postgres_changes
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
          // Refetch messages to get unified DB states (including relation selects)
          await loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // 3. Send message handler
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
      setInputText(text); // Restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  // 4. File Attachment Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);

      // Upload file to Supabase Storage
      const attachment = await uploadAttachment(data);

      // Instantly post a message referencing this attachment
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

  return (
    <div className="flex flex-col bg-zinc-900/20 border border-zinc-800 rounded-2xl h-[550px] overflow-hidden">
      {/* Chat panel Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Project Discussion</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Live updates enabled via Supabase Realtime</p>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center text-zinc-500 py-10">
            <svg className="w-8 h-8 text-zinc-700 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs font-semibold">Start the conversation</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">Send a message or upload files below.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.sender.id === currentUserId;
            return (
              <div key={message.id} className={`flex items-start space-x-3.5 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse space-x-reverse" : ""}`}>
                {/* Initials avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${isMe ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {(message.sender.name || message.sender.email).charAt(0).toUpperCase()}
                </div>
                
                {/* Text Bubble */}
                <div className="space-y-1">
                  <div className={`flex items-center space-x-2 text-[10px] ${isMe ? "justify-end space-x-reverse" : ""}`}>
                    <span className="font-semibold text-zinc-300">
                      {isMe ? "You" : message.sender.name || "Client"}
                    </span>
                    <span className="text-zinc-500 font-medium">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? "bg-violet-600/10 border border-violet-500/20 text-zinc-200 rounded-tr-none"
                      : "bg-zinc-900 border border-zinc-800/80 text-zinc-300 rounded-tl-none"
                  }`}>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    
                    {/* Render attached files if any */}
                    {message.attachment && (
                      <div className="mt-3.5 pt-3.5 border-t border-zinc-850/60 max-w-[280px]">
                        <AttachmentLink
                          id={message.attachment.id}
                          fileName={message.attachment.fileName}
                          sizeBytes={message.attachment.sizeBytes}
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
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/10">
        <form onSubmit={handleSend} className="flex items-center space-x-3.5">
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
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            title="Upload file"
          >
            {isUploading ? (
              <span className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin block" />
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
            placeholder="Type your message here..."
            className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-violet-500 text-zinc-200 text-xs rounded-xl px-4 py-3 outline-none transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all shrink-0 cursor-pointer disabled:opacity-40"
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
