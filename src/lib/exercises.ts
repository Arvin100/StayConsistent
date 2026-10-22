export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  custom?: boolean;
};

export const MUSCLE_GROUPS = [
  "Abdominals",
  "Biceps",
  "Chest",
  "Lats",
  "Shoulders",
  "Traps",
  "Lower Back",
  "Triceps",
  "Upper Back",
  "Abductors",
  "Adductors",
  "Calves",
  "Glutes",
  "Hamstrings",
  "Quadriceps",
] as const;

const RAW: Record<(typeof MUSCLE_GROUPS)[number], string[]> = {
  Abdominals: ["Crunch (Machine)", "Cable Crunch", "Hanging Leg Raises", "Leg Raise (Parallel Bars)", "Sit-Up"],
  Biceps: ["Preacher Curl (Machine)", "Seated Incline Curl (Dumbbell)", "Hammer Curl (Cable)", "Bicep Curl (Barbell)", "Spider Curl (Dumbbell)"],
  Chest: ["Butterfly (Pec Deck)", "Incline Chest Press (Machine)", "Chest Press (Machine)", "Bench Press (Machine)", "Cable Fly Crossovers"],
  Lats: ["Lat Pulldown (Cable)", "Pull-Up (Weighted)", "Rope Straight-Arm Pulldown", "Iso-Lateral High Row (Machine)", "Dumbbell Row"],
  Shoulders: ["Seated Shoulder Press (Machine)", "Lateral Raise (Dumbbell)", "Rear Delt Reverse Fly (Machine)", "Single-Arm Lateral Raise (Cable)", "Shoulder Press (Dumbbell)"],
  Traps: ["Shrug (Barbell)", "Shrug (Cable)", "Shrug (Dumbbell)", "Shrug (Machine)", "Shrug (Smith Machine)"],
  "Lower Back": ["Back Extension (Hyperextension)", "Back Extension (Machine)"],
  Triceps: ["Overhead Triceps Extension (Cable)", "Triceps Pushdown", "Seated Dip Machine", "Single-Arm Triceps Pushdown (Cable)", "Skull Crusher (Barbell)"],
  "Upper Back": ["Chest-Supported T-Bar Row", "Iso-Lateral Row (Machine)", "Bent-Over Row (Barbell)", "Iso-Lateral Low Row", "Seated Cable Row"],
  Abductors: ["Hip Abduction (Cable)", "Hip Abduction (Machine)"],
  Adductors: ["Hip Adduction (Cable)", "Hip Adduction (Machine)"],
  Calves: ["Calf Extension (Machine)", "Seated Calf Raise", "Standing Calf Raise (Machine)"],
  Glutes: ["Deadlift (Barbell)", "Hip Thrust", "Standing Cable Glute Kickbacks"],
  Hamstrings: ["Romanian Deadlift (Dumbbell)", "Seated Leg Curl (Machine)", "Lying Leg Curl (Machine)"],
  Quadriceps: ["Bulgarian Split Squat (Dumbbell)", "Hack Squat (Machine)", "Leg Press (Machine)", "Squat (Barbell)", "Walking Lunge", "Leg Extension (Machine)"],
};

function equipmentOf(name: string): string {
  const g = name.match(/\(([^)]+)\)/)?.[1];
  if (g && /Machine|Cable|Dumbbell|Barbell|Smith Machine|Weighted|Pec Deck|Parallel Bars/.test(g)) return g;
  if (/Cable|Rope|Pushdown/.test(name)) return "Cable";
  if (/Dumbbell/.test(name)) return "Dumbbell";
  if (/Machine|Row|Press/.test(name)) return "Machine";
  return "Bodyweight";
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const BUILT_IN_EXERCISES: Exercise[] = MUSCLE_GROUPS.flatMap((muscle) =>
  RAW[muscle].map((name) => ({ id: `b-${slug(name)}`, name, muscle, equipment: equipmentOf(name) })),
);

export function filterExercises(list: Exercise[], search: string, muscle: string): Exercise[] {
  const q = search.trim().toLowerCase();
  return list.filter(
    (e) =>
      (muscle === "" || e.muscle === muscle) &&
      (q === "" || e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q)),
  );
}
