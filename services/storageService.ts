

import { HistoryItem, QuizResult, Language, AnalysisResult } from '../types';

// Base keys
const HISTORY_PREFIX = 'studygenius_history_';
const RESULTS_PREFIX = 'studygenius_results_';
const ANALYSIS_PREFIX = 'studygenius_analysis_';
const THEME_KEY = 'studygenius_theme';
const LANG_KEY = 'studygenius_lang';

// Helper to get user-specific key
const getUserKey = (prefix: string, userId: string) => `${prefix}${userId}`;

export const saveToHistory = (item: HistoryItem, userId: string): void => {
  try {
    const key = getUserKey(HISTORY_PREFIX, userId);
    const historyJson = localStorage.getItem(key);
    const history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Add new item to start, limit to 50 for logged in users
    const updatedHistory = [item, ...history].slice(0, 50);
    localStorage.setItem(key, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (userId: string): HistoryItem[] => {
  try {
    const key = getUserKey(HISTORY_PREFIX, userId);
    const historyJson = localStorage.getItem(key);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (e) {
    console.error("Failed to fetch history", e);
    return [];
  }
};

export const updateHistoryItem = (id: string, updates: Partial<HistoryItem>, userId: string): void => {
  try {
    const key = getUserKey(HISTORY_PREFIX, userId);
    const historyJson = localStorage.getItem(key);
    if (!historyJson) return;
    
    const history: HistoryItem[] = JSON.parse(historyJson);
    const index = history.findIndex(item => item.id === id);
    
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(key, JSON.stringify(history));
    }
  } catch (e) {
    console.error("Failed to update history item", e);
  }
};

export const saveQuizResult = (result: QuizResult, userId: string): void => {
  try {
    const key = getUserKey(RESULTS_PREFIX, userId);
    const resultsJson = localStorage.getItem(key);
    const results: QuizResult[] = resultsJson ? JSON.parse(resultsJson) : [];
    
    const updatedResults = [result, ...results].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(updatedResults));
  } catch (e) {
    console.error("Failed to save result", e);
  }
};

export const getQuizResults = (userId: string): QuizResult[] => {
  try {
    const key = getUserKey(RESULTS_PREFIX, userId);
    const resultsJson = localStorage.getItem(key);
    return resultsJson ? JSON.parse(resultsJson) : [];
  } catch (e) {
    return [];
  }
};

export const saveAnalysis = (analysis: AnalysisResult, userId: string): void => {
  try {
    const key = getUserKey(ANALYSIS_PREFIX, userId);
    localStorage.setItem(key, JSON.stringify(analysis));
  } catch (e) {
    console.error("Failed to save analysis", e);
  }
};

export const getAnalysis = (userId: string): AnalysisResult | null => {
  try {
    const key = getUserKey(ANALYSIS_PREFIX, userId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

// Global Preferences (Device specific, not user specific)
export const getStoredTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const saveStoredTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(THEME_KEY, theme);
};

export const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === Language.ARABIC) return Language.ARABIC;
  return Language.ENGLISH;
};

export const saveStoredLanguage = (lang: Language): void => {
  localStorage.setItem(LANG_KEY, lang);
};