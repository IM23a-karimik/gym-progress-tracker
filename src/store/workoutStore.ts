import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActiveSession,
  DayOfWeek,
  DayPresets,
  Exercise,
  ExerciseLibraryItem,
  Log,
  MuscleCategory,
  WorkoutPlan,
  WorkoutSet,
} from '../types/workout';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** Every day starts out with these three presets, matching the product spec. */
export const DEFAULT_PRESETS = ['Standard', 'With Abs', 'Heavy Power'] as const;

/** Display order for muscle-category sections in the Add Exercise modal. */
export const CATEGORY_ORDER: MuscleCategory[] = ['Chest', 'Back', 'Legs', 'Abs', 'Shoulders'];

const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 10;

/** Static catalog of exercises a user can pick from, grouped by category. */
export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  // Chest
  { id: 'lib-chest-1', name: 'Barbell Bench Press', category: 'Chest' },
  { id: 'lib-chest-2', name: 'Incline Dumbbell Press', category: 'Chest' },
  { id: 'lib-chest-3', name: 'Cable Fly', category: 'Chest' },
  { id: 'lib-chest-4', name: 'Push-Up', category: 'Chest' },
  { id: 'lib-chest-5', name: 'Dips', category: 'Chest' },
  // Back
  { id: 'lib-back-1', name: 'Deadlift', category: 'Back' },
  { id: 'lib-back-2', name: 'Pull-Up', category: 'Back' },
  { id: 'lib-back-3', name: 'Barbell Row', category: 'Back' },
  { id: 'lib-back-4', name: 'Lat Pulldown', category: 'Back' },
  { id: 'lib-back-5', name: 'Seated Cable Row', category: 'Back' },
  // Legs
  { id: 'lib-legs-1', name: 'Barbell Back Squat', category: 'Legs' },
  { id: 'lib-legs-2', name: 'Romanian Deadlift', category: 'Legs' },
  { id: 'lib-legs-3', name: 'Leg Press', category: 'Legs' },
  { id: 'lib-legs-4', name: 'Walking Lunge', category: 'Legs' },
  { id: 'lib-legs-5', name: 'Leg Curl', category: 'Legs' },
  // Abs
  { id: 'lib-abs-1', name: 'Hanging Leg Raise', category: 'Abs' },
  { id: 'lib-abs-2', name: 'Cable Crunch', category: 'Abs' },
  { id: 'lib-abs-3', name: 'Plank', category: 'Abs' },
  { id: 'lib-abs-4', name: 'Russian Twist', category: 'Abs' },
  { id: 'lib-abs-5', name: 'Ab Wheel Rollout', category: 'Abs' },
  // Shoulders
  { id: 'lib-shoulders-1', name: 'Overhead Press', category: 'Shoulders' },
  { id: 'lib-shoulders-2', name: 'Lateral Raise', category: 'Shoulders' },
  { id: 'lib-shoulders-3', name: 'Face Pull', category: 'Shoulders' },
  { id: 'lib-shoulders-4', name: 'Rear Delt Fly', category: 'Shoulders' },
  { id: 'lib-shoulders-5', name: 'Arnold Press', category: 'Shoulders' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createEmptyPresets = (): DayPresets =>
  DEFAULT_PRESETS.reduce<DayPresets>((acc, presetName) => {
    acc[presetName] = [];
    return acc;
  }, {});

const createDefaultPlan = (): WorkoutPlan =>
  DAYS.reduce((plan, day) => {
    plan[day] = {
      day,
      presets: createEmptyPresets(),
    };
    return plan;
  }, {} as WorkoutPlan);

let exerciseIdCounter = 0;
const generateExerciseId = (): string => {
  exerciseIdCounter += 1;
  return `exercise-${Date.now()}-${exerciseIdCounter}`;
};

let setIdCounter = 0;
const generateSetId = (): string => {
  setIdCounter += 1;
  return `set-${Date.now()}-${setIdCounter}`;
};

/** Formats a numeric weight for display, dropping a trailing ".0". */
export const formatWeight = (weight: number): string => {
  if (Number.isNaN(weight)) return '';
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1).replace(/\.0$/, '');
};

interface LogSetResult {
  success: boolean;
  exerciseCompleted: boolean;
  workoutCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface WorkoutStoreState {
  /** The full week of workout days, each holding its own named presets. */
  plan: WorkoutPlan;
  /** Which day the Dashboard is currently viewing/editing. */
  selectedDay: DayOfWeek;
  /** Which preset of `selectedDay` is currently active/visible. Defaults to "Standard". */
  currentPreset: string;
  /** The in-progress workout, or null when nothing is being logged. */
  activeSession: ActiveSession | null;
  /** exerciseId -> the most recent logged result per set index, used for
   *  "ghost" placeholders on the next time that exercise is logged. */
  history: Record<string, Log[]>;

  // --- Dashboard / planning actions -----------------------------------

  /** Switch the active day. Keeps the current preset if it exists on the new
   *  day, otherwise falls back to that day's first available preset. */
  setSelectedDay: (day: DayOfWeek) => void;

  /** Instantly swap which preset's exercises are visible. */
  setCurrentPreset: (presetName: string) => void;

  /** Create a new, empty preset on a given day. */
  addPreset: (day: DayOfWeek, presetName: string) => void;

  /** Delete a preset from a given day (falls back to another preset if the
   *  removed one was active). */
  removePreset: (day: DayOfWeek, presetName: string) => void;

  /** Inject a library exercise into a specific day + preset. */
  addExerciseToPreset: (
    day: DayOfWeek,
    presetName: string,
    libraryItem: ExerciseLibraryItem,
    targetSets?: number,
    targetReps?: number
  ) => void;

  /** Remove a single exercise from a specific day + preset. */
  removeExerciseFromPreset: (day: DayOfWeek, presetName: string, exerciseId: string) => void;

  /** Non-reactive convenience snapshot getters (safe to call from event
   *  handlers / other screens; do NOT use inside a component render body,
   *  use the `useWorkoutStore(selector)` hook there instead so React
   *  re-renders on change). */
  getPresetsForDay: (day: DayOfWeek) => string[];
  getExercisesForActivePreset: () => Exercise[];

  // --- Active workout / logging actions --------------------------------

  /** Snapshot a day + preset into a fresh `activeSession`, seeding one
   *  WorkoutSet per exercise's targetSets. Returns false (and does nothing)
   *  if that preset has no exercises to log. */
  startWorkout: (day: DayOfWeek, presetName: string) => boolean;

  /** Read-model for ActiveWorkoutScreen: the current session's title +
   *  exercise list, or null if nothing is active. */
  getActiveWorkout: () => { title: string; exercises: Exercise[] } | null;

  /** Update the live text of a set's weight/reps field while typing. */
  updateSetField: (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) => void;

  /** Append a new, empty set row to an exercise in the active session. */
  addSet: (exerciseId: string) => void;

  /** Remove a set row from an exercise (a session always keeps at least one). */
  removeSet: (exerciseId: string, setId: string) => void;

  /** Confirm a set: falls back to the ghost weight/reps if the fields were
   *  left blank, marks it completed, records it into `history`, and advances
   *  `currentExerciseIndex` to the next exercise with incomplete sets. */
  logSet: (exerciseId: string, setId: string) => LogSetResult;

  /** First not-yet-completed set id for an exercise, or null. */
  getNextIncompleteSetId: (exerciseId: string) => string | null;

  /** Previously logged weight/reps for a given exercise + set index. */
  getGhostForSetIndex: (exerciseId: string, index: number) => Log | null;

  /** Clear the active session (used when exiting/finishing a workout). */
  resetActiveWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      plan: createDefaultPlan(),
      selectedDay: 'Monday',
      currentPreset: 'Standard',
      activeSession: null,
      history: {},

      // --- Dashboard / planning actions ---------------------------------

      setSelectedDay: (day) => {
        set((state) => {
          const presetsForDay = Object.keys(state.plan[day].presets);
          const nextPreset = presetsForDay.includes(state.currentPreset)
            ? state.currentPreset
            : presetsForDay[0] ?? 'Standard';
          return { selectedDay: day, currentPreset: nextPreset };
        });
      },

      setCurrentPreset: (presetName) => {
        set({ currentPreset: presetName });
      },

      addPreset: (day, presetName) => {
        const trimmed = presetName.trim();
        if (trimmed.length === 0) return;
        set((state) => {
          const dayData = state.plan[day];
          if (dayData.presets[trimmed]) return state;
          return {
            plan: {
              ...state.plan,
              [day]: {
                ...dayData,
                presets: {
                  ...dayData.presets,
                  [trimmed]: [],
                },
              },
            },
          };
        });
      },

      removePreset: (day, presetName) => {
        set((state) => {
          const dayData = state.plan[day];
          const nextPresets: DayPresets = {};
          Object.keys(dayData.presets).forEach((name) => {
            if (name !== presetName) {
              nextPresets[name] = dayData.presets[name];
            }
          });
          const hasRemaining = Object.keys(nextPresets).length > 0;
          const finalPresets = hasRemaining ? nextPresets : createEmptyPresets();
          const fallbackPreset = Object.keys(finalPresets)[0] ?? 'Standard';

          return {
            plan: {
              ...state.plan,
              [day]: {
                ...dayData,
                presets: finalPresets,
              },
            },
            currentPreset:
              state.selectedDay === day && state.currentPreset === presetName
                ? fallbackPreset
                : state.currentPreset,
          };
        });
      },

      addExerciseToPreset: (
        day,
        presetName,
        libraryItem,
        targetSets = DEFAULT_TARGET_SETS,
        targetReps = DEFAULT_TARGET_REPS
      ) => {
        set((state) => {
          const dayData = state.plan[day];
          const existing = dayData.presets[presetName] ?? [];
          const newExercise: Exercise = {
            id: generateExerciseId(),
            name: libraryItem.name,
            category: libraryItem.category,
            targetSets,
            targetReps,
          };
          return {
            plan: {
              ...state.plan,
              [day]: {
                ...dayData,
                presets: {
                  ...dayData.presets,
                  [presetName]: [...existing, newExercise],
                },
              },
            },
          };
        });
      },

      removeExerciseFromPreset: (day, presetName, exerciseId) => {
        set((state) => {
          const dayData = state.plan[day];
          const existing = dayData.presets[presetName] ?? [];
          return {
            plan: {
              ...state.plan,
              [day]: {
                ...dayData,
                presets: {
                  ...dayData.presets,
                  [presetName]: existing.filter((exercise) => exercise.id !== exerciseId),
                },
              },
            },
          };
        });
      },

      getPresetsForDay: (day) => Object.keys(get().plan[day].presets),

      getExercisesForActivePreset: () => {
        const { plan, selectedDay, currentPreset } = get();
        return plan[selectedDay]?.presets[currentPreset] ?? [];
      },

      // --- Active workout / logging actions ------------------------------

      startWorkout: (day, presetName) => {
        const exercises = get().plan[day]?.presets[presetName] ?? [];
        if (exercises.length === 0) return false;

        const exerciseSets: Record<string, WorkoutSet[]> = {};
        exercises.forEach((exercise) => {
          const setCount = Math.max(exercise.targetSets, 1);
          exerciseSets[exercise.id] = Array.from({ length: setCount }, () => ({
            id: generateSetId(),
            weight: '',
            reps: '',
            isCompleted: false,
          }));
        });

        set({
          activeSession: {
            day,
            presetName,
            exercises,
            exerciseSets,
            currentExerciseIndex: 0,
            completed: false,
          },
        });
        return true;
      },

      getActiveWorkout: () => {
        const { activeSession } = get();
        if (!activeSession) return null;
        return {
          title: `${activeSession.day} · ${activeSession.presetName}`,
          exercises: activeSession.exercises,
        };
      },

      updateSetField: (exerciseId, setId, field, value) => {
        set((state) => {
          if (!state.activeSession) return state;
          const sets = state.activeSession.exerciseSets[exerciseId] ?? [];
          const nextSets = sets.map((setItem) =>
            setItem.id === setId ? { ...setItem, [field]: value } : setItem
          );
          return {
            activeSession: {
              ...state.activeSession,
              exerciseSets: {
                ...state.activeSession.exerciseSets,
                [exerciseId]: nextSets,
              },
            },
          };
        });
      },

      addSet: (exerciseId) => {
        set((state) => {
          if (!state.activeSession) return state;
          const sets = state.activeSession.exerciseSets[exerciseId] ?? [];
          const newSet: WorkoutSet = {
            id: generateSetId(),
            weight: '',
            reps: '',
            isCompleted: false,
          };
          return {
            activeSession: {
              ...state.activeSession,
              exerciseSets: {
                ...state.activeSession.exerciseSets,
                [exerciseId]: [...sets, newSet],
              },
            },
          };
        });
      },

      removeSet: (exerciseId, setId) => {
        set((state) => {
          if (!state.activeSession) return state;
          const sets = state.activeSession.exerciseSets[exerciseId] ?? [];
          if (sets.length <= 1) return state;
          return {
            activeSession: {
              ...state.activeSession,
              exerciseSets: {
                ...state.activeSession.exerciseSets,
                [exerciseId]: sets.filter((setItem) => setItem.id !== setId),
              },
            },
          };
        });
      },

      logSet: (exerciseId, setId) => {
        const state = get();
        const { activeSession } = state;
        if (!activeSession) {
          return { success: false, exerciseCompleted: false, workoutCompleted: false };
        }

        const sets = activeSession.exerciseSets[exerciseId] ?? [];
        const setIndex = sets.findIndex((setItem) => setItem.id === setId);
        const currentSet = sets[setIndex];
        if (!currentSet || currentSet.isCompleted) {
          return { success: false, exerciseCompleted: false, workoutCompleted: false };
        }

        const ghost = state.getGhostForSetIndex(exerciseId, setIndex);
        const weightText =
          currentSet.weight.trim().length > 0
            ? currentSet.weight.trim()
            : ghost
              ? formatWeight(ghost.weight)
              : '';
        const repsText =
          currentSet.reps.trim().length > 0
            ? currentSet.reps.trim()
            : ghost
              ? String(ghost.reps)
              : '';

        const weightValue = parseFloat(weightText);
        const repsValue = parseInt(repsText, 10);

        if (
          weightText.length === 0 ||
          repsText.length === 0 ||
          Number.isNaN(weightValue) ||
          Number.isNaN(repsValue)
        ) {
          return { success: false, exerciseCompleted: false, workoutCompleted: false };
        }

        const updatedSets = sets.map((setItem, index) =>
          index === setIndex
            ? { ...setItem, weight: weightText, reps: repsText, isCompleted: true }
            : setItem
        );
        const exerciseCompleted = updatedSets.every((setItem) => setItem.isCompleted);

        const nextExerciseSets: Record<string, WorkoutSet[]> = {
          ...activeSession.exerciseSets,
          [exerciseId]: updatedSets,
        };
        const workoutCompleted = activeSession.exercises.every((exercise) =>
          (nextExerciseSets[exercise.id] ?? []).every((setItem) => setItem.isCompleted)
        );

        let nextExerciseIndex = activeSession.currentExerciseIndex;
        if (exerciseCompleted) {
          const currentIdx = activeSession.exercises.findIndex((ex) => ex.id === exerciseId);
          for (let i = currentIdx + 1; i < activeSession.exercises.length; i += 1) {
            const candidate = activeSession.exercises[i];
            const candidateSets = nextExerciseSets[candidate.id] ?? [];
            if (candidateSets.some((setItem) => !setItem.isCompleted)) {
              nextExerciseIndex = i;
              break;
            }
          }
        }

        set((s) => {
          if (!s.activeSession) return s;
          const historyForExercise = [...(s.history[exerciseId] ?? [])];
          historyForExercise[setIndex] = { weight: weightValue, reps: repsValue };

          return {
            activeSession: {
              ...s.activeSession,
              exerciseSets: nextExerciseSets,
              currentExerciseIndex: nextExerciseIndex,
              completed: workoutCompleted,
            },
            history: {
              ...s.history,
              [exerciseId]: historyForExercise,
            },
          };
        });

        return { success: true, exerciseCompleted, workoutCompleted };
      },

      getNextIncompleteSetId: (exerciseId) => {
        const { activeSession } = get();
        if (!activeSession) return null;
        const sets = activeSession.exerciseSets[exerciseId] ?? [];
        const next = sets.find((setItem) => !setItem.isCompleted);
        return next ? next.id : null;
      },

      getGhostForSetIndex: (exerciseId, index) => {
        const entry = get().history[exerciseId]?.[index];
        return entry ?? null;
      },

      resetActiveWorkout: () => {
        set({ activeSession: null });
      },
    }),
    {
      name: 'gym-progress-tracker-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
      // No `partialize` needed: JSON.stringify already drops the function
      // (action) properties automatically, so `plan`, `selectedDay`,
      // `currentPreset`, `activeSession`, and `history` are what persist —
      // which conveniently means an in-progress workout survives an app
      // restart too.
    }
  )
);
