import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Dimensions, Button, AppState as RNAppState, ActivityIndicator, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { puzzleGridArchive2025 } from './archive/2025';
import { getTodayPuzzleGrid, initializePuzzleGridState, handleLetterInput, checkCompletion, savePuzzleGridState, loadPuzzleGridState, getPuzzleGridForDate, getPuzzleGridArchiveUpToDate } from './logic';
import { PuzzleGridState, PuzzleGridCell } from './types';
import aiSimulatorInstance from '../../ai/AISimulator';
import { AITriggerType, AIResponse } from '../../ai/types';
import { finalizeGameSession, StatsUpdateResult, updateGameStreak } from '../../store/statisticsService';
import { GameKey } from '../../types/statistics';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../styles/theme';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { checkAndUnlockAchievements, Achievement } from '../../store/achievementService';
import { useAchievementNotification } from '../../context/AchievementNotificationContext';
import { getAttributionForDate } from '../../utils/game-attribution';

const CELL_SIZE = Dimensions.get('window').width / 11;

const PuzzleGridScreen: React.FC = () => {
  // Replace samplePuzzleDataForGridScreen with the daily puzzle for today
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const { writer, editor } = getAttributionForDate(dateStr);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<Date | null>(null);
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState(getTodayPuzzleGrid());
  const dailyPuzzle = getPuzzleGridForDate(selectedArchiveDate || today);
  const archiveList = getPuzzleGridArchiveUpToDate(today);
  const isUnlocked = (date: Date) => date <= today;
  const currentPuzzleId = dailyPuzzle?.id || 'unavailable';
  const defaultInitialState = dailyPuzzle ? initializePuzzleGridState(dailyPuzzle) : null;

  const [gameState, setGameState] = useState<PuzzleGridState | null>(null);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [aiMessage, setAiMessage] = useState<AIResponse | null>(null);
  const [aiCrossGameSuggestion, setAiCrossGameSuggestion] = useState<AIResponse | null>(null);
  const [scoreFeedback, setScoreFeedback] = useState<string>('');
  const [justCorrectedCell, setJustCorrectedCell] = useState<{ x: number; y: number} | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);

  const gameStateRef = useRef(gameState);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const appState = useRef(RNAppState.currentState);
  const isFocused = useIsFocused();
  const { showAchievementNotification } = useAchievementNotification();

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    const attemptLoadState = async () => {
      if(isFocused) {
        setIsLoadingState(true);
        if (!dailyPuzzle) {
          setGameState(null);
          setIsLoadingState(false);
          return;
        }
        const loadedState = await loadPuzzleGridState(currentPuzzleId, dailyPuzzle);
        if (loadedState) {
          setGameState(loadedState);
          if (!loadedState.isComplete) setGameStartTime(Date.now()); else setGameStartTime(null);
        } else {
          const newGame = initializePuzzleGridState(dailyPuzzle);
          setGameState(newGame); setGameStartTime(Date.now());
        }
        setIsLoadingState(false);
      }
    };
    attemptLoadState();
  }, [isFocused, currentPuzzleId]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    aiSimulatorInstance.setActivePersonality('puzzlemaster');
    if (!Object.keys(gameState.userLetters).length && !gameState.isComplete) { // Only if truly new/reset
        const response = aiSimulatorInstance.getResponse({ gameId: GameKey.PUZZLE_GRID, triggerType: AITriggerType.GAME_START });
        setAiMessage(response);
    }
    if (!gameState.isComplete) setAiCrossGameSuggestion(null);
  }, [isLoadingState, gameState]);

  useEffect(() => {
    if (isLoadingState || !gameState) return;
    const saveCurrentState = () => {
      if (gameState && !gameState.isComplete) savePuzzleGridState(currentPuzzleId, gameState);
      else if (gameState && gameState.isComplete) savePuzzleGridState(currentPuzzleId, gameState);
    };
    const subscription = RNAppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {}
      else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) saveCurrentState();
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); saveCurrentState(); };
  }, [gameState, currentPuzzleId, isLoadingState]);

  useEffect(() => {
    if (isLoadingState || !gameState || gameState.isComplete) return;
    const prevIsComplete = gameStateRef.current?.isComplete; // Get previous complete status from ref
    const currentlyComplete = checkCompletion(gameState.gridData, gameState.userLetters);

    if (currentlyComplete && !prevIsComplete) { // Check if it just became complete
        setGameState(prev => prev ? ({ ...prev, isComplete: true }) : null);

        const winResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.PUZZLE_GRID, triggerType: AITriggerType.GAME_WIN, currentScore: gameState.score });
        setAiMessage(winResponse);
        setTimeout(() => {
            const suggestionResponse = aiSimulatorInstance.getResponse({ gameId: GameKey.PUZZLE_GRID, triggerType: AITriggerType.CROSS_GAME_SUGGESTION });
            setAiCrossGameSuggestion(suggestionResponse);
        }, 1500);
        const solveTime = gameStartTime ? (Date.now() - gameStartTime) / 1000 : undefined;
        finalizeGameSession(GameKey.PUZZLE_GRID, true, solveTime)
            .then((statsResult: StatsUpdateResult) => { // Use StatsUpdateResult type
                if (statsResult.unlockedAchievements) {
                    statsResult.unlockedAchievements.forEach(ach => showAchievementNotification(ach));
                }
                // Update streak for Puzzle Grid
                updateGameStreak(GameKey.PUZZLE_GRID).then(() => {
                  // Optionally, refresh UI or show streak feedback here
                });
            })
            .catch(err => console.error('Error finalizing Puzzle Grid session:', err));
    }
  }, [gameState?.userLetters, gameState?.gridData, isLoadingState, gameStartTime, showAchievementNotification, gameState?.score, gameState?.isComplete]);

  useEffect(() => {
    if (!gameState || isLoadingState) return;
    if (gameState.lastScoreChange > 0) { setScoreFeedback(`+${gameState.lastScoreChange}`); const timer = setTimeout(() => setScoreFeedback(''), 1000); return () => clearTimeout(timer); }
    else if (gameState.lastScoreChange < 0) { setScoreFeedback(`${gameState.lastScoreChange}`); const timer = setTimeout(() => setScoreFeedback(''), 1000); return () => clearTimeout(timer); }
  }, [gameState?.lastScoreChange, isLoadingState]);

  const handleCellPress = (cell: PuzzleGridCell) => {
    if (!gameState || isLoadingState || cell.isBlack || gameState.isComplete) return;
    setSelectedCell({ x: cell.x, y: cell.y });
    setInputValue(gameState.userLetters[`${cell.x},${cell.y}`] || '');
  };

  const onInputChange = (text: string) => {
    if (!gameState || isLoadingState) return;
    setInputValue(text);
    if (selectedCell && text.length <= 1) {
      const newLetter = text.toUpperCase();
      const prevBoardState = { ...gameState.userLetters };
      setGameState(prev => {
        if (!prev) return null;
        const newState = handleLetterInput(prev, selectedCell!, newLetter || null);
        const currentCellKey = `${selectedCell!.x},${selectedCell!.y}`;
        const currentGridCell = newState.gridData.cells[selectedCell!.y][selectedCell!.x];
        const previousLetterInCell = prevBoardState[currentCellKey];
        const isNowCorrect = newState.userLetters[currentCellKey] === currentGridCell.correctLetter;
        const wasPreviouslyCorrect = previousLetterInCell === currentGridCell.correctLetter;
        if (isNowCorrect && !wasPreviouslyCorrect) { setJustCorrectedCell({ x: selectedCell!.x, y: selectedCell!.y }); setTimeout(() => setJustCorrectedCell(null), 500); }
        return newState;
      });
      if (text.length === 1) { setSelectedCell(null); setInputValue('');}
    } else if (selectedCell && text.length === 0) {
        setGameState(prev => prev ? handleLetterInput(prev, selectedCell, null) : null);
    }
  };

  const flatGridData = useMemo(() => {
    if (!gameState || !gameState.gridData || !gameState.gridData.cells) return [];
    return gameState.gridData.cells.flat();
  }, [gameState?.gridData]);

  const renderCell = ({ item }: { item: PuzzleGridCell }) => {
    if (!gameState) return null;
    if (item.isBlack) return <View style={[styles.cell, styles.blackCell]} />;
    const cellKey = `${item.x},${item.y}`;
    const isSelected = selectedCell?.x === item.x && selectedCell?.y === item.y;
    const isJustCorrected = justCorrectedCell?.x === item.x && justCorrectedCell?.y === item.y;
    return ( <View style={[styles.cell, styles.whiteCell, isSelected ? styles.selectedCell : {}, isJustCorrected ? styles.justCorrectedCell : {}]} onTouchEnd={() => handleCellPress(item)}><Text style={styles.cellNumber}>{item.number || ''}</Text><Text style={styles.cellText}>{gameState.userLetters[cellKey] || ''}</Text></View>);
  };

  const handleSuggestionNavigation = (suggestedGame: string) => {
    const SuggMap: {[key:string]: keyof RootStackParamList | undefined} = {"word wise": "WordWise", "letter logic": "LetterLogic", "link up": "LinkUp", "insight": "Insight"};
    let navTo: keyof RootStackParamList | undefined;
    for (const key in SuggMap) { if(suggestedGame.toLowerCase().includes(key)) navTo = SuggMap[key]; }
    if (navTo) navigation.navigate(navTo as any); else console.warn("Cannot navigate to suggested game:", suggestedGame);
    setAiCrossGameSuggestion(null);
  };

  const handleArchiveSelect = (date: Date) => {
    setSelectedArchiveDate(date);
    setArchiveVisible(false);
  };

  // Remove or define handleShareResult to fix error
  const handleShareResult = () => {};

  useEffect(() => {
    // When archive selection changes, update the puzzle
    if (selectedArchiveIndex !== null) {
      const archivePuzzle = puzzleGridArchive2025[selectedArchiveIndex];
      if (archivePuzzle) setCurrentPuzzle(archivePuzzle);
    } else {
      setCurrentPuzzle(getTodayPuzzleGrid());
    }
  }, [selectedArchiveIndex]);

  if (isLoadingState || !gameState) {
    return (<View style={[styles.container, styles.centeredLoading]}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading Puzzle...</Text></View>);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Attribution Banner */}
      <View style={{ padding: 12, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#007AFF' }}>By {writer}</Text>
        <Text style={{ fontSize: 13, color: '#888' }}>Edited by {editor}</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>{gameState.gridData.title}</Text>
        <View style={styles.scoreContainer}><Text style={styles.scoreText}>Score: {gameState.score}</Text>{scoreFeedback ? <Text style={styles.scoreFeedbackText}>{scoreFeedback}</Text> : null}</View>
        {gameState.isComplete && <Text style={styles.completeText}>Puzzle Complete!</Text>}
        <View style={styles.gridOuterContainer}><FlatList data={flatGridData} renderItem={renderCell} keyExtractor={(item, index) => `cell-${item.x}-${item.y}-${index}`} numColumns={gameState.gridData.gridSize.cols} style={{ width: gameState.gridData.gridSize.cols * CELL_SIZE }} scrollEnabled={false} columnWrapperStyle={styles.row} /></View>
        {selectedCell && !gameState.isComplete && (<View style={styles.inputContainer}><Text style={styles.inputPromptText}>Enter letter for cell ({selectedCell.x+1}, {selectedCell.y+1}):</Text><TextInput style={styles.textInput} value={inputValue} onChangeText={onInputChange} maxLength={1} autoFocus onBlur={() => setSelectedCell(null)} /></View>)}
        <ScrollView style={styles.cluesSectionScroll} contentContainerStyle={styles.cluesSectionContent}>
              <Text style={styles.clueTitle}>Across</Text>
              {gameState.gridData.words.filter(w => w.direction === 'across').map(word => (<Text key={word.id} style={styles.clueText}>{gameState.gridData.cells[word.startCell.y][word.startCell.x].number}. {word.clue}</Text>))}
              <Text style={styles.clueTitle}>Down</Text>
              {gameState.gridData.words.filter(w => w.direction === 'down').map(word => (<Text key={word.id} style={styles.clueText}>{gameState.gridData.cells[word.startCell.y][word.startCell.x].number}. {word.clue}</Text>))}
        </ScrollView>
        {aiMessage && !aiCrossGameSuggestion && (<View style={styles.aiMessageContainer}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'}:</Text><Text style={styles.aiMessageText}>{aiMessage.text}</Text></View>)}
        {aiCrossGameSuggestion && gameState.isComplete && (<View style={[styles.aiMessageContainer, styles.suggestionContainer]}><Text style={styles.aiPersonality}>{aiSimulatorInstance.getActivePersonality()?.name || 'AI'} suggests:</Text><Text style={styles.aiMessageText}>{aiCrossGameSuggestion.text}</Text><Button title={`Try ${aiCrossGameSuggestion.text.includes("Word Wise") ? "Word Wise" : "another game" }!`} onPress={() => handleSuggestionNavigation(aiCrossGameSuggestion.text)} color={Colors.secondary} /></View>)}
        {gameState.isComplete && (<View style={styles.gameOverActionsContainer}><View style={styles.actionButtonWrapper}><Button title="Play Again" onPress={() => {
                      setGameState(initializePuzzleGridState(getTodayPuzzleGrid()));
                      setScoreFeedback(''); setJustCorrectedCell(null); setAiCrossGameSuggestion(null); setGameStartTime(Date.now());
                      const response = aiSimulatorInstance.getResponse({ gameId: GameKey.PUZZLE_GRID, triggerType: AITriggerType.GAME_START });
                      setAiMessage(response);
                  }} color={Colors.primary} /></View><View style={styles.actionButtonWrapper}><Button title="Share Result" onPress={handleShareResult} color={Colors.accent} /></View></View>)}
        <View style={{ margin: 10 }}>
          <Button title={archiveVisible ? "Hide Archive" : "Show Archive"} onPress={() => setArchiveVisible(v => !v)} color={Colors.secondary} />
        </View>
        {archiveVisible && (
          <FlatList
            data={archiveList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const itemDate = new Date(item.title.split(' - ')[1]);
              const unlocked = isUnlocked(itemDate);
              return (
                <TouchableOpacity
                  onPress={() => { if (unlocked) { setSelectedArchiveDate(itemDate); setArchiveVisible(false); } }}
                  disabled={!unlocked}
                  style={{ opacity: unlocked ? 1 : 0.4 }}
                >
                  <Text style={{ color: unlocked ? Colors.primary : Colors.disabled, padding: 8 }}>
                    {item.title} {unlocked ? '' : '(Locked)'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 200, backgroundColor: Colors.surface, borderRadius: 8, marginBottom: 10 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: Spacing.large, backgroundColor: Colors.background },
  centeredLoading: { justifyContent: 'center' },
  loadingText: { marginTop: Spacing.medium, fontSize: FontSizes.large, color: Colors.textSecondary },
  title: { fontSize: FontSizes.xxl, fontWeight: 'bold', marginBottom: Spacing.medium, color: Colors.textPrimary },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.medium },
  scoreText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
  scoreFeedbackText: { fontSize: FontSizes.large, color: Colors.success, marginLeft: Spacing.small, fontWeight: 'bold' },
  completeText: { fontSize: FontSizes.xl, color: Colors.success, marginBottom: Spacing.medium, fontWeight: 'bold' },
  gridOuterContainer: { padding: Spacing.xs, backgroundColor: Colors.surface, borderRadius: BorderRadius.small, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: Spacing.xs },
  row: {},
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  blackCell: { backgroundColor: Colors.puzzleGridBlackCell },
  whiteCell: { backgroundColor: Colors.puzzleGridCell },
  selectedCell: { backgroundColor: Colors.primary, opacity: 0.7 },
  justCorrectedCell: { backgroundColor: Colors.success, opacity: 0.8 },
  cellText: { fontSize: CELL_SIZE * 0.55, fontWeight: 'bold', color: Colors.textPrimary },
  cellNumber: { position: 'absolute', top: 1, left: 2, fontSize: CELL_SIZE * 0.28, color: Colors.textSecondary },
  inputContainer: { marginTop: Spacing.small, paddingHorizontal: Spacing.large, alignItems: 'center', width: '100%' },
  inputPromptText: { fontSize: FontSizes.medium, color: Colors.textSecondary, marginBottom: Spacing.small },
  textInput: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, padding: Spacing.small, width: 120, textAlign: 'center', fontSize: FontSizes.xl, borderRadius: BorderRadius.small, color: Colors.textPrimary },
  cluesSectionScroll: { maxHeight: 150, width: '95%', marginTop: Spacing.small, flexGrow: 0 },
  cluesSectionContent: { paddingBottom: Spacing.large },
  clueTitle: { fontSize: FontSizes.large, fontWeight: '600', marginTop: Spacing.small, color: Colors.textPrimary },
  clueText: { fontSize: FontSizes.medium, marginLeft: Spacing.small, color: Colors.textSecondary, lineHeight: FontSizes.large * 1.4 },
  aiMessageContainer: { marginTop: Spacing.small, padding: Spacing.medium, backgroundColor: Colors.surface, borderRadius: BorderRadius.medium, width: '90%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  suggestionContainer: { backgroundColor: Colors.secondary+'20', borderColor: Colors.secondary },
  aiPersonality: { fontWeight: 'bold', fontSize: FontSizes.medium, color: Colors.textPrimary },
  aiMessageText: { fontSize: FontSizes.medium, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.small, color: Colors.textSecondary },
  gameOverActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '80%', marginTop: Spacing.medium },
  actionButtonWrapper: { marginHorizontal: Spacing.small, flex: 1 }
  // Removed playAgainButtonContainer as gameOverActionsContainer serves a similar purpose for layout
});

export default PuzzleGridScreen;
