import React from 'react';
import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WordWiseAIBot, AIBotPersonalities } from '../games/word_wise/aiBots'; // Import bot definitions

type AISetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WordWiseAISetup'>;

type Props = {
  navigation: AISetupScreenNavigationProp;
};

const WordWiseAISetupScreen: React.FC<Props> = ({ navigation }) => {
  const handleSelectBot = (bot: WordWiseAIBot) => {
    navigation.navigate('WordWise', {
      gameMode: 'versusAI',
      aiBotId: bot.id,
      // isDailyChallenge and dailyWord will be undefined, so it's not a daily challenge
    });
  };

  const renderBotItem = ({ item }: { item: WordWiseAIBot }) => (
    <TouchableOpacity style={styles.botButton} onPress={() => handleSelectBot(item)}>
      <Text style={styles.botName}>{item.name}</Text>
      {item.difficulty && <Text style={styles.botDifficulty}>Difficulty: {item.difficulty}</Text>}
      {/* Could add a short description of the bot's play style here */}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your AI Opponent</Text>
      <FlatList
        data={AIBotPersonalities}
        renderItem={renderBotItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#333',
  },
  list: {
    width: '100%',
  },
  botButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignItems: 'center', // Center text within the button
  },
  botName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
  },
  botDifficulty: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default WordWiseAISetupScreen;
