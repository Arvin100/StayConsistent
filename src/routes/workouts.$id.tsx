import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Play, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExercisePicker } from "@/components/ExercisePicker";
import { actions, findExercise, plannedSets, useAppState } from "@/lib/store";

export const Route = createFileRoute("/workouts/$id")({
  head: () => ({
    meta: [
      { title: "Edit Routine — StayConsistent" },
      { name: "description", content: "Name your routine and arrange its exercises." },
      { property: "og:title", content: "Edit Routine — StayConsistent" },
      { property: "og:description", content: "Name your routine and arrange its exercises." },
    ],
  }),
  component: RoutineEditor,
});

function RoutineEditor() {
  const { id } = Route.useParams();
  const state = useAppState();
  const navigate = useNavigate();
  const routine = id === "new" ? undefined : state.routines.find((r) => r.id === id);
  const [name, setName] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [init, setInit] = useState(false);
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (init) return;
    if (routine) { setName(routine.name); setIds(routine.exerciseIds); setCounts(Object.fromEntries(routine.exerciseIds.map((x) => [x, plannedSets(routine, x)]))); setInit(true); }
    else if (id === "new") setInit(true);
  }, [routine, id, init]);

  const visible = ids.filter((x) => findExercise(state, x));
  const dirty = !routine || routine.name !== name.trim() || routine.exerciseIds.join() !== visible.join() || visible.some((x) => plannedSets(routine, x) !== plannedSets({ setCounts: counts }, x));
  const setCount = (x: string, n: number) => setCounts((c) => ({ ...c, [x]: Math.max(1, Math.min(50, n)) }));

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= visible.length) return;
    const n = [...visible];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setIds(n);
  };

  const save = () => {
    if (!name.trim()) { toast.error("Give your routine a name"); return null; }
    const rid = actions.saveRoutine({ id: routine?.id, name: name.trim(), exerciseIds: visible, setCounts: counts });
    toast.success("Routine saved");
    if (!routine) navigate({ to: "/workouts/$id", params: { id: rid }, replace: true });
    return rid;
  };

  const start = () => {
    const rid = dirty ? save() : routine!.id;
    if (!rid) return;
    if (state.active) { toast.error("Finish or discard your current workout first"); navigate({ to: "/workout" }); return; }
    actions.startWorkout(rid);
    navigate({ to: "/workout" });
  };

  if (id !== "new" && !routine) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">This routine could not be found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/workouts">Back to Workouts</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/workouts" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Workouts</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">{routine ? "Edit Routine" : "New Routine"}</h1>

      <div className="mt-5 space-y-1">
        <Label htmlFor="r-name">Routine name</Label>
        <Input id="r-name" placeholder="e.g. Push, Pull, Legs" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Exercises ({visible.length})</h2>
        <Button onClick={() => setPicker(true)}><Plus className="h-4 w-4" /> Add Exercise</Button>
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 rounded-lg border p-6 text-center text-sm text-muted-foreground">No exercises yet. Tap Add Exercise to begin.</p>
      ) : (
        <ol className="mt-3 divide-y border-y">
          {visible.map((x, i) => {
            const e = findExercise(state, x)!;
            return (
              <li key={x} className="py-3">
               <div className="flex items-center gap-2">
                <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.muscle}</div>
                </div>
                <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === visible.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Remove ${e.name}`} onClick={() => setIds(visible.filter((y) => y !== x))}><X className="h-4 w-4" /></Button>
               </div>
               <ul className="ml-8 mt-2 space-y-1">
                 {Array.from({ length: plannedSets({ setCounts: counts }, x) }).map((_, si, all) => (
                   <li key={si} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                     <span>Set {si + 1}</span>
                     <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remove set ${si + 1} of ${e.name}`} disabled={all.length <= 1} onClick={() => setCount(x, all.length - 1)}><X className="h-3.5 w-3.5" /></Button>
                   </li>
                 ))}
               </ul>
               <Button variant="ghost" size="sm" className="ml-8 mt-1" onClick={() => setCount(x, plannedSets({ setCounts: counts }, x) + 1)}><Plus className="h-4 w-4" /> Add Set</Button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={save} disabled={!dirty}>Save Routine</Button>
        {visible.length > 0 && <Button onClick={start}><Play className="h-4 w-4" /> Start Workout</Button>}
      </div>

      <ExercisePicker
        open={picker}
        onOpenChange={setPicker}
        selectedIds={visible}
        onSelect={(e) => setIds((p) => (p.includes(e.id) ? p : [...p, e.id]))}
      />
    </div>
  );
}
