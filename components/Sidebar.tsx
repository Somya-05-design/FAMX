"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { getNotificationsAction } from "@/app/actions/notifications";

interface SidebarProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
    id: string;
  };
  services?: { id: string; name: string }[];
  initialUnreadCount?: number;
}

export function Sidebar({ user, services = [], initialUnreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isAdmin = user.role === "ADMIN";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const activeCategory = searchParams.get("category") || "ALL";
  const viewParam = searchParams.get("view") || "board";

  // Sync initial unread count prop changes
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  // Real-time unread notification badge updates
  useEffect(() => {
    if (!isAdmin) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`sidebar-unread-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${user.id}`,
        },
        async () => {
          try {
            const data = await getNotificationsAction();
            const count = data.filter((n) => !n.read).length;
            setUnreadCount(count);
          } catch (err) {
            console.error("Failed to load notifications count in Sidebar", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, isAdmin]);

  const clientLinks = [
    {
      label: "Overview",
      href: "/overview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      label: "My Projects",
      href: "/projects",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: "Messages",
      href: "/messages",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Admin functional navigation links
  const adminLinks = [
    {
      label: "Board",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      href: "/admin?view=notifications",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  // Admin visual placeholder links to match reference mockup
  const adminPlaceholders = [
    {
      label: "Reports",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Invoice",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Archive",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
  ];

  const getCategoryColorClass = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes("web")) return "bg-blue-500";
    if (norm.includes("graphic")) return "bg-sky-500";
    if (norm.includes("ui") || norm.includes("ux")) return "bg-purple-500";
    if (norm.includes("brand")) return "bg-emerald-500";
    if (norm.includes("illustr")) return "bg-rose-500";
    return "bg-zinc-400";
  };

  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view"); // switch back to board when filtering category
    if (categoryName === "ALL") {
      params.delete("category");
    } else {
      params.set("category", categoryName);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Theme-specific CSS classes
  const asideClasses = `${isCollapsed ? "w-16" : "w-64"} bg-white text-zinc-900 flex flex-col justify-between border-r border-zinc-200/80 h-screen sticky top-0 transition-all duration-300 ease-in-out`;

  return (
    <aside className={asideClasses}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo block */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200/80 overflow-hidden shrink-0">
          {!isCollapsed && (
            <Link href={isAdmin ? "/admin" : "/overview"} className="flex items-center space-x-2.5 truncate group">
              <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-zinc-900 leading-none">
                  FAMX
                </span>
                <span className="text-[10px] font-medium text-zinc-400 leading-tight mt-0.5">
                  Creative Agency
                </span>
              </div>
            </Link>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-transparent transition-all ${
              isCollapsed ? "mx-auto" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="p-4 space-y-1 shrink-0">
          {(isAdmin ? adminLinks : clientLinks).map((link) => {
            const isNotificationsTab = link.label === "Notifications";
            const isBoardTab = link.label === "Board";

            const isActive = isBoardTab
              ? (pathname === "/admin" && viewParam !== "notifications")
              : isNotificationsTab
                ? (pathname === "/admin" && viewParam === "notifications")
                : pathname === link.href || (pathname.startsWith(link.href + "/") && link.href !== "/admin");
            
            const activeStyle = "bg-[#EBEBF9] text-[#4F46E5] font-bold shadow-xs";
            const inactiveStyle = "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 font-medium";

            return (
              <Link
                key={link.label}
                href={link.href}
                title={isCollapsed ? link.label : undefined}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                  isActive ? activeStyle : inactiveStyle
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <div className={`flex items-center space-x-3 ${isCollapsed ? "justify-center w-full" : ""}`}>
                  <span className="shrink-0">{link.icon}</span>
                  {!isCollapsed && <span>{link.label}</span>}
                </div>
                
                {/* Dynamic Notification Count Badge */}
                {!isCollapsed && isNotificationsTab && unreadCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-600 text-white font-black shrink-0 shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Placeholders for ADMIN role to match mockup visual */}
          {isAdmin &&
            adminPlaceholders.map((link) => (
              <div
                key={link.label}
                title={isCollapsed ? link.label : undefined}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 opacity-60 cursor-not-allowed select-none ${
                  isCollapsed ? "justify-center px-0" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="shrink-0">{link.icon}</span>
                  {!isCollapsed && <span>{link.label}</span>}
                </div>
              </div>
            ))}
        </nav>

        {/* Category List Sidebar Filter (ADMIN only) */}
        {isAdmin && !isCollapsed && services.length > 0 && (
          <div className="px-4 py-2 border-t border-zinc-100 flex-1 flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block mb-3 mt-2">
              PROJECTS
            </span>
            <span className="text-[11px] font-bold text-zinc-400 block mb-2 select-none">
              category
            </span>
            
            <div className="space-y-1 flex-1 overflow-y-auto max-h-[300px]">
              {/* ALL filter selection */}
              <button
                onClick={() => handleCategoryClick("ALL")}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 text-left cursor-pointer ${
                  activeCategory === "ALL" && viewParam !== "notifications"
                    ? "bg-orange-50 text-orange-600 border-l-2 border-orange-500 pl-3"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 border border-zinc-200" />
                <span>All Projects</span>
              </button>

              {/* Individual categories dynamically mapped from DB active services */}
              {services.map((service) => {
                const isSelected = activeCategory === service.name && viewParam !== "notifications";
                
                return (
                  <button
                    key={service.id}
                    onClick={() => handleCategoryClick(service.name)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 text-left cursor-pointer ${
                      isSelected
                        ? "bg-orange-50 text-orange-600 border-l-2 border-orange-500 pl-3"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getCategoryColorClass(service.name)}`} />
                    <span className="truncate">{service.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-200/80 bg-white flex flex-col shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-3 px-1 py-1 mb-3">
              <div className="w-9 h-9 rounded-full bg-zinc-200/80 border border-zinc-300/50 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] font-medium text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-700 transition-all duration-150 cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </form>
          </>
        ) : (
          <>
            <div
              className="w-9 h-9 rounded-full bg-zinc-200/80 border border-zinc-300/50 text-zinc-700 font-bold text-xs flex items-center justify-center shrink-0 mb-3 mx-auto"
              title={`${user.name || "User"} (${user.email})`}
            >
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="Sign Out"
                className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-700 transition-all duration-150 cursor-pointer flex items-center justify-center shrink-0 mx-auto shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
