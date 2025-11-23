

export enum AppView {
  AUTH = 'AUTH',
  HOME = 'HOME',
  NOTES = 'NOTES',
  QUIZ = 'QUIZ',
  HOMEWORK = 'HOMEWORK',
  DASHBOARD = 'DASHBOARD'
}

export enum EducationSystem {
  STANDARD = 'Standard',
  IGCSE = 'IGCSE',
  IB = 'IB',
  THANAWEYA_AMMA = 'Thanaweya Amma',
  CAMBRIDGE = 'Cambridge'
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

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  joinedAt: number;
}

export interface GenerationRequest {
  year: string;
  curriculum: EducationSystem;
  subject: string;
  topic: string;
  mode: 'notes' | 'quiz' | 'homework';
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
  type: 'note' | 'quiz' | 'homework';
  title: string;
  timestamp: number;
  data: StudyNoteData | QuizData | HomeworkData;
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