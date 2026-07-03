import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SectionList,
  Platform,
  StatusBar as RNStatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore, DAYS, EXERCISE_LIBRARY, CATEGORY_ORDER } from '../store/workoutStore';
import { DayOfWeek, Exercise, ExerciseLibraryItem } from '../types/workout';

interface DashboardScreenProps {
  onStartWorkout: () => void;
}

const DEFAULT_TARGET_SETS = 3;
const DEFAULT_TARGET_REPS = 10;

export default function DashboardScreen({ onStartWorkout }: DashboardScreenProps) {
  const plan = useWorkoutStore((state) => state.plan);
  const selectedDay = useWorkoutStore((state) => state.selectedDay);
  const currentPreset = useWorkoutStore((state) => state.currentPreset);
  const setSelectedDay = useWorkoutStore((state) => state.setSelectedDay);
  const setCurrentPreset = useWorkoutStore((state) => state.setCurrentPreset);
  const addPreset = useWorkoutStore((state) => state.addPreset);
  const addExerciseToPreset = useWorkoutStore((state) => state.addExerciseToPreset);
  const removeExerciseFromPreset = useWorkoutStore((state) => state.removeExerciseFromPreset);

  const [isAddExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [isAddPresetModalVisible, setAddPresetModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPresetName, setNewPresetName] = useState('');

  const activeDayData = plan[selectedDay];
  const presetNames = Object.keys(activeDayData.presets);
  const activeExercises: Exercise[] = activeDayData.presets[currentPreset] ?? [];

  const filteredLibrarySections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => ({
      title: category,
      data: EXERCISE_LIBRARY.filter(
        (item) =>
          item.category === category &&
          (query.length === 0 || item.name.toLowerCase().includes(query))
      ),
    })).filter((section) => section.data.length > 0);
  }, [searchQuery]);

  const handleSelectDay = (day: DayOfWeek) => {
    setSelectedDay(day);
  };

  const handleSelectPreset = (presetName: string) => {
    setCurrentPreset(presetName);
  };

  const handlePickExercise = (item: ExerciseLibraryItem) => {
    addExerciseToPreset(
      selectedDay,
      currentPreset,
      item,
      DEFAULT_TARGET_SETS,
      DEFAULT_TARGET_REPS
    );
    setAddExerciseModalVisible(false);
    setSearchQuery('');
  };

  const handleDeleteExercise = (exerciseId: string) => {
    removeExerciseFromPreset(selectedDay, currentPreset, exerciseId);
  };

  const handleCreatePreset = () => {
    const trimmed = newPresetName.trim();
    if (trimmed.length === 0) return;
    addPreset(selectedDay, trimmed);
    setCurrentPreset(trimmed);
    setNewPresetName('');
    setAddPresetModalVisible(false);
  };

  const closeAddPresetModal = () => {
    setAddPresetModalVisible(false);
    setNewPresetName('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DASHBOARD</Text>
            <Text style={styles.title}>Your Training Plan</Text>
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={onStartWorkout}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={16} color="#000000" />
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>

        {/* Day selector */}
        <Text style={styles.sectionLabel}>Day</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
          contentContainerStyle={styles.dayScrollContent}
        >
          {DAYS.map((day) => {
            const isActive = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => handleSelectDay(day)}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                  {day.slice(0, 3).toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Preset tabs — premium gold pills */}
        <Text style={styles.sectionLabel}>Preset</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetScroll}
          contentContainerStyle={styles.presetScrollContent}
        >
          {presetNames.map((presetName) => {
            const isActive = presetName === currentPreset;
            return (
              <TouchableOpacity
                key={presetName}
                onPress={() => handleSelectPreset(presetName)}
                style={[styles.presetPill, isActive && styles.presetPillActive]}
                activeOpacity={0.85}
              >
                <Text style={[styles.presetPillText, isActive && styles.presetPillTextActive]}>
                  {presetName}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => setAddPresetModalVisible(true)}
            style={styles.addPresetPill}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={18} color="#D4AF37" />
          </TouchableOpacity>
        </ScrollView>

        {/* Exercise cards */}
        <View style={styles.exerciseListWrapper}>
          {activeExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={36} color="#3A3A3A" />
              <Text style={styles.emptyStateTitle}>No exercises yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Add your first exercise to the &quot;{currentPreset}&quot; preset for{' '}
                {selectedDay}.
              </Text>
            </View>
          ) : (
            activeExercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseCardMain}>
                  <View style={styles.categoryDot} />
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.targetSets} sets × {exercise.targetReps} reps · {exercise.category}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteExercise(exercise.id)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#E5484D" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Add exercise button */}
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setAddExerciseModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={20} color="#000000" />
          <Text style={styles.addExerciseButtonText}>Add Exercise to Preset</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Exercise Modal — searchable, grouped by muscle category */}
      <Modal
        visible={isAddExerciseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddExerciseModalVisible(false)}
      >
        <View style={styles.modalBackdropBottom}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Exercise</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDay} · {currentPreset}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddExerciseModalVisible(false)}
                style={styles.modalCloseButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#7A7A7A" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                placeholderTextColor="#5C5C5C"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            <SectionList
              sections={filteredLibrarySections}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled
              renderSectionHeader={({ section }) => (
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryHeaderText}>{section.title}</Text>
                </View>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.libraryItem}
                  onPress={() => handlePickExercise(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.libraryItemText}>{item.name}</Text>
                  <Ionicons name="add-circle-outline" size={22} color="#D4AF37" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyLibrary}>
                  <Text style={styles.emptyLibraryText}>No exercises match your search.</Text>
                </View>
              }
              contentContainerStyle={styles.sectionListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>

      {/* Add Preset Modal — create a new custom preset for this day */}
      <Modal
        visible={isAddPresetModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeAddPresetModal}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.smallModalCard}>
            <Text style={styles.modalTitle}>New Preset</Text>
            <Text style={styles.modalSubtitle}>For {selectedDay}</Text>
            <TextInput
              style={styles.presetInput}
              placeholder="e.g. Deload Week"
              placeholderTextColor="#5C5C5C"
              value={newPresetName}
              onChangeText={setNewPresetName}
              autoFocus
            />
            <View style={styles.smallModalActions}>
              <TouchableOpacity style={styles.smallModalCancel} onPress={closeAddPresetModal}>
                <Text style={styles.smallModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallModalConfirm} onPress={handleCreatePreset}>
                <Text style={styles.smallModalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const GOLD = '#D4AF37';
const BLACK = '#000000';
const CHARCOAL = '#121212';
const CHARCOAL_LIGHT = '#1C1C1C';
const BORDER = '#262626';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#9A9A9A';
const TEXT_MUTED = '#5C5C5C';
const DANGER = '#E5484D';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BLACK,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  eyebrow: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: '700',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  startButtonText: {
    color: BLACK,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  dayScroll: {
    marginBottom: 20,
  },
  dayScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CHARCOAL,
    borderWidth: 1,
    borderColor: BORDER,
  },
  dayChipActive: {
    backgroundColor: CHARCOAL_LIGHT,
    borderColor: GOLD,
  },
  dayChipText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayChipTextActive: {
    color: GOLD,
  },
  presetScroll: {
    marginBottom: 24,
  },
  presetScrollContent: {
    gap: 10,
    paddingRight: 8,
    alignItems: 'center',
  },
  presetPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: CHARCOAL,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presetPillActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  presetPillText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
  },
  presetPillTextActive: {
    color: BLACK,
    fontWeight: '700',
  },
  addPresetPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CHARCOAL,
    borderWidth: 1,
    borderColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseListWrapper: {
    marginBottom: 20,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CHARCOAL,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  exerciseCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CHARCOAL,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  addExerciseButtonText: {
    color: BLACK,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdropBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    backgroundColor: CHARCOAL,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: BORDER,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: GOLD,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CHARCOAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CHARCOAL_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 15,
    paddingVertical: 12,
  },
  sectionListContent: {
    paddingBottom: 20,
  },
  categoryHeader: {
    backgroundColor: CHARCOAL,
    paddingVertical: 8,
  },
  categoryHeaderText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CHARCOAL_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  libraryItemText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '500',
  },
  emptyLibrary: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyLibraryText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  smallModalCard: {
    width: '100%',
    backgroundColor: CHARCOAL,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presetInput: {
    backgroundColor: CHARCOAL_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT_PRIMARY,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  smallModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  smallModalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  smallModalCancelText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
  },
  smallModalConfirm: {
    backgroundColor: GOLD,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  smallModalConfirmText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '700',
  },
});
