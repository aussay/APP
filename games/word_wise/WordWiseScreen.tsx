import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ScrollView, Animated, AppState as RNAppState, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { initializeWordWiseState, processGuess, addLetterToGuess, removeLetterFromGuess, getWordWiseForDate } from './logic';
import { WordWiseState, LetterFeedback, Guess } from './types';
import { AITriggerType, AIResponse } from '../../ai/types';
import { GameKey } from '../../types/statistics';
import { finalizeGameSession, markDailyChallengeCompleted, updateDailyStreak, updateGameStreak, loadStatistics, StatsUpdateResult } from '../../store/statisticsService'; // Added updateGameStreak
import { getDailyWordWiseChallengeKey } from '../../utils/dailyChallengeHelper';
import { RouteProp, useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { StackNavigationProp } from '@react-navigation/stack';
import aiSimulatorInstance from '../../ai/AISimulator';
import { WordWiseAIBot, getBotById } from './aiBots';
import { useAchievementNotification } from '../../context/AchievementNotificationContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../styles/theme';
import { wordWiseArchive2025 } from './archive/2025';
import { generateWordWiseShareMessage, shareGameResult } from '../../utils/sharingHelper';
import { getAttributionForDate } from '../../utils/game-attribution';

type WordWiseScreenRouteProp = RouteProp<RootStackParamList, 'WordWise'>;

const CustomKeyboard: React.FC<{
  onKeyPress: (key: string) => void;
  letterStatuses: { [letter: string]: LetterFeedback };
  styles: any;
}> = ({ onKeyPress, letterStatuses, styles }: { onKeyPress: (key: string) => void; letterStatuses: { [letter: string]: LetterFeedback }; styles: any }) => {
  const rows: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ];
  const getLetterStyle = (letter: string) => {
    const status = letterStatuses[letter];
    if (status === 'correct') return styles.keyCorrect;
    if (status === 'present') return styles.keyPresent;
    if (status === 'absent') return styles.keyAbsent;
    return styles.keyNormal;
  };
  return (
    <View style={styles.keyboard}>
      {rows.map((row: string[], rowIndex: number) => (
        <View key={rowIndex} style={styles.keyboardRow}>
          {row.map((key: string) => (
            <Text key={key} style={[styles.key, getLetterStyle(key), (key === 'ENTER' || key === 'DEL') && styles.specialKey]} onPress={() => onKeyPress(key)}>{key}</Text>
          ))}
        </View>
      ))}
    </View>
  );
};

const WordWiseScreen: React.FC = () => {
  const route = useRoute<WordWiseScreenRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { showAchievementNotification } = useAchievementNotification();
  const isFocused = useIsFocused();

  const isDailyChallenge = route.params?.isDailyChallenge || false;
  const dailyWordFromParams = route.params?.dailyWord;
  const initialGameMode = route.params?.gameMode || (isDailyChallenge ? 'daily' : 'classic');
  const initialAIBotId = route.params?.aiBotId;
  const dailyChallengeKeyForLoad = isDailyChallenge ? getDailyWordWiseChallengeKey() : '';

  const [gameState, setGameState] = useState<WordWiseState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [scoreFeedback, setScoreFeedback] = useState<string>('');
  const [aiMessage, setAiMessage] = useState<AIResponse | null>(null);
  const [aiCrossGameSuggestion, setAiCrossGameSuggestion] = useState<AIResponse | null>(null);
  const [activeAIBot, setActiveAIBot] = useState<WordWiseAIBot | null>(null);
  const [botTurnMessage, setBotTurnMessage] = useState<string | null>(null);
  const [isDailyCompletedToday, setIsDailyCompletedToday] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);

  const appState = useRef(RNAppState.currentState);
  const defaultWordLengthForAnims = initializeWordWiseState().wordLength;
  const flipAnimValues = useRef(Array(defaultWordLengthForAnims).fill(null).map(() => new Animated.Value(0))).current;
  const aiFlipAnimValues = useRef(Array(defaultWordLengthForAnims).fill(null).map(() => new Animated.Value(0))).current;
  const [animatingRowFeedback, setAnimatingRowFeedback] = useState<LetterFeedback[] | null>(null);
  const [animatingAIRowFeedback, setAnimatingAIRowFeedback] = useState<LetterFeedback[] | null>(null);

  useEffect(() => {
    const attemptLoadState = async () => {
      if(isFocused) {
        setIsLoadingState(true);
        let loadedSt: WordWiseState | null = null;
        // For daily, use 'classic' mode with daily word
        const gameModeForLoad = 'classic';

        if (isDailyChallenge) {
          const completed = await markDailyChallengeCompleted(dailyChallengeKeyForLoad);
          setIsDailyCompletedToday(completed);
          if (completed) {
            loadedSt = initializeWordWiseState(undefined, undefined, dailyWordFromParams, 'classic', undefined);
            if(loadedSt) {
              loadedSt.isGameOver = true; loadedSt.didWin = true;
            }
          } else {
            loadedSt = await loadWordWiseState('classic', dailyChallengeKeyForLoad);
          }
        } else if (initialGameMode === 'versusAI' && initialAIBotId) {
          loadedSt = await loadWordWiseState('versusAI', undefined, initialAIBotId);
        } else {
          loadedSt = await loadWordWiseState('classic');
        }
        const newGameState = loadedSt || initializeWordWiseState(undefined, undefined, isDailyChallenge && dailyWordFromParams ? dailyWordFromParams : undefined, initialGameMode, initialAIBotId);
        setGameState(newGameState);
        if (!newGameState.isGameOver && (newGameState.gameMode === 'classic' || newGameState.gameMode === 'daily')) setGameStartTime(Date.now()); else setGameStartTime(null);
        if (newGameState.gameMode === 'versusAI' && newGameState.aiBotId && !activeAIBot) { const bot = getBotById(newGameState.aiBotId); if (bot) setActiveAIBot(bot); }
        setIsLoadingState(false);
      }
    };
    attemptLoadState();
  }, [isFocused, isDailyChallenge, dailyChallengeKeyForLoad, initialGameMode, initialAIBotId, dailyWordFromParams]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    if (gameState.gameMode === 'classic' || (isDailyChallenge && !isDailyCompletedToday && !gameState.didWin)) {
        const gameAIPersonalities = ['lexicon_prime', 'lucky_charm'];
        const currentAIPersonalityId = aiSimulatorInstance.getActivePersonality()?.id;
        if (!currentAIPersonalityId || !gameAIPersonalities.includes(currentAIPersonalityId)) aiSimulatorInstance.setActivePersonality(gameAIPersonalities[Math.floor(Math.random() * gameAIPersonalities.length)]);
        if (gameState.guesses.length === 0) { const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.WORD_WISE, triggerType: AITriggerType.GAME_START }); setAiMessage(initialResponse); }
    } else if (gameState.gameMode === 'versusAI' && gameState.aiBotId) {
        if(!activeAIBot && getBotById(gameState.aiBotId)) setActiveAIBot(getBotById(gameState.aiBotId));
        if (activeAIBot && gameState.currentTurn === 'user' && gameState.guesses.length === 0 && (!gameState.aiGuesses || gameState.aiGuesses.length === 0) && !botTurnMessage) setBotTurnMessage(`${activeAIBot.name} is ready! Your turn.`);
        aiSimulatorInstance.setActivePersonality(null as any);
    }
    if (!gameState.isGameOver) setAiCrossGameSuggestion(null);
  }, [isLoadingState, gameState, activeAIBot, isDailyChallenge, isDailyCompletedToday]);

  useEffect(() => {
    if (isLoadingState || !gameState ) return;
    const saveCurrentState = () => {
      if (gameState && !gameState.isGameOver) {
        const stateToSave = isDailyChallenge && dailyChallengeKeyForLoad ? {...gameState, dailyChallengeKey: dailyChallengeKeyForLoad} : gameState;
        saveWordWiseState(stateToSave);
      } else if (gameState && gameState.isGameOver) {
        const modeToClear = gameState.isDailyChallenge ? 'daily' : gameState.gameMode;
        const dailyKeyToClear = gameState.isDailyChallenge ? dailyChallengeKeyForLoad : undefined;
        if(!(isDailyChallenge && gameState.didWin && isDailyCompletedToday)) clearSavedWordWiseState(modeToClear, dailyKeyToClear, gameState.aiBotId);
      }
    };
    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {}
      else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) saveCurrentState();
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); saveCurrentState(); };
  }, [gameState, isLoadingState, isDailyChallenge, dailyChallengeKeyForLoad, isDailyCompletedToday]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.lastScoreChange > 0 && gameState.didWin && gameState.gameMode === 'classic') {
      setScoreFeedback(`+${gameState.lastScoreChange}`);
      const timer = setTimeout(() => setScoreFeedback(''), 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.lastScoreChange, gameState?.didWin, gameState?.gameMode, isLoadingState]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.gameMode === 'versusAI' && gameState.currentTurn === 'ai' && !gameState.isGameOver && activeAIBot) {
      setBotTurnMessage(activeAIBot.getFeedbackLine('making_guess'));
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return null;
          const newState = processAIBotGuess(prev);
          const lastAIGuess = newState.aiGuesses![newState.aiGuesses!.length - 1];
          if(lastAIGuess?.feedback) triggerFlipAnimation(lastAIGuess.feedback, true, newState.wordLength);
          setBotTurnMessage(null);
          if (newState.isGameOver) {
            finalizeGameSession(GameKey.WORD_WISE, false)
              .then(statsResult => {
                if (statsResult.unlockedAchievements) statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
              }).catch(err => console.error('Error in AI win stat/achievement flow:', err));
            if (newState.aiWon) setBotTurnMessage(activeAIBot.getFeedbackLine('win'));
            else setBotTurnMessage(activeAIBot.getFeedbackLine('lose'));
          }
          return newState;
        });
      }, 1000 + Math.random() * 1000);
    }
  }, [gameState?.currentTurn, gameState?.gameMode, gameState?.isGameOver, activeAIBot, showAchievementNotification, isLoadingState]);

  const triggerFlipAnimation = (feedback: LetterFeedback[], forAI: boolean = false, currentWordLength: number) => {
    if (!gameState) return;
    const animsRef = forAI ? aiFlipAnimValues : flipAnimValues;
    if (animsRef.current.length !== currentWordLength) animsRef.current = Array(currentWordLength).fill(null).map(() => new Animated.Value(0));
    if (forAI) setAnimatingAIRowFeedback(feedback); else setAnimatingRowFeedback(feedback);
    const animations = animsRef.current.map((animValue) => Animated.timing(animValue, { toValue: 1, duration: 300, useNativeDriver: true }));
    animsRef.current.forEach(anim => anim.setValue(0));
    Animated.stagger(150, animations).start(() => {
        setTimeout(() => { if (forAI) setAnimatingAIRowFeedback(null); else setAnimatingRowFeedback(null); }, 200);
    });
  };

  const handleKeyPress = (key: string) => {
    if (!gameState || isLoadingState) return;
    if (gameState.gameMode === 'versusAI' && gameState.currentTurn !== 'user' && !gameState.isGameOver) return;
    if ((isDailyChallenge && isDailyCompletedToday && gameState.didWin) || (gameState.isGameOver && gameState.gameMode === 'classic') ) {
        if (key === 'ENTER' && gameState.isGameOver) if (isDailyChallenge && gameState.didWin) navigation.goBack();
        return;
    }
    if (gameState.isGameOver && key !== 'ENTER' && key !== 'DEL') return;

    if (key === 'ENTER') {
      if (gameState.currentGuess.length === gameState.wordLength && !gameState.isGameOver) {
        const guessToProcess = gameState.currentGuess;
        setGameState(prev => {
            if (!prev) return null;
            const newState = processGuess(prev, guessToProcess);
            const lastGuessFeedback = newState.guesses[newState.guesses.length - 1]?.feedback;
            if(lastGuessFeedback) triggerFlipAnimation(lastGuessFeedback, false, newState.wordLength);
            if (newState.isGameOver && !prev.isGameOver) {
                 const solveTime = (newState.gameMode === 'classic' || (isDailyChallenge && !isDailyCompletedToday)) && newState.didWin && gameStartTime ? (Date.now() - gameStartTime) / 1000 : undefined;
                 finalizeGameSession(GameKey.WORD_WISE, newState.didWin, solveTime)
                    .then(statsResult => {
                        if(statsResult.unlockedAchievements) statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
                        // Specific check for Vs AI Win, as finalizeGameSession might not have that specific opponentId context
                        if (newState.didWin && newState.gameMode === 'versusAI' && activeAIBot) {
                             checkAndUnlockAchievements(statsResult, GameKey.WORD_WISE, { vsAI: true, opponentId: activeAIBot.id, didWin: true })
                            .then(vsAiUnlocked => vsAiUnlocked.forEach(ach => showAchievementNotification(ach)));
                        }
                    }).catch(err => console.error('Error finalizing Word Wise session or checking achievements:', err));
                if (newState.gameMode === 'classic') {
                    const endResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.WORD_WISE, triggerType: newState.didWin ? AITriggerType.GAME_WIN : AITriggerType.GAME_LOSE, guessesMade: newState.guesses.length, currentScore: newState.score });
                    setAiMessage(endResponse);
                    setTimeout(() => { const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.WORD_WISE, triggerType: AITriggerType.CROSS_GAME_SUGGESTION }); setAiCrossGameSuggestion(suggestionResponse); }, 1500);
                } else if (newState.gameMode === 'versusAI' && newState.didWin && activeAIBot) setBotTurnMessage(activeAIBot.getFeedbackLine('lose'));
                if (isDailyChallenge && newState.didWin) {
                    markDailyChallengeCompleted(dailyChallengeKeyForLoad).then(() => { setIsDailyCompletedToday(true);
                        updateDailyStreak().then(streakResult => {
                            if(streakResult.unlockedAchievements) streakResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
                            // Check daily win achievement separately if not covered by streak's context
                            loadStatistics().then(s => checkAndUnlockAchievements(s, GameKey.WORD_WISE, {isDailyWin: true})).then(dailyWins => dailyWins.forEach(ach => showAchievementNotification(ach)));
                            // Per-game streak update
                            updateGameStreak(GameKey.WORD_WISE).then(() => {/* Optionally handle per-game streak achievements */});
                        }).catch(err => console.error("Error updating daily streak or checking achievements:", err));
                    });
                }
            } else if (!newState.isGameOver && newState.gameMode === 'classic') {
                 const turnResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.WORD_WISE, triggerType: AITriggerType.INCORRECT_ACTION, guessesMade: newState.guesses.length });
                setAiMessage(turnResponse); setAiCrossGameSuggestion(null);
            } else if (!newState.isGameOver && newState.gameMode === 'versusAI' && newState.currentTurn === 'ai') {
                setAiMessage(null); if(activeAIBot) setBotTurnMessage(`${activeAIBot.name}'s turn!`);
            }
            return newState;
        });
      }
    } else if (key === 'DEL') {
      if (!gameState.isGameOver) setGameState(prev => prev ? removeLetterFromGuess(prev) : null);
    } else if (gameState.currentGuess.length < gameState.wordLength && /^[A-Z]$/i.test(key) && !gameState.isGameOver) {
      setGameState(prev => prev ? addLetterToGuess(prev, key) : null);
    }
  };

  const renderGuessRowUI = (styles: any, guessData?: Guess, rowIndex?: number, isCurrentRow: boolean = false, isAI: boolean = false) => {
    if (!gameState) return null;
    const displayWord = isCurrentRow ? (isAI && gameState.currentTurn === 'ai' ? " ".repeat(gameState.wordLength) : gameState.currentGuess.padEnd(gameState.wordLength, ' ')) : guessData?.word || '';
    const feedbackToUse = (rowIndex === (isAI ? (gameState.aiGuesses?.length || 0) : gameState.guesses.length) -1 && (isAI ? animatingAIRowFeedback : animatingRowFeedback) && !isCurrentRow)
                          ? (isAI ? animatingAIRowFeedback : animatingRowFeedback) : guessData?.feedback;
    const anims = isAI ? aiFlipAnimValues : flipAnimValues;
    return (
      <View style={styles.guessRow} key={`${isAI ? 'ai' : 'user'}-row-${rowIndex}`}>
        {displayWord.split('').map((letter: string, index: number) => {
          let cellStyle = styles.guessCell, letterStyle = styles.guessLetter, frontAnimatedStyle = {}, backAnimatedStyle = {};
          if (anims.current.length > index && rowIndex === (isAI ? (gameState.aiGuesses?.length || 0) : gameState.guesses.length) -1 && (isAI ? animatingAIRowFeedback : animatingRowFeedback) && !isCurrentRow && !gameState.isGameOver) {
            const spin = anims.current[index].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
            const opacityFront = anims.current[index].interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
            const opacityBack = anims.current[index].interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });
            frontAnimatedStyle = { transform: [{ rotateX: spin }], opacity: opacityFront };
            backAnimatedStyle = { transform: [{ rotateX: spin }, {rotateX: '180deg'}], opacity: opacityBack, position: 'absolute' };
          }
          if (feedbackToUse) {
            if (feedbackToUse[index] === 'correct') cellStyle = { ...cellStyle, ...styles.cellCorrect };
            else if (feedbackToUse[index] === 'present') cellStyle = { ...cellStyle, ...styles.cellPresent };
            else if (feedbackToUse[index] === 'absent') cellStyle = { ...cellStyle, ...styles.cellAbsent };
            if (feedbackToUse[index] !== 'pending' && feedbackToUse[index] !== undefined) letterStyle = {...letterStyle, ...styles.revealedLetter};
          }
          return (<View key={index} style={styles.cellContainer}><Animated.View style={[styles.guessCell, styles.guessCellFront, frontAnimatedStyle]}><Text style={styles.guessLetter}>{letter}</Text></Animated.View><Animated.View style={[styles.guessCell, cellStyle, backAnimatedStyle]}><Text style={letterStyle}>{letter}</Text></Animated.View></View>);
        })}
      </View>
    );
  };

  const renderPlayerGrid = (playerGuesses: Guess[], isAIPlayer: boolean, styles: any) => {
    if (!gameState) return null; const rows = [];
    for (let i = 0; i < gameState.maxGuesses; i++) {
        if (i < playerGuesses.length) rows.push(renderGuessRowUI(playerGuesses[i], i, false, isAIPlayer, styles));
        else if (i === playerGuesses.length && gameState.currentTurn === (isAIPlayer ? 'ai' : 'user') && !gameState.isGameOver && !isAIPlayer) rows.push(renderGuessRowUI(undefined, i, true, false, styles));
        else rows.push(renderGuessRowUI(undefined, i, false, isAIPlayer, styles));
    } return <View>{rows}</View>;
  };

  if (isLoadingState || !gameState) {
    return (<View style={[styles.container, styles.centeredLoading]}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading Game...</Text></View>);
  }

  const today = new Date();
  const dailyWord = getWordWiseForDate(selectedArchiveIndex !== null ? new Date(2025, 0, 1 + selectedArchiveIndex) : today);
  const archiveList = wordWiseArchive2025;
  const isUnlocked = (index: number) => {
    const archiveDate = new Date(2025, 0, 1 + index);
    return archiveDate <= today;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isDailyChallenge ? 'Daily Word Wise' : 'Word Wise'}</Text>
        {isDailyChallenge && isDailyCompletedToday && gameState.didWin && (
          <Text style={styles.dailyCompletionMessage}>✅ Daily Challenge Completed!</Text>
        )}
      </View>
      <View style={styles.gameContainer}>
        <View style={styles.playerSection}>
          <Text style={styles.playerTitle}>You</Text>
          {renderPlayerGrid(gameState.guesses, false, styles)}
        </View>
        {gameState.gameMode === 'versusAI' && (
          <View style={styles.aiSection}>
            <Text style={styles.playerTitle}>{activeAIBot ? activeAIBot.name : 'Opponent'}</Text>
            {renderPlayerGrid(gameState.aiGuesses || [], true, styles)}
            {botTurnMessage && <Text style={styles.botTurnMessage}>{botTurnMessage}</Text>}
          </View>
        )}
      </View>
      <View style={styles.keyboardContainer}>
        <CustomKeyboard
          onKeyPress={handleKeyPress}
          letterStatuses={gameState.letterStatuses}
          styles={styles}
        />
      </View>
      {scoreFeedback !== '' && (
        <View style={styles.scoreFeedbackContainer}>
          <Text style={styles.scoreFeedback}>{scoreFeedback}</Text>
        </View>
      )}
      {aiMessage && (
        <View style={styles.aiMessageContainer}>
          <Text style={styles.aiMessage}>{aiMessage.text}</Text>
        </View>
      )}
      {aiCrossGameSuggestion && (
        <View style={styles.aiMessageContainer}>
          <Text style={styles.aiMessage}>{aiCrossGameSuggestion.text}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.archiveButton} onPress={() => setArchiveVisible(!archiveVisible)}>
        <Text style={styles.archiveButtonText}>{archiveVisible ? 'Hide Archive' : 'Show Archive'}</Text>
      </TouchableOpacity>
      {archiveVisible && (
        <View style={styles.archiveContainer}>
          <Text style={styles.archiveTitle}>Word Wise Archive 2025</Text>
          <FlatList
            data={archiveList}
            renderItem={({ item, index }) => {
              const archiveDate = new Date(2025, 0, 1 + index);
              const isUnlocked = archiveDate <= today;
              return (
                <TouchableOpacity
                  style={[styles.archiveItem, !isUnlocked && styles.lockedArchiveItem]}
                  onPress={() => isUnlocked && setSelectedArchiveIndex(index)}
                  disabled={!isUnlocked}
                >
                  <Text style={styles.archiveDate}>{archiveDate.toDateString()}</Text>
                  {!isUnlocked && <Text style={styles.lockedText}>Locked</Text>}
                </TouchableOpacity>
              );
            }}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.archiveList}
          />
          {selectedArchiveIndex !== null && (
            <View style={styles.selectedArchiveContainer}>
              <Text style={styles.selectedArchiveTitle}>Selected Word:</Text>
              <Text style={styles.selectedArchiveWord}>{getWordWiseForDate(new Date(2025, 0, 1 + selectedArchiveIndex))}</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default WordWiseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.small,
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  header: {
    padding: Spacing.medium,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.large,
    borderBottomRightRadius: BorderRadius.large,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.white,
  },
  dailyCompletionMessage: {
    marginTop: Spacing.small,
    fontSize: FontSizes.small,
    color: Colors.secondary,
  },
  gameContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.medium,
  },
  playerSection: {
    flex: 1,
    marginRight: Spacing.small,
  },
  aiSection: {
    flex: 1,
    marginLeft: Spacing.small,
    borderLeftWidth: 1,
    borderColor: Colors.border,
  },
  playerTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    marginBottom: Spacing.small,
    color: Colors.text,
  },
  guessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.extraSmall,
  },
  cellContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: Spacing.xs / 2,
    overflow: 'hidden',
    borderRadius: BorderRadius.small,
  },
  guessCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.small,
  },
  guessCellFront: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  revealedLetter: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  cellCorrect: {
    backgroundColor: Colors.success,
  },
  cellPresent: {
    backgroundColor: Colors.warning,
  },
  cellAbsent: {
    backgroundColor: Colors.error,
  },
  keyboardContainer: {
    padding: Spacing.medium,
    backgroundColor: Colors.secondary,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.small,
  },
  key: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Spacing.extraSmall,
    borderRadius: BorderRadius.small,
    textAlign: 'center',
  },
  specialKey: {
    backgroundColor: Colors.accent,
    color: Colors.white,
  },
  scoreFeedbackContainer: {
    position: 'absolute',
    top: Spacing.medium,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreFeedback: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.success,
  },
  aiMessageContainer: {
    position: 'absolute',
    top: Spacing.medium * 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  aiMessage: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    padding: Spacing.small,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
  },
  botTurnMessage: {
    fontSize: FontSizes.medium,
    fontStyle: 'italic',
    color: Colors.text,
    marginTop: Spacing.small,
  },
  archiveButton: {
    padding: Spacing.medium,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    margin: Spacing.medium,
  },
  archiveButtonText: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.white,
  },
  archiveContainer: {
    padding: Spacing.medium,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.large,
    margin: Spacing.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  archiveTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    marginBottom: Spacing.medium,
    color: Colors.text,
  },
  archiveItem: {
    padding: Spacing.medium,
    borderRadius: BorderRadius.small,
    marginBottom: Spacing.small,
    backgroundColor: Colors.primary,
  },
  lockedArchiveItem: {
    backgroundColor: Colors.gray,
  },
  archiveDate: {
    fontSize: FontSizes.medium,
    color: Colors.white,
  },
  lockedText: {
    fontSize: FontSizes.small,
    color: Colors.text,
    marginTop: Spacing.extraSmall,
  },
  archiveList: {
    paddingBottom: Spacing.medium,
  },
  selectedArchiveContainer: {
    marginTop: Spacing.medium,
    padding: Spacing.medium,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedArchiveTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    marginBottom: Spacing.small,
    color: Colors.text,
  },
  selectedArchiveWord: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.success,
  },
});
