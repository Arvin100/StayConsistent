import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SetCheck({ done, onToggle, label }: { done: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border",
        done ? "border-success bg-success text-success-foreground" : "border-input bg-background text-foreground",
      )}
    >
      <Check className="h-5 w-5" strokeWidth={3} />
    </button>
  );
}
