import { useSyncExternalStore } from "react";
import { BUILT_IN_EXERCISES, type Exercise } from "./exercises";

export type SetEntry = { id: string; kg: string; reps: string; done: boolean };
export type WorkoutExercise = { uid: string; exerciseId: string; name: string; muscle: string; sets: SetEntry[] };
export type Routine = { id: string; name: string; exerciseIds: string[]; setCounts?: Record<string, number>; createdAt: number; updatedAt: number };
export type ActiveWorkout = { id: string; name: string; routineId: string | null; startedAt: number; exercises: WorkoutExercise[] };
export type SessionSet = { kg: number; reps: number; done: boolean };
export type Session = {
  id: string;
  name: string;
  routineId: string | null;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  exercises: { exerciseId: string; name: string; muscle: string; sets: SessionSet[] }[];
};
export type AppState = { routines: Routine[]; customExercises: Exercise[]; history: Session[]; active: ActiveWorkout | null };

const KEY = "stayconsistent:v1";
const EMPTY: AppState = { routines: [], customExercises: [], history: [], active: null };

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const arr = <T,>(v: unknown, ok: (x: any) => boolean): T[] => (Array.isArray(v) ? (v.filter(ok) as T[]) : []);

export function parseState(raw: string | null): AppState {
  if (!raw) return EMPTY;
  try {
    const d = JSON.parse(raw) ?? {};
    const active =
      d.active && typeof d.active.startedAt === "number" && Array.isArray(d.active.exercises)
        ? {
            ...d.active,
            exercises: arr<WorkoutExercise>(d.active.exercises, (e) => e && typeof e.exerciseId === "string").map((e) => ({
              ...e,
              sets: arr<SetEntry>(e.sets, (s) => s && typeof s.id === "string").map((s) => ({
                id: s.id,
                kg: String(s.kg ?? ""),
                reps: String(s.reps ?? ""),
                done: !!s.done,
              })),
            })),
          }
        : null;
    return {
      routines: arr<Routine>(d.routines, (r) => r && typeof r.id === "string" && Array.isArray(r.exerciseIds)),
      customExercises: arr<Exercise>(d.customExercises, (e) => e && typeof e.id === "string" && typeof e.name === "string"),
      history: arr<Session>(d.history, (s) => s && typeof s.id === "string" && Array.isArray(s.exercises)),
      active,
    };
  } catch {
    return EMPTY;
  }
}

let state: AppState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = parseState(window.localStorage.getItem(KEY));
}

function setState(fn: (s: AppState) => AppState) {
  ensureLoaded();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = parseState(e.newValue);
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state;
    },
    () => EMPTY,
  );
}

export const allExercises = (s: AppState) => [...BUILT_IN_EXERCISES, ...s.customExercises];
export const findExercise = (s: AppState, id: string) => allExercises(s).find((e) => e.id === id);

// ---------- validation ----------
export function isValidKg(v: string) {
  if (v.trim() === "") return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}
export function isValidReps(v: string) {
  if (v.trim() === "") return false;
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
}
export const isSetComplete = (s: SetEntry) => s.done && isValidKg(s.kg) && isValidReps(s.reps);
export function countIncompleteSets(w: ActiveWorkout) {
  return w.exercises.reduce((n, e) => n + e.sets.filter((s) => !isSetComplete(s)).length, 0);
}

// ---------- previous performance ----------
export function getPrevious(history: Session[], exerciseId: string): SessionSet[] | null {
  const sorted = [...history].sort((a, b) => b.finishedAt - a.finishedAt);
  for (const s of sorted) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) return ex.sets.filter((x) => x.done);
  }
  return null;
}

// ---------- actions ----------
export const DEFAULT_PLANNED_SETS = 3;
/** Planned sets for an exercise in a routine; legacy routines without counts default to 3. */
export function plannedSets(r: { setCounts?: Record<string, number> | undefined }, exerciseId: string) {
  const n = r.setCounts?.[exerciseId];
  return typeof n === "number" && Number.isInteger(n) && n >= 1 ? Math.min(n, 50) : DEFAULT_PLANNED_SETS;
}
const newSet = (): SetEntry => ({ id: uid(), kg: "", reps: "", done: false });

export const actions = {
  saveRoutine(r: { id?: string | undefined; name: string; exerciseIds: string[]; setCounts?: Record<string, number> }): string {
    const setCounts = Object.fromEntries(r.exerciseIds.map((x) => [x, plannedSets(r, x)]));
    const id = r.id ?? uid();
    const now = Date.now();
    setState((s) => {
      const exists = s.routines.some((x) => x.id === id);
      return {
        ...s,
        routines: exists
          ? s.routines.map((x) => (x.id === id ? { ...x, name: r.name, exerciseIds: r.exerciseIds, setCounts, updatedAt: now } : x))
          : [...s.routines, { id, name: r.name, exerciseIds: r.exerciseIds, setCounts, createdAt: now, updatedAt: now }],
      };
    });
    return id;
  },
  deleteRoutine(id: string) {
    setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }));
  },
  saveCustomExercise(e: { id?: string | undefined; name: string; muscle: string; equipment: string }): string {
    const id = e.id ?? `c-${uid()}`;
    setState((s) => {
      const ex: Exercise = { id, name: e.name, muscle: e.muscle, equipment: e.equipment, custom: true };
      const exists = s.customExercises.some((x) => x.id === id);
      return {
        ...s,
        customExercises: exists ? s.customExercises.map((x) => (x.id === id ? ex : x)) : [...s.customExercises, ex],
      };
    });
    return id;
  },
  deleteCustomExercise(id: string) {
    // History keeps its own snapshot, so it is untouched.
    setState((s) => ({
      ...s,
      customExercises: s.customExercises.filter((e) => e.id !== id),
      routines: s.routines.map((r) => ({ ...r, exerciseIds: r.exerciseIds.filter((x) => x !== id) })),
    }));
  },
  startWorkout(routineId: string | null) {
    setState((s) => {
      const routine = routineId ? s.routines.find((r) => r.id === routineId) : undefined;
      const exercises: WorkoutExercise[] = (routine?.exerciseIds ?? [])
        .map((id) => findExercise(s, id))
        .filter((e): e is Exercise => !!e)
        .map((e) => {
          const prev = getPrevious(s.history, e.id) ?? [];
          const count = plannedSets(routine!, e.id);
          return {
            uid: uid(),
            exerciseId: e.id,
            name: e.name,
            muscle: e.muscle,
            sets: Array.from({ length: count }, (_, i) => {
              const p = prev[i];
              return { ...newSet(), kg: p ? String(p.kg) : "", reps: p ? String(p.reps) : "" };
            }),
          };
        });
      return {
        ...s,
        active: { id: uid(), name: routine?.name ?? "Quick Workout", routineId: routine?.id ?? null, startedAt: Date.now(), exercises },
      };
    });
  },
  updateActive(fn: (w: ActiveWorkout) => ActiveWorkout) {
    setState((s) => (s.active ? { ...s, active: fn(s.active) } : s));
  },
  addExerciseToActive(e: Exercise) {
    actions.updateActive((w) => ({
      ...w,
      exercises: [...w.exercises, { uid: uid(), exerciseId: e.id, name: e.name, muscle: e.muscle, sets: [newSet()] }],
    }));
  },
  addSet(exUid: string) {
    actions.updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e) => (e.uid === exUid ? { ...e, sets: [...e.sets, newSet()] } : e)),
    }));
  },
  updateSet(exUid: string, setId: string, patch: Partial<SetEntry>) {
    actions.updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.uid === exUid ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e,
      ),
    }));
  },
  removeSet(exUid: string, setId: string) {
    actions.updateActive((w) => ({
      ...w,
      exercises: w.exercises.map((e) => (e.uid === exUid ? { ...e, sets: e.sets.filter((s) => s.id !== setId) } : e)),
    }));
  },
  removeActiveExercise(exUid: string) {
    actions.updateActive((w) => ({ ...w, exercises: w.exercises.filter((e) => e.uid !== exUid) }));
  },
  discardWorkout() {
    setState((s) => ({ ...s, active: null }));
  },
  /** Returns false when the workout is not valid to finish. */
  finishWorkout(): boolean {
    ensureLoaded();
    const w = state.active;
    if (!w || countIncompleteSets(w) > 0 || !w.exercises.some((e) => e.sets.length > 0)) return false;
    const finishedAt = Date.now();
    const session: Session = {
      id: uid(),
      name: w.name,
      routineId: w.routineId,
      startedAt: w.startedAt,
      finishedAt,
      durationMs: Math.max(0, finishedAt - w.startedAt),
      exercises: w.exercises
        .filter((e) => e.sets.length > 0)
        .map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          muscle: e.muscle,
          sets: e.sets.map((s) => ({ kg: Number(s.kg), reps: Number(s.reps), done: s.done })),
        })),
    };
    setState((s) => ({ ...s, active: null, history: [session, ...s.history] }));
    return true;
  },
  deleteSession(id: string) {
    setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
  },
};

// ---------- formatting ----------
export function formatDuration(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
export function formatDurationWords(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "< 1 min";
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}
export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
