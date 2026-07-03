import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DayOfWeek,
  DayPresets,
  Exercise,
  ExerciseLibraryItem,
  MuscleCategory,
  WorkoutPlan,
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

let idCounter = 0;
const generateExerciseId = (): string => {
  idCounter += 1;
  return `exercise-${Date.now()}-${idCounter}`;
};

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
}

export const useWorkoutStore = create<WorkoutStoreState>()(
  persist(
    (set, get) => ({
      plan: createDefaultPlan(),
      selectedDay: 'Monday',
      currentPreset: 'Standard',

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
    }),
    {
      name: 'gym-progress-tracker-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
      // No `partialize` needed: JSON.stringify already drops the function
      // (action) properties automatically, so only `plan`, `selectedDay`,
      // and `currentPreset` ever hit AsyncStorage.
    }
  )
);
