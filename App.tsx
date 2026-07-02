import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import ActiveWorkoutScreen from './src/components/ActiveWorkoutScreen';
import DashboardScreen from './src/components/DashboardScreen';

type AppScreen = 'dashboard' | 'activeWorkout';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'dashboard' ? (
        <DashboardScreen onStartWorkout={() => setScreen('activeWorkout')} />
      ) : (
        <ActiveWorkoutScreen onExit={() => setScreen('dashboard')} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
});