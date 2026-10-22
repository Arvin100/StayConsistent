import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExercisePicker } from "@/components/ExercisePicker";
import { SetCheck } from "@/components/SetCheck";
import {
  actions, countIncompleteSets, formatDuration, getPrevious, isSetComplete, isValidKg, isValidReps, useAppState,
} from "@/lib/store";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Active Workout — StayConsistent" },
      { name: "description", content: "Log your sets, weights and reps as you train." },
      { property: "og:title", content: "Active Workout — StayConsistent" },
      { property: "og:description", content: "Log your sets, weights and reps as you train." },
    ],
  }),
  component: ActiveWorkoutPage,
});

const numCls = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums";

function ActiveWorkoutPage() {
  const { active, history } = useAppState();
  const navigate = useNavigate();
  const now = useNow(!!active);
  const [discard, setDiscard] = useState(false);
  const [warn, setWarn] = useState<null | "incomplete" | "empty">(null);
  const [picker, setPicker] = useState(false);

  if (!active) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">No workout in progress.</p>
        <Button asChild className="mt-4"><Link to="/workouts">Go to Workouts</Link></Button>
      </div>
    );
  }

  const finish = () => {
    const hasSets = active.exercises.some((e) => e.sets.length > 0);
    if (!hasSets) return setWarn("empty");
    if (countIncompleteSets(active) > 0) return setWarn("incomplete");
    if (actions.finishWorkout()) {
      toast.success("Workout saved");
      navigate({ to: "/" });
    }
  };
  const incomplete = countIncompleteSets(active);

  return (
    <div className="-mt-2">
      <div className="flex items-start justify-between gap-3 border-b pb-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Workout</p>
          <h1 className="truncate text-2xl font-bold tracking-tight">{active.name}</h1>
          <p className="mt-1 text-3xl font-semibold tabular-nums" aria-label="Elapsed time">{formatDuration(now - active.startedAt)}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Workout options"><MoreHorizontal className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onSelect={() => setDiscard(true)}>
              <Trash2 className="h-4 w-4" /> Discard Workout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {active.exercises.length === 0 && (
        <p className="mt-6 rounded-lg border p-6 text-center text-sm text-muted-foreground">Add an exercise to get started.</p>
      )}

      <div className="divide-y-8 divide-muted">
        {active.exercises.map((ex) => {
          const prev = getPrevious(history, ex.exerciseId);
          return (
            <section key={ex.uid} className="py-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{ex.name}</h2>
                  <p className="text-xs text-muted-foreground">{ex.muscle}</p>
                </div>
                <Button size="icon" variant="ghost" aria-label={`Remove ${ex.name}`} onClick={() => actions.removeActiveExercise(ex.uid)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="mt-3 overflow-x-auto">
                <div className="min-w-[300px]">
                  <div className="grid grid-cols-[2.25rem_1fr_4.5rem_4rem_2.5rem_2rem] items-center gap-2 px-1 pb-1 text-xs font-semibold uppercase text-muted-foreground">
                    <span>Set</span><span>Previous</span><span className="text-center">KG</span><span className="text-center">Reps</span><span className="text-center">✓</span><span />
                  </div>
                  {ex.sets.map((s, i) => {
                    const p = prev?.[i];
                    const complete = isSetComplete(s);
                    return (
                      <div key={s.id} className={cn("grid grid-cols-[2.25rem_1fr_4.5rem_4rem_2.5rem_2rem] items-center gap-2 rounded-md px-1 py-1", complete && "bg-success/10")}>
                        <span className="text-sm font-semibold">{i + 1}</span>
                        <span className="truncate text-sm text-muted-foreground">{p ? `${p.kg} × ${p.reps}` : "—"}</span>
                        <input
                          type="number" inputMode="decimal" min={0} step="any" aria-label={`Set ${i + 1} weight in kg`}
                          className={cn(numCls, s.kg !== "" && !isValidKg(s.kg) && "border-destructive")}
                          value={s.kg} placeholder={p ? String(p.kg) : ""}
                          onChange={(e) => actions.updateSet(ex.uid, s.id, { kg: e.target.value })}
                        />
                        <input
                          type="number" inputMode="numeric" min={1} step={1} aria-label={`Set ${i + 1} reps`}
                          className={cn(numCls, s.reps !== "" && !isValidReps(s.reps) && "border-destructive")}
                          value={s.reps} placeholder={p ? String(p.reps) : ""}
                          onChange={(e) => actions.updateSet(ex.uid, s.id, { reps: e.target.value })}
                        />
                        <SetCheck done={s.done} label={`Mark set ${i + 1} complete`} onToggle={() => actions.updateSet(ex.uid, s.id, { done: !s.done })} />
                        <button type="button" aria-label={`Delete set ${i + 1}`} onClick={() => actions.removeSet(ex.uid, s.id)} className="inline-flex h-9 w-8 items-center justify-center text-muted-foreground">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => actions.addSet(ex.uid)}><Plus className="h-4 w-4" /> Add Set</Button>
            </section>
          );
        })}
      </div>

      <div className="border-t pt-5">
        <Button className="w-full" onClick={() => setPicker(true)}><Plus className="h-4 w-4" /> Add Exercise</Button>
      </div>

      <div className="mt-8 border-t pt-6">
        {incomplete > 0 && <p className="mb-2 text-center text-sm text-muted-foreground">{incomplete} set{incomplete === 1 ? "" : "s"} still incomplete</p>}
        <Button size="lg" className="h-14 w-full bg-success text-base text-success-foreground hover:bg-success/90" onClick={finish}>Finish Workout</Button>
      </div>

      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        selectedIds={active.exercises.map((e) => e.exerciseId)}
        onSelect={(e) => { actions.addExerciseToActive(e); setPicker(false); }}
      />

      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this workout?</AlertDialogTitle>
            <AlertDialogDescription>Your progress in this session will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Workout</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { actions.discardWorkout(); toast("Workout discarded"); navigate({ to: "/workouts" }); }}>
              Discard Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!warn} onOpenChange={(o) => !o && setWarn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{warn === "empty" ? "Nothing to save yet" : "Some sets are not complete"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {warn === "empty" ? (
                <p>Add at least one exercise with a completed set before finishing.</p>
              ) : (
                <div className="space-y-2">
                  <p>Every set must be completed or deleted before you can finish. You have {incomplete} incomplete set{incomplete === 1 ? "" : "s"}. For each one, either:</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>Enter a valid weight (0 kg is fine) and reps, then tap the checkmark, or</li>
                    <li>Delete the set if you don't want to complete it.</li>
                  </ol>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Back to Workout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
