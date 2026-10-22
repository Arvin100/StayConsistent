import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MUSCLE_GROUPS, filterExercises, type Exercise } from "@/lib/exercises";
import { actions, allExercises, useAppState } from "@/lib/store";

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ExercisePicker({
  open, onOpenChange, selectedIds, onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedIds: string[];
  onSelect: (e: Exercise) => void;
}) {
  const state = useAppState();
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [form, setForm] = useState<null | { id?: string | undefined; name: string; muscle: string; equipment: string }>(null);
  const [toDelete, setToDelete] = useState<Exercise | null>(null);

  const results = useMemo(() => filterExercises(allExercises(state), search, muscle), [state, search, muscle]);

  const saveForm = () => {
    if (!form || !form.name.trim() || !form.muscle) return;
    actions.saveCustomExercise({ ...form, name: form.name.trim(), equipment: form.equipment.trim() || "None" });
    setForm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-lg">
          <DialogHeader className="border-b p-4 text-left">
            <div className="flex items-center justify-between gap-2 pr-6">
              <DialogTitle>Add Exercise</DialogTitle>
              <Button size="sm" variant="outline" onClick={() => setForm({ name: "", muscle: muscle || "", equipment: "" })}>
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
            <DialogDescription className="sr-only">Search and filter the exercise library.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 border-b p-4">
            <div className="space-y-1">
              <Label htmlFor="ex-search">Search Exercise</Label>
              <Input id="ex-search" placeholder="Search Exercise" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ex-muscle">Muscle group</Label>
              <select id="ex-muscle" className={selectCls} value={muscle} onChange={(e) => setMuscle(e.target.value)}>
                <option value="">All Muscles</option>
                {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {results.length} {results.length === 1 ? "exercise" : "exercises"}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setMuscle(""); }}>Clear Filters</Button>
                <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>Show Results</Button>
              </div>
            </div>
          </div>

          <ul className="flex-1 divide-y overflow-y-auto">
            {results.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">No exercises match.</li>}
            {results.map((e) => {
              const added = selectedIds.includes(e.id);
              return (
                <li key={e.id} className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onSelect(e)}
                    className="flex flex-1 items-center justify-between gap-3 text-left disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-medium">{e.name}</span>
                      <span className="block text-xs text-muted-foreground">{e.muscle} · {e.equipment}{e.custom ? " · Custom" : ""}</span>
                    </span>
                    {added ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-4 w-4" /> Added</span>
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {e.custom && (
                    <>
                      <Button size="icon" variant="ghost" aria-label={`Edit ${e.name}`} onClick={() => setForm({ id: e.id, name: e.name, muscle: e.muscle, equipment: e.equipment })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label={`Delete ${e.name}`} onClick={() => setToDelete(e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit Exercise" : "Create Exercise"}</DialogTitle>
            <DialogDescription>Custom exercises appear in the library and can be used in any routine.</DialogDescription>
          </DialogHeader>
          {form && (
            <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); saveForm(); }}>
              <div className="space-y-1">
                <Label htmlFor="cx-name">Exercise name</Label>
                <Input id="cx-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cx-muscle">Muscle group</Label>
                <select id="cx-muscle" required className={selectCls} value={form.muscle} onChange={(e) => setForm({ ...form, muscle: e.target.value })}>
                  <option value="" disabled>Select a muscle group</option>
                  {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cx-eq">Required equipment</Label>
                <Input id="cx-eq" placeholder="e.g. Dumbbell, Cable, None" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
                <Button type="submit" disabled={!form.name.trim() || !form.muscle}>Save</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the library and your routines. Past workout history is kept unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (toDelete) actions.deleteCustomExercise(toDelete.id); setToDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
