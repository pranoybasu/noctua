"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGitHub = async () => {
    setLoading(true);
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  const handleDemo = async () => {
    setLoading(true);
    await signIn("credentials", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-noctua-purple-light via-white to-white dark:from-noctua-purple-dark dark:via-gray-950 dark:to-gray-950">
      <div className="w-full max-w-md p-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to home
        </Link>

        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-noctua-purple flex items-center justify-center text-3xl">
            🦉
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to Noctua
          </h1>
          <p className="text-sm text-muted-foreground">
            AI-powered PR intelligence that watches your codebase while you
            sleep.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGitHub}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {loading ? "Redirecting..." : "Continue with GitHub"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-noctua-lavender text-noctua-indigo hover:bg-noctua-purple-light dark:border-noctua-purple dark:text-noctua-lavender dark:hover:bg-noctua-purple-dark transition-colors text-sm font-medium disabled:opacity-50"
          >
            <span className="text-base">🦉</span>
            Enter Demo Mode
          </button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Noctua requests read access to your repos and PRs. No code is stored.
        </p>
      </div>
    </div>
  );
}
