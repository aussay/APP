import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, FontSizes } from '../styles/theme';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Button
        title="Select AI Guide"
        onPress={() => navigation.navigate('GuideSelectionScreen', { isFirstLaunch: false })}
        color={Colors.primary}
      />
      {/* Add more settings here as needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.large,
    backgroundColor: Colors.background,
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    marginBottom: Spacing.xl,
    color: Colors.primary,
    textAlign: 'center',
  },
});

export default SettingsScreen;
