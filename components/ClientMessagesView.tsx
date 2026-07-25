"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction, deleteNotificationAction } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: string;
  projectId: string | null;
  message?: string | null;
  read: boolean;
  createdAt: Date | string;
}

interface ClientMessagesViewProps {
  initialNotifications: Notification[];
  userId: string;
}

export function ClientMessagesView({ initialNotifications, userId }: ClientMessagesViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    try {
      const data = await getNotificationsAction();
      setNotifications(data as any);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Real-time Postgres changes subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`client-messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        async () => {
          await loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteNotificationAction(id);
    } catch (err) {
      console.error("Failed to delete notification", err);
      await loadNotifications();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Messages & Notifications</h1>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">
            Project updates, quote status changes, and chat activity alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 border border-primary/20 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Messages List Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-outline">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high text-outline mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-on-surface">No messages yet</h3>
            <p className="text-xs text-on-surface-variant mt-1">You will receive notifications here when there are updates on your projects.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {notifications.map((n) => {
              const linkUrl = n.projectId ? `/projects/${n.projectId}` : "/overview";
              const displayMessage = n.message || "Notification update on project";

              return (
                <div
                  key={n.id}
                  className={`p-5 transition-colors flex justify-between items-center space-x-4 hover:bg-surface-container-low/50 ${
                    !n.read ? "bg-inverse-primary/10" : ""
                  }`}
                >
                  <div className="flex items-start space-x-4 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary" : "bg-outline-variant"}`} />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={linkUrl}
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-sm font-bold text-on-surface hover:text-primary transition-colors block truncate"
                      >
                        {displayMessage}
                      </Link>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {n.projectId && (
                      <Link
                        href={linkUrl}
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold text-on-surface border border-outline-variant/60 transition-all cursor-pointer shadow-xs"
                      >
                        View Project
                      </Link>
                    )}
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="p-2 text-outline hover:text-error transition-colors rounded-xl border border-outline-variant hover:border-error/40 hover:bg-error/5 cursor-pointer shrink-0"
                      title="Delete notification"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
