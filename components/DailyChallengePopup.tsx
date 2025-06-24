import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../styles/theme';

const DailyChallengePopup: React.FC<{ visible: boolean; onClose: () => void; onStart: () => void; wordHint?: string }> = ({ visible, onClose, onStart, wordHint }) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Daily Challenge</Text>
          <Text style={styles.message}>Ready for today's Word Wise Daily Challenge?</Text>
          {wordHint && <Text style={styles.hint}>Hint: Today's word starts with <Text style={{ fontWeight: 'bold' }}>{wordHint}</Text></Text>}
          <TouchableOpacity style={styles.button} onPress={onStart}>
            <Text style={styles.buttonText}>Start Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: Colors.disabled, marginTop: Spacing.small }]} onPress={onClose}>
            <Text style={[styles.buttonText, { color: Colors.textSecondary }]}>Maybe Later</Text>
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
    width: 320,
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
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSizes.medium,
    color: Colors.secondary,
    marginBottom: Spacing.large,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.medium,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
  },
});

export default DailyChallengePopup;