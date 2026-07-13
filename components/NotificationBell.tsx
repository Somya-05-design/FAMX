"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/app/actions/notifications";
import Link from "next/link";

interface NotificationBellProps {
  userId: string;
}

interface Notification {
  id: string;
  type: string;
  projectId: string | null;
  read: boolean;
  createdAt: Date;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    loadNotifications();
  }, [userId]);

  // Realtime Postgres Changes Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`user-notifications:${userId}`)
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Helper to format messages and links dynamically on client side
  const getNotificationDetails = (n: Notification) => {
    const isAdminPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
    const adminPath = n.projectId ? `/admin/projects/${n.projectId}` : "/admin";
    const clientPath = n.projectId ? `/projects/${n.projectId}` : "/overview";

    switch (n.type) {
      case "NEW_PROJECT_SUBMITTED":
        return {
          message: "New project request submitted by client.",
          linkUrl: adminPath,
        };
      case "QUOTE_RECEIVED":
        return {
          message: "A binding quote has been issued for your project.",
          linkUrl: clientPath,
        };
      case "PAYMENT_REQUESTED":
        return {
          message: "A new payment request has been issued.",
          linkUrl: clientPath,
        };
      case "PAYMENT_SUCCEEDED":
        return {
          message: "Project payment has succeeded.",
          linkUrl: isAdminPortal ? adminPath : clientPath,
        };
      case "NEW_MESSAGE":
        return {
          message: "New message posted in project chat.",
          linkUrl: isAdminPortal ? adminPath : clientPath,
        };
      default:
        return {
          message: "Notification update on project.",
          linkUrl: isAdminPortal ? adminPath : clientPath,
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer select-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-xl overflow-hidden z-50 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/20">
            <span className="text-xs font-bold text-zinc-300">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-900/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs leading-relaxed">
                <svg className="w-6 h-6 text-zinc-850 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { message, linkUrl } = getNotificationDetails(n);
                return (
                  <div
                    key={n.id}
                    className={`p-4 transition-colors flex justify-between items-start space-x-3 hover:bg-zinc-900/30 ${
                      !n.read ? "bg-violet-950/5" : ""
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      {linkUrl ? (
                        <Link
                          href={linkUrl}
                          onClick={() => {
                            handleMarkAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="text-xs text-zinc-300 hover:text-violet-400 transition-colors leading-relaxed block font-medium"
                        >
                          {message}
                        </Link>
                      ) : (
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                          {message}
                        </p>
                      )}
                      <span className="text-[9px] text-zinc-500 block font-semibold">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="w-2 h-2 bg-violet-500 rounded-full shrink-0 mt-1 cursor-pointer"
                        title="Mark as read"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
