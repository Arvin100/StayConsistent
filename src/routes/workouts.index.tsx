import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { actions, findExercise, useAppState, type Routine } from "@/lib/store";

export const Route = createFileRoute("/workouts/")({
  head: () => ({
    meta: [
      { title: "Workouts — StayConsistent" },
      { name: "description", content: "Create, edit and start your workout routines." },
      { property: "og:title", content: "Workouts — StayConsistent" },
      { property: "og:description", content: "Create, edit and start your workout routines." },
    ],
  }),
  component: Workouts,
});

function Workouts() {
  const state = useAppState();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<Routine | null>(null);
  const [replace, setReplace] = useState<null | { routineId: string | null }>(null);

  const start = (routineId: string | null) => {
    if (state.active) return setReplace({ routineId });
    actions.startWorkout(routineId);
    navigate({ to: "/workout" });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
        <Button asChild><Link to="/workouts/$id" params={{ id: "new" }}><Plus className="h-4 w-4" /> New Routine</Link></Button>
      </div>

      <button type="button" onClick={() => start(null)} className="mt-6 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left">
        <span>
          <span className="block font-semibold">Start Empty Workout</span>
          <span className="block text-sm text-muted-foreground">Build a workout from scratch as you go.</span>
        </span>
        <Play className="h-5 w-5" />
      </button>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">My Routines</h2>
      {state.routines.length === 0 ? (
        <p className="mt-3 rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No routines yet. Create one like Push, Pull or Legs.
        </p>
      ) : (
        <ul className="mt-3 divide-y border-y">
          {state.routines.map((r) => {
            const names = r.exerciseIds.map((id) => findExercise(state, id)?.name).filter(Boolean);
            return (
              <li key={r.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to="/workouts/$id" params={{ id: r.id }} className="min-w-0">
                    <div className="font-semibold">{r.name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {names.length ? names.join(", ") : "No exercises yet"}
                    </div>
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <Button asChild size="icon" variant="ghost" aria-label={`Edit ${r.name}`}>
                      <Link to="/workouts/$id" params={{ id: r.id }}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button size="icon" variant="ghost" aria-label={`Delete ${r.name}`} onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                {names.length > 0 && (
                  <Button className="mt-3 w-full sm:w-auto" onClick={() => start(r.id)}><Play className="h-4 w-4" /> Start Workout</Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>The routine is removed. Your completed workout history stays.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) actions.deleteRoutine(toDelete.id); setToDelete(null); toast.success("Routine deleted"); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!replace} onOpenChange={(o) => !o && setReplace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>A workout is already in progress</AlertDialogTitle>
            <AlertDialogDescription>Continue your current workout, or discard it and start a new one.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate({ to: "/workout" })}>Continue Current</AlertDialogCancel>
            <AlertDialogAction onClick={() => { actions.startWorkout(replace?.routineId ?? null); setReplace(null); navigate({ to: "/workout" }); }}>Discard & Start New</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
