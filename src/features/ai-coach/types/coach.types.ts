export type MessageRole = 'user' | 'assistant';

export interface PlanExercise {
  name: string;
  prescription: string;
  load: string;
  loadNote: string;
  /** Visual emphasis for the load value / note (lime = progression, cyan = technique cue). */
  tone: 'progress' | 'neutral' | 'cue';
}

export interface WorkoutPlanSuggestion {
  rpe: number;
  exercises: PlanExercise[];
}

export interface CoachMessage {
  id: string;
  role: MessageRole;
  /** Supports `**bold**` emphasis. */
  text: string;
  /** Epoch ms. */
  createdAt: number;
  plan?: WorkoutPlanSuggestion;
  /** Shown on assistant guidance so it is never mistaken for medical advice. */
  showDisclaimer?: boolean;
}

export type ChipTone = 'lime' | 'cyan' | 'violet' | 'neutral';

export interface ContextChip {
  id: string;
  icon: string;
  label: string;
  tone: ChipTone;
}

export interface WeeklyAnalysis {
  windowLabel: string;
  recoveryPercent: number;
  recoveryLabel: string;
  recoveryTarget: string;
  volumeOverloadPercent: number;
  /** Plain text with `**bold**` emphasis. */
  summary: string;
}

export interface StrainDay {
  label: string;
  /** 0–1 */
  ratio: number;
  tone: 'lime' | 'cyan' | 'muted';
  isToday: boolean;
}

export interface CoachOverview {
  statusLabel: string;
  syncLabel: string;
  contextChips: ContextChip[];
  analysis: WeeklyAnalysis;
  strain: { title: string; caption: string; days: StrainDay[] };
}

export interface SuggestedPrompt {
  id: string;
  icon: string;
  tone: ChipTone;
  text: string;
}
