import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

const getStreakMessage = (streak: number) => {
  if (streak === 3) return '🔥 3-day streak! Keep it up for a reward!';
  if (streak === 7) return '🌟 7-day streak! You earned a bonus!';
  if (streak === 30) return '💎 30-day streak! You are a Puzzleverse legend!';
  if (streak > 0) return `👏 ${streak}-day streak! Don’t break the chain!`;
  return '';
};

const StreakReminder: React.FC<{ visible: boolean; streak: number; onClose: () => void }> = ({ visible, streak, onClose }) => {
  const navigation = useNavigation();
  if (!visible || streak < 1) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Streak Reminder</Text>
          <Text style={styles.message}>{getStreakMessage(streak)}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep Playing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    width: 300,
  },
  title: {
    fontSize: FontSizes.header,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: Spacing.medium,
  },
  message: {
    fontSize: FontSizes.large,
    color: Colors.textPrimary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
  },
});

export default StreakReminder;
