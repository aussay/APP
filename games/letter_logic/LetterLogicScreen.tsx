import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, ActivityIndicator, AppState as RNAppState } from 'react-native';
import {
    initializeLetterLogicState, submitWord, addLetterToInput, removeLastLetterFromInput, shuffleInputLetters,
    getTodayLetterLogicPuzzle, getLetterLogicForDate
} from './logic';
import { LetterLogicState } from './types';
import { finalizeGameSession, loadStatistics, StatsUpdateResult, updateGameStreak } from '../../store/statisticsService';
import { GameKey } from '../../types/statistics';
import aiSimulatorInstance from '../../ai/AISimulator';
import { AITriggerType, AIResponse } from '../../ai/types';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../styles/theme';
import { checkAndUnlockAchievements, Achievement } from '../../store/achievementService';
import { useAchievementNotification } from '../../context/AchievementNotificationContext';
import { generateLetterLogicShareMessage, shareGameResult } from '../../utils/sharingHelper';
import { letterLogicArchive2025 } from './archive/2025';
import { getAttributionForDate } from '../../utils/game-attribution';

const LetterLogicScreen: React.FC = () => {
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(getTodayLetterLogicPuzzle());
  const [gameState, setGameState] = useState<LetterLogicState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [scoreFeedback, setScoreFeedback] = useState<string>('');
  const [lastFoundWord, setLastFoundWord] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [archiveVisible, setArchiveVisible] = useState(false);

  const gameStateRef = useRef(gameState);
  const [aiMessage, setAiMessage] = useState<AIResponse | null>(null);
  const [aiCrossGameSuggestion, setAiCrossGameSuggestion] = useState<AIResponse | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { showAchievementNotification } = useAchievementNotification();
  const appState = useRef(RNAppState.currentState);
  const isFocused = useIsFocused();

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const attemptLoadState = async () => {
      if (isFocused) {
        setIsLoadingState(true);
        const loadedState: LetterLogicState | null = null;
        if (loadedState) {
          setGameState(loadedState);
          if (loadedState.foundWords.length !== currentPuzzle.validWords.length) setGameStartTime(Date.now()); else setGameStartTime(null);
        } else {
          const newGame = initializeLetterLogicState(currentPuzzle);
          setGameState(newGame); setGameStartTime(Date.now());
        }
        setIsLoadingState(false);
      }
    };
    attemptLoadState();
  }, [currentPuzzle.id, isFocused]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const saveCurrentState = () => {
      if (gameState) {
        const allWordsFound = gameState.foundWords.length === gameState.puzzle.validWords.length;
        if (allWordsFound) {
        } else if (gameState.foundWords.length > 0 || gameState.currentInput !== '' || gameState.score > 0) {
        }
      }
    };
    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {}
      else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) saveCurrentState();
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); saveCurrentState(); };
  }, [gameState, currentPuzzle.id, isLoadingState]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.lastScoreChange > 0) {
      setScoreFeedback(`+${gameState.lastScoreChange}`);
      const timer = setTimeout(() => setScoreFeedback(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.lastScoreChange, gameState?.score, isLoadingState]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const availablePersonalities = ['lexicon_master', 'enigmatic_encoder'];
    if (!aiSimulatorInstance.getActivePersonality() || !availablePersonalities.includes(aiSimulatorInstance.getActivePersonality()!.id) ) {
        aiSimulatorInstance.setActivePersonality(availablePersonalities[Math.floor(Math.random() * availablePersonalities.length)]);
    }
    if (gameState.foundWords.length === 0 && gameState.score === 0) {
        const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LETTER_LOGIC, triggerType: AITriggerType.GAME_START });
        setAiMessage(initialResponse);
    }
    setAiCrossGameSuggestion(null);
  }, [isLoadingState, gameState]);

  const handleLetterPress = (letter: string) => { if (!gameState) return; setGameState(prev => prev ? addLetterToInput(prev, letter) : null); };
  const handleDelete = () => { if (!gameState) return; setGameState(prev => prev ? removeLastLetterFromInput(prev) : null); };
  const handleShuffle = () => { if (!gameState) return; setGameState(prev => prev ? shuffleInputLetters(prev) : null); };

  const handleSubmit = async () => {
    if (!gameState) return;
    const submittedWord = gameState.currentInput;
    const prevScore = gameState.score;
    setGameState(prev => {
        if (!prev) return null;
        const newState = submitWord(prev);
        if (newState.lastScoreChange > 0 && newState.foundWords.includes(submittedWord)) {
            setLastFoundWord(submittedWord); setTimeout(() => setLastFoundWord(null), 1000);
            const isPangram = newState.puzzle.pangrams.includes(submittedWord);
            const wordFoundResponse = aiSimulatorInstance.getResponse({
                gameId: GameKey.LETTER_LOGIC,
                triggerType: isPangram ? AITriggerType.PANGRAM_FOUND : AITriggerType.CORRECT_ACTION,
                lastWordFound: submittedWord, currentScore: newState.score,
                progressPercentage: (newState.foundWords.length / newState.puzzle.validWords.length) * 100
            });
            if(wordFoundResponse) setAiMessage(wordFoundResponse);
            if (isPangram || (newState.score >= 50 && prevScore < 50)) { // Check specific conditions here
                 loadStatistics().then(async currentGlobalStats => {
                    const unlocked = await checkAndUnlockAchievements(currentGlobalStats, GameKey.LETTER_LOGIC, {
                        pangramFound: isPangram, scoreAchieved: newState.score
                    });
                    unlocked.forEach(ach => showAchievementNotification(ach));
                 }).catch(e => console.error("Error loading stats for LL achievement check:", e));
            }
        } else if (newState.lastScoreChange === 0 && prev.currentInput.length >= prev.puzzle.minWordLength ) {
             const invalidResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LETTER_LOGIC, triggerType: AITriggerType.INCORRECT_ACTION });
            if(invalidResponse) setAiMessage(invalidResponse);
        }
        return newState;
    });
  };

  const renderLetterButton = (letter: string, isCenter: boolean) => (
    <TouchableOpacity style={[styles.letterButton, isCenter && styles.centerLetterButton]} onPress={() => handleLetterPress(letter)}><Text style={styles.letterButtonText}>{letter}</Text></TouchableOpacity>
  );

  const outerLetters = useMemo(() => gameState ? gameState.puzzle.letters.filter((l: string) => l !== gameState.puzzle.centerLetter) : [], [gameState?.puzzle.letters, gameState?.puzzle.centerLetter]);
  const centerLetter = useMemo(() => gameState ? gameState.puzzle.centerLetter : '', [gameState?.puzzle.centerLetter]);

  useEffect(() => {
    return () => {
      const finalState = gameStateRef.current;
      if (finalState) {
        const didWin = finalState.foundWords.length === finalState.puzzle.validWords.length;
        let solveTime: number | undefined = undefined;
        if (didWin && gameStartTime) solveTime = (Date.now() - gameStartTime) / 1000;
        if (didWin || finalState.foundWords.length > 0 || finalState.score > 0) {
          finalizeGameSession(GameKey.LETTER_LOGIC, didWin, solveTime)
            .then((statsResult: StatsUpdateResult) => { // Use StatsUpdateResult
                if (statsResult.unlockedAchievements) {
                    statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
                }
            })
            .catch(err => console.error('Error updating Letter Logic stats on unmount:', err));
        }
      }
    };
  }, [gameStartTime, showAchievementNotification]);

  const handleSuggestionNavigation = (suggestedGameText: string) => {
    const SuggMap: {[key:string]: keyof RootStackParamList | undefined} = { "word wise": "WordWise", "insight": "Insight" };
    let navTo: keyof RootStackParamList | undefined;
    for (const key in SuggMap) { if(suggestedGameText.toLowerCase().includes(key)) navTo = SuggMap[key]; }
    if (navTo) navigation.navigate(navTo as any); else console.warn("Cannot navigate to suggested game:", suggestedGameText);
    setAiCrossGameSuggestion(null);
  };

  useEffect(() => {
      if (!gameState || isLoadingState) return;
      const allWordsFound = gameState.foundWords.length === gameState.puzzle.validWords.length;
      if (allWordsFound && !aiCrossGameSuggestion) { // Check ref to prevent re-trigger if already complete
          const winResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LETTER_LOGIC, triggerType: AITriggerType.GAME_WIN, currentScore: gameState.score });
          setAiMessage(winResponse);
          setTimeout(() => { const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LETTER_LOGIC, triggerType: AITriggerType.CROSS_GAME_SUGGESTION }); setAiCrossGameSuggestion(suggestionResponse);}, 1500);
      }
  }, [gameState?.foundWords, gameState?.puzzle?.validWords, gameState?.score, aiCrossGameSuggestion, isLoadingState]);

  const handleShareResult = () => {
    if (!gameState) return;
    const pangrams = gameState.foundWords.filter((w: string) => gameState.puzzle.pangrams.includes(w)).length;
    const shareData = generateLetterLogicShareMessage(gameState.score, gameState.foundWords.length, pangrams, "Word Bloom"); // Example puzzle name
    shareGameResult(shareData);
  };

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const { writer, editor } = getAttributionForDate(dateStr);

  const dailyPuzzle = getLetterLogicForDate(selectedArchiveIndex !== null ? new Date(2025, 0, 1 + selectedArchiveIndex) : today);
  const archiveList = letterLogicArchive2025;
  const isUnlocked = (index: number) => {
    const today = new Date();
    const archiveDate = new Date(2025, 0, 1 + index);
    return archiveDate <= today;
  };

  useEffect(() => {
    // When archive selection changes, update the puzzle
    if (selectedArchiveIndex !== null) {
      const archivePuzzle = getLetterLogicForDate(new Date(2025, 0, 1 + selectedArchiveIndex));
      if (archivePuzzle) setCurrentPuzzle(archivePuzzle);
    } else {
      setCurrentPuzzle(getTodayLetterLogicPuzzle());
    }
  }, [selectedArchiveIndex]);

  if (isLoadingState || !gameState) {
    return (<View style={[styles.container, styles.centeredLoading]}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading Game...</Text></View>);
  }

  const { puzzle: currentPuzzleData, foundWords: currentFoundWords, currentInput: currentWordInput, score: currentScore } = gameState;

  return (
    <View style={styles.container}>
      {/* Attribution Banner */}
      <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#007AFF' }}>By {writer}</Text>
        <Text style={{ fontSize: 13, color: '#888' }}>Edited by {editor}</Text>
      </View>
      <Text style={styles.title}>Letter Logic</Text>
      <View style={styles.scoreContainer}><Text style={styles.scoreText}>Score: {currentScore}</Text>{scoreFeedback ? <Text style={styles.scoreFeedbackText}>{scoreFeedback}</Text> : null}</View>
      <View style={styles.letterDisplayContainer}>
        <View style={styles.wordBloom_center}>{renderLetterButton(centerLetter, true)}</View>
        <View style={styles.wordBloom_petalsContainer}>
          {outerLetters.map((letter: string, index: number) => (
  <TouchableOpacity key={index} style={[styles.letterButton, letter === centerLetter && styles.centerLetterButton]} onPress={() => handleLetterPress(letter)}>
    <Text style={styles.letterButtonText}>{letter}</Text>
  </TouchableOpacity>
))}
        </View>
      </View>
      <Text style={styles.currentInputDisplay}>{currentWordInput || ' '}</Text>
      <View style={styles.controls}><Button title="Delete" onPress={handleDelete} color={Colors.error} /><Button title="Shuffle" onPress={handleShuffle} color={Colors.secondary} /><Button title="Submit" onPress={handleSubmit} color={Colors.primary} /></View>
      {aiMessage && !aiCrossGameSuggestion && (<View style={styles.aiMessageContainer}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'}:</Text><Text style={styles.aiMessageText}>{aiMessage.text}</Text></View>)}
      {aiCrossGameSuggestion && (currentFoundWords.length === currentPuzzle.validWords.length) && (<View style={[styles.aiMessageContainer, styles.suggestionContainer]}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'} suggests:</Text><Text style={styles.aiMessageText}>{aiCrossGameSuggestion.text}</Text><Button title={`Let's try it!`} onPress={() => handleSuggestionNavigation(aiCrossGameSuggestion.text)} color={Colors.accent} /></View>)}
      <Text style={styles.foundWordsTitle}>Found Words ({currentFoundWords.length} / {currentPuzzle.validWords.length}):</Text>
      <FlatList data={currentFoundWords.sort()} renderItem={({ item }: { item: string }) => (<Text style={[styles.foundWordItem, item === lastFoundWord && styles.lastFoundWordHighlight]}>{item}</Text>)} keyExtractor={(item: string, idx: number) => `ll_${idx}`}/>
      {currentFoundWords.length === currentPuzzle.validWords.length && <Text style={styles.allWordsFound}>All words found!</Text>}
      <View style={styles.bottomActionsContainer}>
        {(currentFoundWords.length === currentPuzzle.validWords.length || (currentScore > 0 && currentFoundWords.length > 0)) && (<View style={styles.actionButtonWrapper}><Button title="Play Again" onPress={() => {
            setGameState(initializeLetterLogicState(currentPuzzle));
            setScoreFeedback(''); setLastFoundWord(null); setAiCrossGameSuggestion(null); setGameStartTime(Date.now());
            const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.LETTER_LOGIC, triggerType: AITriggerType.GAME_START }); setAiMessage(initialResponse);
        }} color={Colors.primary}/></View>)}
        {(currentFoundWords.length > 0 || currentScore > 0) && (<View style={styles.actionButtonWrapper}><Button title="Share Progress" onPress={handleShareResult} color={Colors.accent} /></View>)}
      </View>
      <View style={{ margin: 10 }}>
        <Button title={archiveVisible ? "Hide Archive" : "Show Archive"} onPress={() => setArchiveVisible((v: boolean) => !v)} color={Colors.secondary} />
      </View>
      {archiveVisible && (
        <FlatList
          data={archiveList}
          keyExtractor={(item: string, idx: number) => `ll_${idx}`}
          renderItem={({ item, index }: { item: string, index: number }) => {
            const unlocked = isUnlocked(index);
            return (
              <TouchableOpacity
                onPress={() => { if (unlocked) { setSelectedArchiveIndex(index); setArchiveVisible(false); } }}
                disabled={!unlocked}
                style={{ opacity: unlocked ? 1 : 0.4 }}
              >
                <Text style={{ color: unlocked ? Colors.primary : Colors.disabled, padding: 8 }}>
                  {`Letter Logic - ${(new Date(2025, 0, 1 + index)).toDateString()} ${unlocked ? '' : '(Locked)'}`}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={{ maxHeight: 200, backgroundColor: Colors.surface, borderRadius: 8, marginBottom: 10 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: Spacing.large, backgroundColor: Colors.background },
  centeredLoading: { justifyContent: 'center' },
  loadingText: { marginTop: Spacing.medium, fontSize: FontSizes.large, color: Colors.textSecondary },
  title: { fontSize: FontSizes.xxl, fontWeight: 'bold', marginBottom: Spacing.medium, color: Colors.textPrimary },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.medium },
  scoreText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
  scoreFeedbackText: { fontSize: FontSizes.large, color: Colors.success, marginLeft: Spacing.small, fontWeight: 'bold' },
  letterDisplayContainer: { minHeight: 220, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.large, position: 'relative' },
  wordBloom_center: { zIndex: 1 },
  wordBloom_petalsContainer: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: '50%', left: '50%', marginTop: -95, marginLeft: -95 },
  wordBloom_petalWrapper: { position: 'absolute' },
  letterButton: { width: 55, height: 55, borderRadius: BorderRadius.round, backgroundColor: Colors.letterLogicPetal, justifyContent: 'center', alignItems: 'center', margin: Spacing.xs, elevation: 2, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  centerLetterButton: { backgroundColor: Colors.letterLogicCenter, width: 65, height: 65, borderRadius: BorderRadius.round, elevation: 3 },
  letterButtonText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
  currentInputDisplay: { fontSize: FontSizes.xxl, fontWeight: 'bold', borderBottomWidth: 2, borderColor: Colors.primary, color: Colors.textPrimary, paddingHorizontal: Spacing.medium, minHeight: FontSizes.xxxl, marginBottom: Spacing.large, textAlign: 'center', minWidth: '60%' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginBottom: Spacing.large },
  aiMessageContainer: { marginTop: Spacing.small, marginBottom: Spacing.medium, padding: Spacing.medium, backgroundColor: Colors.surface, borderRadius: BorderRadius.medium, width: '90%', alignSelf: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  suggestionContainer: { backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary },
  aiPersonality: { fontWeight: 'bold', fontSize: FontSizes.large, color: Colors.textPrimary },
  aiMessageText: { fontSize: FontSizes.medium, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.small, color: Colors.textSecondary },
  foundWordsTitle: { fontSize: FontSizes.xl, fontWeight: '600', color: Colors.textPrimary, alignSelf: 'flex-start', marginTop: Spacing.small, marginBottom: Spacing.small },
  foundWordsList: { width: '100%', maxHeight: 180 },
  foundWordItem: { fontSize: FontSizes.large, color: Colors.textSecondary, marginVertical: Spacing.xs, marginHorizontal: Spacing.small, padding: Spacing.xs, borderRadius: BorderRadius.small, width: '30%' },
  lastFoundWordHighlight: { backgroundColor: Colors.success + '30', color: Colors.success, fontWeight: 'bold' },
  allWordsFound: { fontSize: FontSizes.xl, color: Colors.success, fontWeight: 'bold', marginTop: Spacing.medium, marginBottom: Spacing.medium },
  bottomActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginTop: Spacing.medium },
  actionButtonWrapper: { marginHorizontal: Spacing.xs, flex: 1 }
});

export default LetterLogicScreen;
