import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Dumbbell, History, Timer } from "lucide-react";
import { formatDuration, useAppState } from "@/lib/store";
import { useNow } from "@/lib/use-now";

function ActiveBar() {
  const { active } = useAppState();
  const now = useNow(!!active);
  if (!active) return null;
  return (
    <Link
      to="/workout"
      className="flex items-center justify-between gap-3 border-b bg-primary px-4 py-2.5 text-sm text-primary-foreground"
    >
      <span className="flex items-center gap-2 font-medium">
        <Timer className="h-4 w-4" /> Active Workout in Progress
      </span>
      <span className="tabular-nums">{formatDuration(now - active.startedAt)}</span>
    </Link>
  );
}

const tab = "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground border-b-2 border-transparent";
const tabActive = { className: "text-foreground border-foreground" };

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const onWorkout = pathname === "/workout";
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background">
        {!onWorkout && <ActiveBar />}
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4">
          <Link to="/" className="py-3 text-base font-extrabold tracking-tight">StayConsistent</Link>
          <nav className="flex gap-1">
            <Link to="/" className={tab} activeOptions={{ exact: true }} activeProps={tabActive}><History className="h-4 w-4 text-accent-purple" aria-hidden />Home</Link>
            <Link to="/workouts" className={tab} activeProps={tabActive}><Dumbbell className="h-4 w-4 text-accent-purple" aria-hidden />Workouts</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
