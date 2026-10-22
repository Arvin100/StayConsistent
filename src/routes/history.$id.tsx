import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { actions, formatDate, formatDurationWords, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history/$id")({
  head: () => ({
    meta: [
      { title: "Workout details — StayConsistent" },
      { name: "description", content: "Every exercise, set, weight and rep from a completed workout." },
      { property: "og:title", content: "Workout details — StayConsistent" },
      { property: "og:description", content: "Every exercise, set, weight and rep from a completed workout." },
    ],
  }),
  component: SessionDetail,
});

function SessionDetail() {
  const { id } = Route.useParams();
  const { history } = useAppState();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const s = history.find((h) => h.id === id);

  if (!s) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">This workout could not be found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/">Back to Home</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Home</Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{s.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(s.finishedAt)} · {formatDurationWords(s.durationMs)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
      </div>

      <div className="mt-6 space-y-6">
        {s.exercises.map((e, i) => (
          <section key={i} className="border-t pt-4">
            <h2 className="font-semibold">{e.name}</h2>
            <p className="text-xs text-muted-foreground">{e.muscle}</p>
            <table className="mt-2 w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-1 font-medium">Set</th><th className="font-medium">KG</th><th className="font-medium">Reps</th><th className="w-10 font-medium" /></tr>
              </thead>
              <tbody>
                {e.sets.map((x, j) => (
                  <tr key={j} className="border-t">
                    <td className="py-2">{j + 1}</td><td>{x.kg}</td><td>{x.reps}</td>
                    <td>
                      <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded border", x.done ? "border-success bg-success text-success-foreground" : "border-input")} aria-label={x.done ? "Completed" : "Not completed"}>
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the session from your history. Your routines and custom exercises are not affected, but the
              “Previous” values shown in future workouts may change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { actions.deleteSession(s.id); toast.success("Workout deleted"); navigate({ to: "/" }); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
