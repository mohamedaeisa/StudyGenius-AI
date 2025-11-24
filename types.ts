
export enum AppView {
  AUTH = 'AUTH',
  HOME = 'HOME',
  NOTES = 'NOTES',
  QUIZ = 'QUIZ',
  HOMEWORK = 'HOMEWORK',
  DASHBOARD = 'DASHBOARD',
  FLASHCARDS = 'FLASHCARDS',
  GAMIFICATION = 'GAMIFICATION',
  PODCAST = 'PODCAST',
  CHEAT_SHEET = 'CHEAT_SHEET'
}

export enum EducationSystem {
  STANDARD = 'Standard',
  IGCSE = 'IGCSE',
  IB = 'IB',
  THANAWEYA_AMMA = 'Thanaweya Amma',
  CAMBRIDGE = 'NEIS (Cambridge)',
  AMERICAN = 'American Diploma (eST)'
}

export enum Language {
  ENGLISH = 'English',
  ARABIC = 'Arabic'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum DetailLevel {
  SHORT = 'Short',
  MEDIUM = 'Medium',
  DETAILED = 'Detailed'
}

export enum QuizType {
  MCQ = 'Multiple Choice',
  TRUE_FALSE = 'True/False',
  MIXED = 'Mixed'
}

export interface UserPreferences {
  defaultYear: string;
  defaultCurriculum: EducationSystem;
  defaultLanguage: Language;
}

// --- Gamification Types ---
export interface Badge {
  id: string;
  icon: string;
  nameKey: string; // Translation key
  descKey: string; // Translation key
  condition: (user: UserProfile, historyCount: number) => boolean;
}

export interface UserGamification {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: number; // Timestamp of last activity
  earnedBadges: string[]; // Array of Badge IDs
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  joinedAt: number;
  gamification: UserGamification; // Added field
}

export interface GenerationRequest {
  year: string;
  curriculum: EducationSystem;
  subject: string;
  topic: string;
  mode: 'notes' | 'quiz' | 'homework' | 'flashcards' | 'lazy' | 'podcast' | 'cheat-sheet';
  language: Language;
  // Notes specific
  difficulty?: Difficulty;
  detailLevel?: DetailLevel;
  // Quiz specific
  quizType?: QuizType;
  questionCount?: number;
  // Homework specific
  homeworkImage?: string; // Base64 string
  homeworkMimeType?: string;
  // Lazy (YouTube) specific
  youtubeUrl?: string;
  transcriptText?: string;
  // Podcast specific
  podcastLength?: 'Short' | 'Medium' | 'Long';
  podcastVoice?: 'Male' | 'Female';
}

export interface StudyNoteData {
  title: string;
  summary: string;
  markdownContent: string;
  mermaidCode?: string;
  timestamp: number;
}

export interface QuizQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  title: string;
  topic: string;
  questions: QuizQuestion[];
  timestamp: number;
}

export interface HomeworkData {
  title: string;
  feedback: string;
  originalImage?: string;
  timestamp: number;
}

export interface PodcastData {
  title: string;
  topic: string;
  script: string;
  audioBase64: string;
  timestamp: number;
}

export interface CheatSheetData {
  title: string;
  topic: string;
  content: string;
  timestamp: number;
}

export interface QuizResult {
  id: string;
  topic: string;
  score: number;
  total: number;
  percentage: number;
  date: number;
}

export interface HistoryItem {
  id: string;
  type: 'note' | 'quiz' | 'homework' | 'flashcards' | 'lazy' | 'podcast' | 'cheat-sheet';
  title: string;
  timestamp: number;
  data: StudyNoteData | QuizData | HomeworkData | FlashcardSet | PodcastData | CheatSheetData;
  tags?: string[];
}

export interface AnalysisResult {
  overallStatus: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  masteryLevel: number;
  timestamp: number;
}

// --- Types for Adaptive Learning & Flashcards ---

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReview: number; // Timestamp
  interval: number;   // Days
  easeFactor: number; // Multiplier (default 2.5)
  repetitions: number;
}

export interface FlashcardSet {
  topic: string;
  cards: Flashcard[];
}

export interface LearningPathItem {
  id: string;
  topic: string;
  description: string;
  type: 'notes' | 'quiz' | 'flashcards'; // Changed from 'note' to 'notes' to match GenerationRequest
  difficulty: 'Easy' | 'Medium' | 'Hard'; // Added for granularity
  status: 'locked' | 'available' | 'completed';
  reason: string; 
}

export interface LearningPath {
  subject: string;
  items: LearningPathItem[];
  generatedAt: number;
}
