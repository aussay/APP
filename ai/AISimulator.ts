import {
  AIPersonality,
  AIResponseContext,
  AIResponse,
  AITriggerType,
  AISimulatorConfig,
  AIPersonalityBehavior,
  AIBehaviorRule,
} from './types';

// --- AI Personalities Definitions ---
const personalities: AIPersonality[] = [
  // Existing from previous phases
  { id: 'puzzlemaster', name: 'The Puzzlemaster' },
  { id: 'whimsical_weaver', name: 'Whimsical Weaver' },
  { id: 'lexicon_prime', name: 'LexiCon Prime' },
  { id: 'lucky_charm', name: 'Lucky Charm' },
  { id: 'lexicon_master', name: 'The Lexicon Master' },
  { id: 'enigmatic_encoder', name: 'The Enigmatic Encoder' },
  { id: 'connectionist', name: 'The Connectionist' },
  { id: 'category_captain', name: 'The Category Captain' },
  { id: 'logician', name: 'The Logician' },
  { id: 'deductive_detective', name: 'The Deductive Detective' },

  // New Phase 8 Personalities
  { id: 'oracle', name: 'The Oracle' },
  { id: 'dude', name: 'The Dude' },
  { id: 'glitch', name: 'The Glitch' },
  { id: 'monolith', name: 'The Monolith' },
  { id: 'cheerleader', name: 'The Cheerleader' },
  { id: 'rival', name: 'The Rival' },
  { id: 'mentor', name: 'The Mentor' },
];

const getRandomResponse = (responses: string[], emotion: AIResponse['emotion'] = 'neutral'): AIResponse => ({ text: responses[Math.floor(Math.random() * responses.length)], emotion });

// --- Behavior Rules (Existing full + New Samples) ---

// PUZZLE GRID Rules (Copied from previous full definition for Puzzlemaster & Whimsical Weaver)
const puzzlemasterPuzzleGridRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
  [AITriggerType.GAME_START]: [ () => ({ text: "Let's see how you fare against this mental labyrinth.", emotion: 'neutral' }), () => ({ text: "The grid awaits your intellect. Begin.", emotion: 'neutral' }), ],
  [AITriggerType.MILESTONE_REACHED]: [ (context) => { if (context.progressPercentage && context.progressPercentage >= 50 && context.progressPercentage < 75) { return { text: "Halfway there. Don't lose focus now.", emotion: 'encouraging' }; } if (context.progressPercentage && context.progressPercentage >= 75 && context.progressPercentage < 100) { return { text: "Impressive. Victory is within your grasp.", emotion: 'encouraging' }; } return null; }, ],
  [AITriggerType.GAME_WIN]: [ () => ({ text: "A worthy effort. You've bested the grid!", emotion: 'happy' }), () => ({ text: "Excellent work. The puzzle is solved.", emotion: 'happy' }), ],
  [AITriggerType.INCORRECT_ACTION]: [ () => ({text: "Hmm, that doesn't seem quite right. Re-evaluate.", emotion: 'neutral'}) ],
  [AITriggerType.HINT_REQUESTED]: [ () => ({text: "A true puzzler relies on their own wit... but very well, consider this a nudge.", emotion: 'neutral'}) ],
  [AITriggerType.CROSS_GAME_SUGGESTION]: [ () => ({ text: "Perhaps a mental flexing of a different sort? Why not try Word Wise?", emotion: 'neutral' }), ],
};
const whimsicalWeaverPuzzleGridRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
  [AITriggerType.GAME_START]: [ () => getRandomResponse(["Ooh, a new pattern to weave!", "Let's thread these words together, shall we?"], 'happy'), ],
  [AITriggerType.CORRECT_ACTION]: [ () => getRandomResponse(["Nicely placed!", "That fits just so!", "Like a thread in a tapestry!"]) ],
  [AITriggerType.GAME_WIN]: [ () => getRandomResponse(["What a beautiful design we've made!", "All woven together perfectly!"], 'happy'), ],
  [AITriggerType.INCORRECT_ACTION]: [ () => getRandomResponse(["Oops, a slight tangle in the threads!", "Hmm, let's try reweaving that bit."]) ],
  [AITriggerType.CROSS_GAME_SUGGESTION]: [ () => ({ text: "That was fun! Fancy linking up some ideas in Link Up next?", emotion: 'happy' }), ],
};

// WORD WISE Rules (Copied from previous full definition)
const lexiconPrimeWordWiseRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules from Phase 2 */
    [AITriggerType.GAME_START]: [() => ({text: "LexiCon Prime activated. Target word acquired.", emotion: 'smug'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "Target neutralized. Performance: Acceptable.", emotion: 'smug'})],
    [AITriggerType.GAME_LOSE]: [() => ({text: "Target uncompromised. Linguistic capabilities: Insufficient.", emotion: 'smug'})],
    [AITriggerType.INCORRECT_ACTION]: [(context) => context.guessesMade === 1 ? {text:"Attempt logged.", emotion: 'neutral'} : {text:"Recalibrate.", emotion: 'neutral'}],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Spatial reasoning of Link Up may prove stimulating.", emotion: 'smug'})],
};
const luckyCharmWordWiseRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules from Phase 2 */
    [AITriggerType.GAME_START]: [() => getRandomResponse(["May luck be on your side!", "Feeling lucky?"], 'happy')],
    [AITriggerType.GAME_WIN]: [() => getRandomResponse(["You got it! Lucky guess, or pure skill?", "Woohoo!"], 'happy')],
    [AITriggerType.GAME_LOSE]: [() => getRandomResponse(["Aw, shucks! Better luck next time!", "Almost!"], 'encouraging')],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Feeling lucky? Try Puzzle Grid!", emotion: 'happy'})],
};

// LETTER LOGIC Rules (Copied from previous full definition)
const lexiconMasterLetterLogicRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "The lexicon awaits.", emotion: 'neutral'})],
    [AITriggerType.PANGRAM_FOUND]: [() => ({text: "A pangram! Excellent.", emotion: 'happy'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "Impressive collection.", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Consider Word Wise.", emotion: 'neutral'})],
};
const enigmaticEncoderLetterLogicRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "The letters hold messages.", emotion: 'neutral'})],
    [AITriggerType.PANGRAM_FOUND]: [() => ({text: "Core code revealed!", emotion: 'happy'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "The words reveal themselves.", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Test your patterns in Insight.", emotion: 'neutral'})],
};

// LINK UP Rules (Copied from previous full definition)
const connectionistLinkUpRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "Observe. Connect.", emotion: 'neutral'})],
    [AITriggerType.CORRECT_ACTION]: [() => ({text: "Logical grouping.", emotion: 'happy'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "All connections mapped.", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Try Puzzle Grid.", emotion: 'neutral'})],
};
const categoryCaptainLinkUpRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "Let's sort these squads!", emotion: 'happy'})],
    [AITriggerType.CORRECT_ACTION]: [() => getRandomResponse(["Great sorting!"], 'happy')],
    [AITriggerType.GAME_WIN]: [() => ({text: "All categories secured!", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "How about Letter Logic?", emotion: 'happy'})],
};

// INSIGHT Rules (Copied from previous full definition)
const logicianInsightRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "Deduce the solution.", emotion: 'neutral'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "Flawless deduction.", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Apply that mind to Letter Logic.", emotion: 'neutral'})],
};
const deductiveDetectiveInsightRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = { /* Full rules */
    [AITriggerType.GAME_START]: [() => ({text: "The game is afoot!", emotion: 'neutral'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "Case closed!", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "Uncover words in Word Wise.", emotion: 'neutral'})],
};

// Phase 8 Personalities Samples
const oracleRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [() => ({text: "The threads of fate align. What will you uncover?", emotion: 'neutral'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "As foreseen. The solution was always within.", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "The mists point towards Insight.", emotion: 'neutral'})],
};
const dudeRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [() => ({text: "Alright, man, let's do this. No pressure.", emotion: 'neutral'})],
    [AITriggerType.GAME_WIN]: [() => ({text: "Right on! Totally nailed it, dude!", emotion: 'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [() => ({text: "That was chill. Maybe some Letter Logic?", emotion: 'neutral'})],
};
const glitchLetterLogicRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [()=>({text:"L04d1ng... PuZzL3 M45t3r Gl1tch M0d3!", emotion:'neutral'})],
    [AITriggerType.PANGRAM_FOUND]: [()=>({text:"P4ngr4m_d3t3ct3d! ALL YOUR BASE ARE BELONG TO US!", emotion:'happy'})],
    [AITriggerType.INCORRECT_ACTION]: [()=>getRandomResponse(["404: Word not found.", "Does not compute."], 'neutral')],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [()=>({text:"Want... m04r... d4t4? Try... L1nkUp.exe", emotion:'neutral'})]
};
const monolithInsightRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [()=>({text:"Observe. Deduce. Transcend.", emotion:'neutral'})],
    [AITriggerType.CORRECT_ACTION]: [()=>({text:"...", emotion:'neutral'})],
    [AITriggerType.GAME_WIN]: [()=>({text:"Clarity.", emotion:'neutral'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [()=>({text:"The grid... awaits.", emotion:'neutral'})]
};
const cheerleaderLinkUpRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [()=>({text:"You got this! Let's make some amazing connections! Wooo!", emotion:'happy'})],
    [AITriggerType.CORRECT_ACTION]: [()=>getRandomResponse(["Awesome grouping!", "That's the spirit!"], 'happy')],
    [AITriggerType.GAME_WIN]: [()=>({text:"YES! Victory! You totally rocked that!", emotion:'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [()=>({text:"Let's spell it out in Letter Logic next! Go team!", emotion:'happy'})]
};
const rivalWordWiseRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [()=>({text:"Alright, let's see if you've gotten any better. Doubt it.", emotion:'smug'})],
    [AITriggerType.GAME_WIN]: [()=>({text:"Hmph. Lucky guess. I'd have gotten it faster.", emotion:'smug'})],
    [AITriggerType.GAME_LOSE]: [()=>({text:"Ha! Too easy. Better luck next time.", emotion:'taunting'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [()=>({text:"Maybe a simple Puzzle Grid is more your speed?", emotion:'taunting'})]
};
const mentorPuzzleGridRules: Partial<Record<AITriggerType, AIBehaviorRule[]>> = {
    [AITriggerType.GAME_START]: [()=>({text:"Welcome. Each puzzle is a lesson. Let's begin.", emotion:'neutral'})],
    [AITriggerType.HINT_REQUESTED]: [()=>({text:"A hint can guide, but true understanding comes from within.", emotion:'neutral'})],
    [AITriggerType.GAME_WIN]: [()=>({text:"Well done. Reflect on your process.", emotion:'happy'})],
    [AITriggerType.CROSS_GAME_SUGGESTION]: [()=>({text:"To hone your skills, I recommend Insight.", emotion:'neutral'})]
};

const behaviors: AIPersonalityBehavior[] = [
  { personalityId: 'puzzlemaster', gameSpecificRules: { 'puzzle_grid': puzzlemasterPuzzleGridRules } },
  { personalityId: 'whimsical_weaver', gameSpecificRules: { 'puzzle_grid': whimsicalWeaverPuzzleGridRules } },
  { personalityId: 'lexicon_prime', gameSpecificRules: { 'word_wise': lexiconPrimeWordWiseRules } },
  { personalityId: 'lucky_charm', gameSpecificRules: { 'word_wise': luckyCharmWordWiseRules } },
  { personalityId: 'lexicon_master', gameSpecificRules: { 'letter_logic': lexiconMasterLetterLogicRules } },
  { personalityId: 'enigmatic_encoder', gameSpecificRules: { 'letter_logic': enigmaticEncoderLetterLogicRules } },
  { personalityId: 'connectionist', gameSpecificRules: { 'link_up': connectionistLinkUpRules } },
  { personalityId: 'category_captain', gameSpecificRules: { 'link_up': categoryCaptainLinkUpRules } },
  { personalityId: 'logician', gameSpecificRules: { 'insight': logicianInsightRules } },
  { personalityId: 'deductive_detective', gameSpecificRules: { 'insight': deductiveDetectiveInsightRules } },
  { personalityId: 'oracle', gameSpecificRules: { 'puzzle_grid': oracleRules, 'insight': oracleRules }, generalRules: oracleRules },
  { personalityId: 'dude', gameSpecificRules: { 'word_wise': dudeRules, 'link_up': dudeRules }, generalRules: dudeRules },
  { personalityId: 'glitch', gameSpecificRules: { 'letter_logic': glitchLetterLogicRules } },
  { personalityId: 'monolith', gameSpecificRules: { 'insight': monolithInsightRules } },
  { personalityId: 'cheerleader', gameSpecificRules: { 'link_up': cheerleaderLinkUpRules, 'word_wise': cheerleaderLinkUpRules } }, // Example for multiple games
  { personalityId: 'rival', gameSpecificRules: { 'word_wise': rivalWordWiseRules, 'puzzle_grid': rivalWordWiseRules } }, // Example for multiple games
  { personalityId: 'mentor', gameSpecificRules: { 'puzzle_grid': mentorPuzzleGridRules, 'insight': mentorPuzzleGridRules } }, // Example for multiple games
];

export class AISimulator {
  private config: AISimulatorConfig;
  private activePersonalityId: string | null = null;
  constructor(config?: Partial<AISimulatorConfig>) {
    this.config = {
      personalities: config?.personalities || personalities,
      behaviors: config?.behaviors || behaviors,
      defaultPersonalityId: config?.defaultPersonalityId || personalities[0]?.id,
    };
    this.activePersonalityId = this.config.defaultPersonalityId || null;
  }
  public setActivePersonality(personalityId: string | null ): boolean {
    if (personalityId === null) { this.activePersonalityId = null; return true; }
    const personalityExists = this.config.personalities.some(p => p.id === personalityId);
    if (personalityExists) { this.activePersonalityId = personalityId; return true; }
    console.warn(`AI Personality ID "${personalityId}" not found.`); return false;
  }
  public getActivePersonality(): AIPersonality | null {
    if (!this.activePersonalityId) return null;
    return this.config.personalities.find(p => p.id === this.activePersonalityId) || null;
  }
  public getAllPersonalities(): AIPersonality[] { return this.config.personalities; }
  public getResponse(context: AIResponseContext): AIResponse | null {
    if (!this.activePersonalityId) return null;
    const behavior = this.config.behaviors.find(b => b.personalityId === this.activePersonalityId);
    if (!behavior) { console.warn(`No behavior for AI ID "${this.activePersonalityId}".`); return null; }
    let applicableRules: AIBehaviorRule[] = [];
    if (behavior.gameSpecificRules[context.gameId] && behavior.gameSpecificRules[context.gameId][context.triggerType]) {
      applicableRules = behavior.gameSpecificRules[context.gameId][context.triggerType]!;
    } else if (behavior.generalRules && behavior.generalRules[context.triggerType]) {
      applicableRules = behavior.generalRules[context.triggerType]!;
    }
    if (applicableRules.length > 0) {
      const rule = applicableRules[Math.floor(Math.random() * applicableRules.length)];
      const response = rule(context);
      if (response) return response;
    }
    return null;
  }
}
const aiSimulatorInstance = new AISimulator();
export default aiSimulatorInstance;
