import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatDurationWords, useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — StayConsistent" },
      { name: "description", content: "Your completed workout history on StayConsistent." },
      { property: "og:title", content: "Home — StayConsistent" },
      { property: "og:description", content: "Your completed workout history on StayConsistent." },
    ],
  }),
  component: Home,
});

function Home() {
  const { history } = useAppState();
  const sessions = [...history].sort((a, b) => b.finishedAt - a.finishedAt);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">History</h1>

      {sessions.length === 0 ? (
        <div className="mt-10 rounded-lg border p-10 text-center">
          <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">No workouts yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Finish your first workout and it will show up here.</p>
          <Button asChild className="mt-5"><Link to="/workouts">Go to Workouts</Link></Button>
        </div>
      ) : (
        <ul className="mt-6 divide-y border-y">
          {sessions.map((s) => {
            const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
            return (
              <li key={s.id}>
                <Link to="/history/$id" params={{ id: s.id }} className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(s.finishedAt)} · {formatDurationWords(s.durationMs)} · {sets} sets</div>
                    <ul className="mt-2 space-y-0.5 text-sm">
                      {s.exercises.map((e, i) => (
                        <li key={i} className="truncate">
                          <span className="text-muted-foreground">{e.sets.length} ×</span> {e.name}
                          <span className="text-muted-foreground"> — {e.sets.map((x) => `${x.kg}kg × ${x.reps}`).join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
