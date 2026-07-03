import { create } from 'zustand';

export type ExerciseCategory = 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Abs';

export interface PlannedExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  targetSets: string;
  targetReps: string;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  exercises: PlannedExercise[];
}

export interface DayPlan {
  dayOfWeek: string;
  activePresetId: string;
  presets: Record<string, WorkoutPreset>;
}

interface WorkoutStore {
  selectedDay: string;
  days: Record<string, DayPlan>;

  // Backward compatibility layer to prevent logging screen crashes
  currentExercises: PlannedExercise[];

  // Actions
  setSelectedDay: (day: string) => void;
  setActivePreset: (day: string, presetId: string) => void;
  addExerciseToPreset: (day: string, presetId: string, exercise: Omit<PlannedExercise, 'id'>) => void;
  removeExerciseFromPreset: (day: string, presetId: string, exerciseId: string) => void;
  updateExerciseInPreset: (day: string, presetId: string, exerciseId: string, updates: Partial<PlannedExercise>) => void;
  reorderExercise: (day: string, presetId: string, index: number, direction: 'up' | 'down') => void;
}

const DEFAULT_PRESETS: Record<string, WorkoutPreset> = {
  'standard': { id: 'standard', name: 'Standard Workout', exercises: [] },
  'abs_finisher': { id: 'abs_finisher', name: 'With Abs / Core Finisher', exercises: [] },
  'powerlifting': { id: 'powerlifting', name: 'Powerlifting Variant', exercises: [] },
};

const INITIAL_DAYS: Record<string, DayPlan> = {
  'Monday': { dayOfWeek: 'Monday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Tuesday': { dayOfWeek: 'Tuesday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Wednesday': { dayOfWeek: 'Wednesday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Thursday': { dayOfWeek: 'Thursday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Friday': { dayOfWeek: 'Friday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Saturday': { dayOfWeek: 'Saturday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
  'Sunday': { dayOfWeek: 'Sunday', activePresetId: 'standard', presets: JSON.parse(JSON.stringify(DEFAULT_PRESETS)) },
};

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  selectedDay: 'Monday',
  days: INITIAL_DAYS,
  currentExercises: [],

  setSelectedDay: (day) => {
    set({ selectedDay: day });
    const activePresetId = get().days[day].activePresetId;
    set({ currentExercises: get().days[day].presets[activePresetId].exercises });
  },

  setActivePreset: (day, presetId) => {
    set((state) => {
      const updatedDays = {
        ...state.days,
        [day]: {
          ...state.days[day],
          activePresetId: presetId,
        },
      };
      return {
        days: updatedDays,
        currentExercises: updatedDays[day].presets[presetId].exercises,
      };
    });
  },

  addExerciseToPreset: (day, presetId, exerciseData) => {
    set((state) => {
      const dayPlan = state.days[day];
      const preset = dayPlan.presets[presetId];
      const newExercise: PlannedExercise = {
        ...exerciseData,
        id: Math.random().toString(36).substring(2, 9),
      };

      const updatedExercises = [...preset.exercises, newExercise];
      const updatedDays = {
        ...state.days,
        [day]: {
          ...dayPlan,
          presets: {
            ...dayPlan.presets,
            [presetId]: {
              ...preset,
              exercises: updatedExercises,
            },
          },
        },
      };

      return {
        days: updatedDays,
        currentExercises: day === state.selectedDay && presetId === dayPlan.activePresetId ? updatedExercises : state.currentExercises,
      };
    });
  },

  removeExerciseFromPreset: (day, presetId, exerciseId) => {
    set((state) => {
      const dayPlan = state.days[day];
      const preset = dayPlan.presets[presetId];
      const updatedExercises = preset.exercises.filter((ex) => ex.id !== exerciseId);

      const updatedDays = {
        ...state.days,
        [day]: {
          ...dayPlan,
          presets: {
            ...dayPlan.presets,
            [presetId]: {
              ...preset,
              exercises: updatedExercises,
            },
          },
        },
      };

      return {
        days: updatedDays,
        currentExercises: day === state.selectedDay && presetId === dayPlan.activePresetId ? updatedExercises : state.currentExercises,
      };
    });
  },

  updateExerciseInPreset: (day, presetId, exerciseId, updates) => {
    set((state) => {
      const dayPlan = state.days[day];
      const preset = dayPlan.presets[presetId];
      const updatedExercises = preset.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      );

      const updatedDays = {
        ...state.days,
        [day]: {
          ...dayPlan,
          presets: {
            ...dayPlan.presets,
            [presetId]: {
              ...preset,
              exercises: updatedExercises,
            },
          },
        },
      };

      return {
        days: updatedDays,
        currentExercises: day === state.selectedDay && presetId === dayPlan.activePresetId ? updatedExercises : state.currentExercises,
      };
    });
  },

  reorderExercise: (day, presetId, index, direction) => {
    set((state) => {
      const dayPlan = state.days[day];
      const preset = dayPlan.presets[presetId];
      const exercises = [...preset.exercises];

      if (direction === 'up' && index > 0) {
        [exercises[index - 1], exercises[index]] = [exercises[index], exercises[index - 1]];
      } else if (direction === 'down' && index < exercises.length - 1) {
        [exercises[index + 1], exercises[index]] = [exercises[index], exercises[index + 1]];
      }

      const updatedDays = {
        ...state.days,
        [day]: {
          ...dayPlan,
          presets: {
            ...dayPlan.presets,
            [presetId]: {
              ...preset,
              exercises,
            },
          },
        },
      };

      return {
        days: updatedDays,
        currentExercises: day === state.selectedDay && presetId === dayPlan.activePresetId ? exercises : state.currentExercises,
      };
    });
  },
}));