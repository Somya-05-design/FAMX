"use client";

import { useState, useRef, useEffect } from "react";
import {
  updateProfileAction,
  uploadAvatarAction,
  removeAvatarAction,
} from "@/app/actions/users";
import { signOut } from "@/app/actions/auth";
import Link from "next/link";

type ThemeMode = "dark" | "light" | "system";

const applyTheme = (mode: ThemeMode) => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

interface ProfileViewProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
    emailNotificationsEnabled: boolean;
    createdAt?: Date | string;
    stripeCustomerId?: string | null;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [name, setName] = useState(user.name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [avatarError, setAvatarError] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    user.emailNotificationsEnabled
  );
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("famx-theme") as ThemeMode) || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("famx-theme", newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const [isPending, setIsPending] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user.role === "ADMIN";

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    try {
      await updateProfileAction(name, emailNotificationsEnabled);
      setStatusMessage({
        type: "success",
        text: "Profile settings updated successfully!",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Please select a valid image file (PNG, JPG, WEBP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        text: "Image file size must be less than 5MB.",
      });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setAvatarError(false);
    setIsAvatarUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadAvatarAction(formData);
      if (res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
      }
      setStatusMessage({
        type: "success",
        text: "Profile picture updated successfully!",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to upload profile picture",
      });
      setAvatarUrl(user.avatarUrl || null);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsAvatarUploading(true);
    setStatusMessage(null);

    try {
      await removeAvatarAction();
      setAvatarUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setStatusMessage({
        type: "success",
        text: "Profile picture removed.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to remove profile picture",
      });
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const initialLetter = (name || user.email).charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Container with Upload Overlay */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-surface-container-high border-2 border-outline-variant text-on-primary font-black text-3xl sm:text-4xl flex items-center justify-center shadow-md shrink-0 overflow-hidden group-hover:border-primary transition-all cursor-pointer focus:outline-none"
                title="Click to edit profile picture"
              >
                {avatarUrl && !avatarError ? (
                  <img
                    src={avatarUrl}
                    alt={name || "User Avatar"}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>{initialLetter}</span>
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold space-y-1">
                  {isAvatarUploading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-[10px]">Change</span>
                    </>
                  )}
                </div>
              </button>
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface-container-lowest"
                title="Active"
              />
            </div>

            {/* Basic Info & Avatar Control Buttons */}
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  {name || "User Profile"}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                  }`}
                >
                  {isAdmin ? "Administrator" : "Client"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-medium">
                {user.email}
              </p>

              {/* Photo Action Buttons */}
              <div className="flex items-center space-x-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAvatarUploading}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-container text-on-primary transition-all cursor-pointer shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isAvatarUploading}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-error transition-all cursor-pointer shadow-xs flex items-center space-x-1 disabled:opacity-50"
                  >
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-on-surface transition-all shrink-0 cursor-pointer shadow-xs flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-xs">
        <h2 className="text-base font-bold text-on-surface mb-6">
          Profile Details
        </h2>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700"
                : "bg-error-container border border-error/30 text-on-error-container"
            }`}
          >
            {statusMessage.type === "success" ? (
              <svg
                className="w-4 h-4 shrink-0 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 shrink-0 text-error"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={isPending}
                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Email Address (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
                />
                <span className="absolute right-3 top-3 text-[10px] bg-surface-container-high text-outline px-2 py-0.5 rounded-md font-semibold">
                  Verified
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Role / Access Level
              </label>
              <input
                type="text"
                value={isAdmin ? "System Administrator" : "Client Account"}
                disabled
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Member Since
              </label>
              <input
                type="text"
                value={formattedDate}
                disabled
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/40 space-y-6">
            <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
              Preferences & Appearance
            </h3>

            {/* Theme Change Toggle */}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-2.5">
                Appearance Theme
              </label>
              <div className="inline-flex p-1 rounded-2xl bg-surface-container-low border border-outline-variant/60 gap-1">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === "light"
                      ? "bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/40"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === "dark"
                      ? "bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/40"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("system")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    theme === "system"
                      ? "bg-surface-container-lowest text-on-surface shadow-xs border border-outline-variant/40"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>System</span>
                </button>
              </div>
            </div>

            <label className="flex items-start space-x-3.5 group cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(e) =>
                  setEmailNotificationsEnabled(e.target.checked)
                }
                disabled={isPending}
                className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <div>
                <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Enable Email Notifications
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Receive email notifications for project updates, status changes, new messages, and billing events.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-6 border-t border-outline-variant/40 flex items-center justify-between">
            <Link
              href={isAdmin ? "/admin" : "/overview"}
              className="text-xs font-semibold text-outline hover:text-on-surface transition-colors"
            >
              ← Back to Dashboard
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
