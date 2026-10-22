import { describe, expect, it } from "vitest";
import { getPrevious, isSetComplete, parseState, type Session } from "@/lib/store";
import { BUILT_IN_EXERCISES, filterExercises } from "@/lib/exercises";

const session = (id: string, finishedAt: number, sets: [number, number][]): Session => ({
  id, name: "X", routineId: null, startedAt: 0, finishedAt, durationMs: 0,
  exercises: [{ exerciseId: "e1", name: "E", muscle: "Chest", sets: sets.map(([kg, reps]) => ({ kg, reps, done: true })) }],
});

describe("rules", () => {
  it("0 kg is a valid weight", () => {
    expect(isSetComplete({ id: "s", kg: "0", reps: "10", done: true })).toBe(true);
  });
  it("set without reps or not checked is incomplete", () => {
    expect(isSetComplete({ id: "s", kg: "20", reps: "", done: true })).toBe(false);
    expect(isSetComplete({ id: "s", kg: "20", reps: "8", done: false })).toBe(false);
  });
  it("previous comes from the most recent session with that exercise", () => {
    const prev = getPrevious([session("a", 1, [[10, 5]]), session("b", 2, [[27, 10]])], "e1");
    expect(prev?.[0]).toEqual({ kg: 27, reps: 10, done: true });
  });
  it("no history gives no previous", () => {
    expect(getPrevious([], "e1")).toBeNull();
  });
  it("library has 61 exercises and counts filter results", () => {
    expect(BUILT_IN_EXERCISES.length).toBe(61);
    expect(filterExercises(BUILT_IN_EXERCISES, "", "Traps").length).toBe(5);
    expect(filterExercises(BUILT_IN_EXERCISES, "shrug", "").length).toBe(5);
  });
  it("corrupted storage falls back to empty", () => {
    expect(parseState("{not json").routines).toEqual([]);
  });
});

describe("routine planned sets", () => {
  it("defaults legacy routines to 3 planned sets and respects saved counts", async () => {
    const { plannedSets } = await import("@/lib/store");
    expect(plannedSets({}, "x")).toBe(3);
    expect(plannedSets({ setCounts: { x: 5 } }, "x")).toBe(5);
  });
});
