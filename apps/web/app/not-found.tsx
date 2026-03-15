import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-noctua-purple/10 flex items-center justify-center text-4xl mb-6">
        🦉
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-muted-foreground text-sm max-w-md">
        This page doesn't exist. The owl searched everywhere but couldn't find
        it.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="text-xs px-4 py-2 rounded-md border hover:bg-muted transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="text-xs px-4 py-2 rounded-md bg-noctua-purple text-white hover:bg-noctua-purple/90 transition-colors"
        >
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
