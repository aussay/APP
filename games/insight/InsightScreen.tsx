import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Button, ActivityIndicator, AppState as RNAppState, FlatList, SafeAreaView } from 'react-native';
import { insightArchive2025 } from './archive/2025';
import { getTodayInsightPuzzle, initializeInsightState, updateUserGridCell, saveInsightState, loadInsightState, clearSavedInsightState, getInsightForDate, getInsightArchiveUpToDate } from './logic';
import { InsightGameState, UserGridState, LogicPuzzleCategory } from './types';
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
import { generateInsightShareMessage, shareGameResult } from '../../utils/sharingHelper';
import { getAttributionForDate } from '../../utils/game-attribution';

const InsightScreen: React.FC = () => {
  const currentPuzzleId = 'today';
  const defaultInitialState = initializeInsightState(getTodayInsightPuzzle());

  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(getTodayInsightPuzzle());
  const [gameState, setGameState] = useState<InsightGameState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [scoreFeedback, setScoreFeedback] = useState<string>('');
  const [justCorrectedCellCoords, setJustCorrectedCellCoords] = useState<{ pItem: string; catId: string } | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const gameStateRef = useRef(gameState);
  const [aiMessage, setAiMessage] = useState<AIResponse | null>(null);
  const [aiCrossGameSuggestion, setAiCrossGameSuggestion] = useState<AIResponse | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { showAchievementNotification } = useAchievementNotification();
  const appState = useRef(RNAppState.currentState);
  const isFocused = useIsFocused();

  const { puzzle, userGrid, isComplete, score, lastScoreChange } = gameState || defaultInitialState;
  const prevIsComplete = useRef<boolean>(gameState ? gameState.isComplete : false);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const attemptLoadState = async () => {
      if (isFocused) {
        setIsLoadingState(true);
        const loadedState = await loadInsightState(currentPuzzleId, getTodayInsightPuzzle());
        if (loadedState) {
          setGameState(loadedState);
          if (!loadedState.isComplete) setGameStartTime(Date.now()); else setGameStartTime(null);
        } else {
          const newGame = initializeInsightState(getTodayInsightPuzzle());
          setGameState(newGame); setGameStartTime(Date.now());
        }
        setIsLoadingState(false);
      }
    };
    attemptLoadState();
  }, [currentPuzzleId, isFocused]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const saveCurrentState = () => {
      if (gameState && !gameState.isComplete) saveInsightState(gameState);
      else if (gameState && gameState.isComplete) clearSavedInsightState(currentPuzzleId);
    };
    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {}
      else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) saveCurrentState();
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); saveCurrentState(); };
  }, [gameState, currentPuzzleId, isLoadingState]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const availablePersonalities = ['logician', 'deductive_detective'];
    if (!aiSimulatorInstance.getActivePersonality() || !availablePersonalities.includes(aiSimulatorInstance.getActivePersonality()!.id)) {
      aiSimulatorInstance.setActivePersonality(availablePersonalities[Math.floor(Math.random() * availablePersonalities.length)]);
    }
    if (!gameState.isComplete && gameState.score === 0 && Object.values(gameState.userGrid).every(row => Object.values(row).every(cell => cell === null))) {
        const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.GAME_START });
        setAiMessage(initialResponse);
    }
    setAiCrossGameSuggestion(null);
  }, [isLoadingState, gameState]);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentCellToEdit, setCurrentCellToEdit] = useState<{ pItem: string; catId: string } | null>(null);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);

  const handleCellPress = (primaryItem: string, categoryId: string) => {
    if (!gameState || isLoadingState || gameState.isComplete) return;
    const category = gameState.puzzle.categories.find(c => c.id === categoryId);
    if (category) {
      setAvailableOptions(category.items);
      setCurrentCellToEdit({ pItem: primaryItem, catId: categoryId });
      setModalVisible(true);
    }
  };

  const handleOptionSelect = (option: string | null) => {
    if (!gameState || !currentCellToEdit || isLoadingState) return;
    const { pItem, catId } = currentCellToEdit;
    const isCorrectPlacement = option !== null && gameState.puzzle.solution[pItem]?.[catId] === option;
    const wasPreviouslyCorrect = gameState.userGrid[pItem]?.[catId] === gameState.puzzle.solution[pItem]?.[catId];
    setGameState(prev => {
      if (!prev) return null;
      const newState = updateUserGridCell(prev, pItem, catId, option);
      if (isCorrectPlacement && !wasPreviouslyCorrect) {
          setJustCorrectedCellCoords({ pItem, catId }); setTimeout(() => setJustCorrectedCellCoords(null), 700);
          const correctResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.CORRECT_ACTION, currentScore: newState.score });
          if(correctResponse) setAiMessage(correctResponse);
      } else if (!isCorrectPlacement && option !== null) {
          const incorrectResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.INCORRECT_ACTION });
          if(incorrectResponse) setAiMessage(incorrectResponse);
      }
      return newState;
    });
    setModalVisible(false); setCurrentCellToEdit(null);
  };

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.lastScoreChange > 0) {
      setScoreFeedback(`+${gameState.lastScoreChange}`); const timer = setTimeout(() => setScoreFeedback(''), 1000); return () => clearTimeout(timer);
    } else if (gameState.lastScoreChange < 0) {
      setScoreFeedback(`${gameState.lastScoreChange}`); const timer = setTimeout(() => setScoreFeedback(''), 1000); return () => clearTimeout(timer);
    }
  }, [gameState?.lastScoreChange, gameState?.score, isLoadingState]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    const gameIsCurrentlyComplete = gameState.isComplete;
    if (gameIsCurrentlyComplete && !prevIsComplete.current) {
      const solveTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : undefined;
      finalizeGameSession(GameKey.INSIGHT, true, solveTime)
        .then((statsResult: StatsUpdateResult) => {
            if (statsResult.unlockedAchievements) {
                statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
            }
        }).catch(err => console.error('Error finalizing Insight session:', err));
      const winResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.GAME_WIN, currentScore: gameState.score });
      setAiMessage(winResponse); setAiCrossGameSuggestion(null);
      setTimeout(() => { const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.CROSS_GAME_SUGGESTION }); setAiCrossGameSuggestion(suggestionResponse);}, 1500);
    }
    prevIsComplete.current = gameIsCurrentlyComplete;
  }, [gameState?.isComplete, gameState?.score, isLoadingState, showAchievementNotification, gameStartTime]);

  const handleSuggestionNavigation = (suggestedGameText: string) => {
    const SuggMap: {[key:string]: keyof RootStackParamList | undefined} = { "letter logic": "LetterLogic", "word wise": "WordWise" };
    let navTo: keyof RootStackParamList | undefined;
    for (const key in SuggMap) { if(suggestedGameText.toLowerCase().includes(key)) navTo = SuggMap[key]; }
    if (navTo) navigation.navigate(navTo as any); else console.warn("Cannot navigate to suggested game:", suggestedGameText);
    setAiCrossGameSuggestion(null);
  };

  const handleShareResult = () => {
    if (!gameState) return;
    const solveTime = gameState.isComplete && gameStartTime ? (Date.now() - gameStartTime) / 1000 : undefined;
    const shareData = generateInsightShareMessage(gameState.puzzle.title, gameState.isComplete, solveTime);
    shareGameResult(shareData);
  };

  const [archiveVisible, setArchiveVisible] = useState(false);
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const { writer, editor } = getAttributionForDate(dateStr);
  const dailyPuzzle = getInsightForDate(selectedArchiveIndex !== null ? new Date(2025, 0, 1 + selectedArchiveIndex) : today);
  const archiveList: any[] = [];
  const isUnlocked = (index: number) => {
    const today = new Date();
    const archiveDate = new Date(2025, 0, 1 + index);
    return archiveDate <= today;
  };

  useEffect(() => {
    // When archive selection changes, update the puzzle
    if (selectedArchiveIndex !== null) {
      const archivePuzzle = insightArchive2025[selectedArchiveIndex];
      if (archivePuzzle) setCurrentPuzzle(archivePuzzle);
    } else {
      setCurrentPuzzle(getTodayInsightPuzzle());
    }
  }, [selectedArchiveIndex]);

  if (isLoadingState || !gameState) {
    return (<View style={[styles.container, styles.centeredLoading]}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading Puzzle...</Text></View>);
  }
  const attributeCategories = gameState.puzzle.categories;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Attribution Banner */}
      <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#007AFF' }}>By {writer}</Text>
        <Text style={{ fontSize: 13, color: '#888' }}>Edited by {editor}</Text>
      </View>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{puzzle.title}</Text>
        <Text style={styles.description}>{puzzle.description}</Text>
        <View style={styles.scoreContainer}><Text style={styles.scoreText}>Score: {score}</Text>{scoreFeedback ? <Text style={styles.scoreFeedbackText}>{scoreFeedback}</Text> : null}</View>
        {aiMessage && !aiCrossGameSuggestion && (<View style={styles.aiMessageContainer}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'}:</Text><Text style={styles.aiMessageText}>{aiMessage.text}</Text></View>)}
        {aiCrossGameSuggestion && isComplete && (<View style={[styles.aiMessageContainer, styles.suggestionContainer]}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'} suggests:</Text><Text style={styles.aiMessageText}>{aiCrossGameSuggestion.text}</Text><Button title={`Let's try it!`} onPress={() => handleSuggestionNavigation(aiCrossGameSuggestion.text)} color={Colors.accent}/></View>)}
        {isComplete && <Text style={styles.completeText}>Puzzle Solved!</Text>}
        <View style={styles.cluesContainer}><Text style={styles.subHeader}>Clues:</Text>{puzzle.clues.map(clue => (<Text key={clue.id} style={styles.clueText}>- {clue.text}</Text>))}</View>
        <View style={styles.gridContainer}>
          <Text style={styles.subHeader}>Solution Grid:</Text>
          <View style={styles.gridRow}><View style={styles.gridCellHeader}><Text style={styles.gridHeaderText}>Item</Text></View>{attributeCategories.map((cat, catIndex) => (<View key={cat.id} style={[styles.gridCellHeader, (catIndex === attributeCategories.length -1) && styles.gridCell_lastCol]}><Text style={styles.gridHeaderText}>{cat.name}</Text></View>))}</View>
          {puzzle.primaryCategoryItems.map((pItem, pItemIndex) => (<View key={pItem} style={[styles.gridRow, (pItemIndex === puzzle.primaryCategoryItems.length -1) && styles.gridRow_last]}>
              <View style={[styles.gridCellRowHeader]}><Text style={styles.gridCellText}>{pItem}</Text></View>
              {attributeCategories.map((cat, catIndex) => {
                const isCellJustCorrected = justCorrectedCellCoords?.pItem === pItem && justCorrectedCellCoords?.catId === cat.id;
                return (<TouchableOpacity key={cat.id} style={[styles.gridCell, isCellJustCorrected && styles.justCorrectedCellHighlight, (catIndex === attributeCategories.length -1) && styles.gridCell_lastCol]} onPress={() => handleCellPress(pItem, cat.id)} disabled={isComplete}><Text style={styles.gridCellText}>{userGrid[pItem]?.[cat.id] || '?'}</Text></TouchableOpacity>);
              })}
            </View>))}
        </View>
        {isComplete && (<View style={styles.gameOverActionsContainer}><View style={styles.actionButtonWrapper}><Button title="Play Again" onPress={() => {
               setGameState(initializeInsightState(getTodayInsightPuzzle())); setScoreFeedback(''); setJustCorrectedCellCoords(null);
               setGameStartTime(Date.now()); setAiCrossGameSuggestion(null);
               const initialResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.INSIGHT, triggerType: AITriggerType.GAME_START });
               setAiMessage(initialResponse);
           }} color={Colors.primary}/></View><View style={styles.actionButtonWrapper}><Button title="Share Result" onPress={handleShareResult} color={Colors.accent} /></View></View>)}
        <View style={{ margin: 10 }}>
          <Button title={archiveVisible ? "Hide Archive" : "Show Archive"} onPress={() => setArchiveVisible(v => !v)} color={Colors.secondary} />
        </View>
        {archiveVisible && (
          <FlatList
            data={archiveList}
            keyExtractor={(item, idx) => `insight_${idx}`}
            renderItem={({ item, index }) => {
              const unlocked = isUnlocked(index);
              return (
                <TouchableOpacity
                  onPress={() => { if (unlocked) { setSelectedArchiveIndex(index); setArchiveVisible(false); } }}
                  disabled={!unlocked}
                  style={{ opacity: unlocked ? 1 : 0.4 }}
                >
                  <Text style={{ color: unlocked ? Colors.primary : Colors.disabled, padding: 8 }}>
                    {`Insight - ${(new Date(2025, 0, 1 + index)).toDateString()} ${unlocked ? '' : '(Locked)'}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 200, backgroundColor: Colors.surface, borderRadius: 8, marginBottom: 10 }}
          />
        )}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => { setModalVisible(!modalVisible); setCurrentCellToEdit(null); }}>
          <View style={styles.modalCenteredView}><View style={styles.modalView}><Text style={styles.modalText}>Select for {currentCellToEdit?.pItem} - {puzzle.categories.find(c=>c.id === currentCellToEdit?.catId)?.name}:</Text>
              {availableOptions.map(option => (<TouchableOpacity key={option} style={styles.optionButton} onPress={() => handleOptionSelect(option)}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>))}
              <TouchableOpacity style={[styles.optionButton, styles.clearButton]} onPress={() => handleOptionSelect(null)}><Text style={styles.optionText}>Clear</Text></TouchableOpacity>
              <Button title="Cancel" onPress={() => {setModalVisible(false); setCurrentCellToEdit(null);}} color={Colors.textSecondary} /></View></View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.medium, backgroundColor: Colors.background },
  centeredLoading: { flex:1, justifyContent: 'center', alignItems: 'center'},
  loadingText: { marginTop: Spacing.medium, fontSize: FontSizes.large, color: Colors.textSecondary },
  title: { fontSize: FontSizes.xxl, fontWeight: 'bold', textAlign: 'center', marginBottom: Spacing.medium, color: Colors.textPrimary },
  description: { fontSize: FontSizes.large, textAlign: 'center', marginBottom: Spacing.small, color: Colors.textSecondary },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.medium },
  scoreText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
  scoreFeedbackText: { fontSize: FontSizes.large, color: Colors.success, marginLeft: Spacing.small, fontWeight: 'bold' },
  aiMessageContainer: { marginTop: Spacing.small, marginBottom: Spacing.medium, padding: Spacing.medium, backgroundColor: Colors.surface, borderRadius: BorderRadius.medium, width: '95%', alignSelf: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  suggestionContainer: { backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary },
  aiPersonality: { fontWeight: 'bold', fontSize: FontSizes.large, color: Colors.textPrimary },
  aiMessageText: { fontSize: FontSizes.medium, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.small, color: Colors.textSecondary },
  completeText: { fontSize: FontSizes.xl, color: Colors.success, textAlign: 'center', marginVertical: Spacing.medium, fontWeight: 'bold' },
  subHeader: { fontSize: FontSizes.xl, fontWeight: '600', marginTop: Spacing.large, marginBottom: Spacing.small, color: Colors.textPrimary },
  cluesContainer: { marginBottom: Spacing.large, padding: Spacing.medium, backgroundColor: Colors.surface + '99', borderRadius: BorderRadius.medium },
  clueText: { fontSize: FontSizes.medium, marginBottom: Spacing.xs, color: Colors.textSecondary, lineHeight: FontSizes.large * 1.4 },
  gridContainer: { marginBottom: Spacing.large, backgroundColor: Colors.surface, borderRadius: BorderRadius.medium, borderWidth:1, borderColor: Colors.border, elevation: 1, padding: Spacing.xs },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  gridRow_last: { borderBottomWidth: 0 },
  gridCell: { flex: 1, padding: Spacing.small, borderRightWidth: 1, borderRightColor: Colors.border, justifyContent: 'center', alignItems: 'center', minHeight: 48 },
  gridCell_lastCol: { borderRightWidth: 0 },
  justCorrectedCellHighlight: { backgroundColor: Colors.success + '40' },
  gridCellHeader: { flex: 1, padding: Spacing.small, backgroundColor: Colors.primary + '15', borderRightWidth: 1, borderRightColor: Colors.border, justifyContent: 'center', alignItems: 'center', minHeight: 40 },
  gridCellRowHeader: { flex: 1, padding: Spacing.small, backgroundColor: Colors.secondary + '15', borderRightWidth: 1, borderRightColor: Colors.border, justifyContent: 'flex-start', alignItems: 'center', paddingLeft: Spacing.medium },
  gridHeaderText: { fontWeight: 'bold', fontSize: FontSizes.medium, textAlign: 'center', color: Colors.textPrimary },
  gridCellText: { fontSize: FontSizes.medium, textAlign: 'center', color: Colors.textSecondary },
  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { margin: Spacing.large, backgroundColor: Colors.surface, borderRadius: BorderRadius.large, padding: Spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%' },
  modalText: { marginBottom: Spacing.medium, textAlign: 'center', fontSize: FontSizes.xl, color: Colors.textPrimary },
  optionButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.medium, padding: Spacing.medium, elevation: 2, marginBottom: Spacing.medium, width: '100%' },
  clearButton: { backgroundColor: Colors.error },
  optionText: { color: Colors.textLight, fontWeight: 'bold', textAlign: 'center', fontSize: FontSizes.large },
  buttonWrapper: { width: '60%', marginVertical: Spacing.medium, alignSelf: 'center' },
  gameOverActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginTop: Spacing.medium },
  actionButtonWrapper: { marginHorizontal: Spacing.xs, flex: 1 }
});

export default InsightScreen;
