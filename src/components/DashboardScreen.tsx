import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useWorkoutStore } from '../store/workoutStore';
import type { Workout } from '../types/workout';

interface DashboardScreenProps {
  onStartWorkout: () => void;
}

function getCurrentWeekdayIndex() {
  const sundayFirstIndex = new Date().getDay();
  return (sundayFirstIndex + 6) % 7;
}

function getExerciseDraft(workout: Workout) {
  return workout.exercises.map((exercise) => exercise.name).join('\n');
}

export default function DashboardScreen({
  onStartWorkout,
}: DashboardScreenProps) {
  const split = useWorkoutStore((state) => state.split);
  const workouts = useWorkoutStore((state) => state.workouts);
  const selectedDayIndex = useWorkoutStore((state) => state.selectedDayIndex);
  const selectDay = useWorkoutStore((state) => state.selectDay);
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const updateWorkoutPlan = useWorkoutStore((state) => state.updateWorkoutPlan);
  const selectedWorkout = useWorkoutStore((state) => state.getSelectedWorkout());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(selectedWorkout.title);
  const [exerciseDraft, setExerciseDraft] = useState(
    getExerciseDraft(selectedWorkout),
  );
  const currentWeekdayIndex = useMemo(() => getCurrentWeekdayIndex(), []);

  function openEditor() {
    setTitleDraft(selectedWorkout.title);
    setExerciseDraft(getExerciseDraft(selectedWorkout));
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
  }

  function saveEditor() {
    const exerciseNames = exerciseDraft
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean);

    updateWorkoutPlan(selectedWorkout.id, titleDraft, exerciseNames);
    setIsEditorOpen(false);
  }

  function handleStartWorkout() {
    startWorkout(selectedWorkout.id);
    onStartWorkout();
  }

  const canStartWorkout = selectedWorkout.exercises.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Weekly Split</Text>
          <Text style={styles.title}>Progressive Overload</Text>
        </View>

        <View style={styles.splitRow}>
          {split.map((day) => {
            const workout = workouts[day.workoutId];
            const isToday = day.dayIndex === currentWeekdayIndex;
            const isSelected = day.dayIndex === selectedDayIndex;

            return (
              <Pressable
                accessibilityRole="button"
                key={day.id}
                onPress={() => selectDay(day.dayIndex)}
                style={[
                  styles.splitTile,
                  isSelected && styles.splitTileSelected,
                  isToday && styles.splitTileToday,
                ]}
              >
                <Text
                  style={[
                    styles.splitLetter,
                    isToday && styles.splitLetterToday,
                  ]}
                >
                  {workout.shortLabel}
                </Text>
                <Text
                  style={[
                    styles.splitDayName,
                    isToday && styles.splitDayNameToday,
                  ]}
                >
                  {day.dayName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.planHeader}>
          <View style={styles.planTitleBlock}>
            <Text style={styles.planLabel}>Active Plan</Text>
            <Text style={styles.planTitle}>{selectedWorkout.title}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openEditor}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.planPanel}>
          {selectedWorkout.exercises.length > 0 ? (
            selectedWorkout.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseRow}>
                <View style={styles.exerciseIndex}>
                  <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.targetSets} sets x {exercise.targetReps} reps
                  </Text>
                </View>
                <Text style={styles.exerciseCategory}>{exercise.category}</Text>
              </View>
            ))
          ) : (
            <View style={styles.restState}>
              <Text style={styles.restTitle}>Rest Day</Text>
              <Text style={styles.restCopy}>
                No lifts scheduled. Recover hard and come back heavier.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!canStartWorkout}
          onPress={handleStartWorkout}
          style={[
            styles.startButton,
            !canStartWorkout && styles.startButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.startButtonText,
              !canStartWorkout && styles.startButtonTextDisabled,
            ]}
          >
            Start Workout
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={closeEditor}
        transparent
        visible={isEditorOpen}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeEditor} />
          <View style={styles.editorSheet}>
            <View style={styles.editorHandle} />
            <Text style={styles.editorTitle}>Edit Plan</Text>

            <Text style={styles.inputLabel}>Plan Name</Text>
            <TextInput
              onChangeText={setTitleDraft}
              placeholder="Push Day"
              placeholderTextColor="#6F6F6F"
              selectionColor="#D4AF37"
              style={styles.editorInput}
              value={titleDraft}
            />

            <Text style={styles.inputLabel}>Exercises</Text>
            <TextInput
              multiline
              onChangeText={setExerciseDraft}
              placeholder="One exercise per line"
              placeholderTextColor="#6F6F6F"
              selectionColor="#D4AF37"
              style={styles.exerciseEditorInput}
              textAlignVertical="top"
              value={exerciseDraft}
            />

            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeEditor}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveEditor}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Plan</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F5F5F5',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  splitTile: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderColor: '#232323',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 68,
    justifyContent: 'center',
  },
  splitTileSelected: {
    borderColor: '#F5F5F5',
  },
  splitTileToday: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  splitLetter: {
    color: '#F5F5F5',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
  splitLetterToday: {
    color: '#000000',
  },
  splitDayName: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  splitDayNameToday: {
    color: '#000000',
  },
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  planTitleBlock: {
    flex: 1,
    paddingRight: 16,
  },
  planLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  planTitle: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderColor: '#D4AF37',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  editButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  planPanel: {
    backgroundColor: '#121212',
    borderColor: '#232323',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
  },
  exerciseRow: {
    alignItems: 'center',
    borderBottomColor: '#232323',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exerciseIndex: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  exerciseIndexText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '900',
  },
  exerciseInfo: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseName: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  exerciseMeta: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 5,
  },
  exerciseCategory: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  restState: {
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
    padding: 24,
  },
  restTitle: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  restCopy: {
    color: '#A0A0A0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  startButton: {
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    minHeight: 58,
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#1D1D1D',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  startButtonTextDisabled: {
    color: '#666666',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  editorSheet: {
    backgroundColor: '#121212',
    borderColor: '#232323',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  editorHandle: {
    alignSelf: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 8,
    height: 4,
    marginBottom: 18,
    width: 46,
  },
  editorTitle: {
    color: '#F5F5F5',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 18,
  },
  inputLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  editorInput: {
    backgroundColor: '#000000',
    borderColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F5F5F5',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 18,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  exerciseEditorInput: {
    backgroundColor: '#000000',
    borderColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
    minHeight: 160,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '900',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
});
