
import { HistoryItem, QuizResult, Language, AnalysisResult, Flashcard, LearningPath, PodcastData } from '../types';

// Base keys
const HISTORY_PREFIX = 'studygenius_history_';
const RESULTS_PREFIX = 'studygenius_results_';
const ANALYSIS_PREFIX = 'studygenius_analysis_';
const FLASHCARDS_KEY = 'studygenius_flashcards_';
const LEARNING_PATH_KEY = 'studygenius_path_';
const THEME_KEY = 'studygenius_theme';
const LANG_KEY = 'studygenius_lang';

// Helper to get user-specific key
const getUserKey = (prefix: string, userId: string) => `${prefix}${userId}`;

// Helper to safely set item with quota management (Recursive Pruning)
const setItemWithRetry = (key: string, data: any[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      // Storage full. Prune data to fit.
      if (data.length > 1) {
        // Keep the newest half of the data
        const keepCount = Math.floor(data.length / 2);
        const pruned = data.slice(0, keepCount);
        console.warn(`Storage quota exceeded for ${key}. Pruning from ${data.length} to ${keepCount} items.`);
        setItemWithRetry(key, pruned);
      } else {
        console.error(`Storage quota exceeded for ${key}. Cannot save even a single item.`);
      }
    } else {
      console.error("Storage error", e);
    }
  }
};

export const saveToHistory = (item: HistoryItem, userId: string): void => {
  try {
    const key = getUserKey(HISTORY_PREFIX, userId);
    const historyJson = localStorage.getItem(key);
    const history: HistoryItem[] = historyJson ? JSON.parse(historyJson) : [];
    
    let itemToSave = item;

    // OPTIMIZATION: LocalStorage has a hard limit (~5MB).
    // Storing raw audio base64 (Podcasts) usually exceeds this immediately.
    // We strip the audio data for history storage to prevent app crashes.
    if (item.type === 'podcast') {
      const podcastData = item.data as PodcastData;
      if (podcastData.audioBase64 && podcastData.audioBase64.length > 100) {
        itemToSave = {
          ...item,
          data: {
            ...podcastData,
            audioBase64: '' // Strip audio, keep script
          }
        };
      }
    } 
    // Optional: Resize homework images if needed in future
    
    // Add new item to start
    const updatedHistory = [itemToSave, ...history];
    
    // Use robust save
    setItemWithRetry(key, updatedHistory);
  } catch (e) {
    console.error("Failed to save history logic", e);
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
      setItemWithRetry(key, history);
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
    
    const updatedResults = [result, ...results];
    setItemWithRetry(key, updatedResults);
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
    // Analysis is a single object, just save directly. 
    // If this fails, we can't prune it, so just try/catch.
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

// --- Flashcard Storage ---

export const saveFlashcards = (cards: Flashcard[], userId: string): void => {
  try {
    const key = getUserKey(FLASHCARDS_KEY, userId);
    const existingJson = localStorage.getItem(key);
    const existing: Flashcard[] = existingJson ? JSON.parse(existingJson) : [];
    
    // Merge: Append new cards
    const updated = [...existing, ...cards];
    setItemWithRetry(key, updated);
  } catch (e) {
    console.error("Failed to save flashcards", e);
  }
};

export const getFlashcards = (userId: string): Flashcard[] => {
  try {
    const key = getUserKey(FLASHCARDS_KEY, userId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const updateFlashcard = (updatedCard: Flashcard, userId: string): void => {
  try {
    const key = getUserKey(FLASHCARDS_KEY, userId);
    const existing = getFlashcards(userId);
    const index = existing.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      existing[index] = updatedCard;
      setItemWithRetry(key, existing);
    }
  } catch (e) {
    console.error("Failed to update flashcard", e);
  }
};

// --- Learning Path Storage ---

export const saveLearningPath = (path: LearningPath, userId: string): void => {
  try {
    const key = getUserKey(LEARNING_PATH_KEY, userId);
    localStorage.setItem(key, JSON.stringify(path));
  } catch (e) {
    console.error("Failed to save path", e);
  }
};

export const getLearningPath = (userId: string): LearningPath | null => {
  try {
    const key = getUserKey(LEARNING_PATH_KEY, userId);
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
};

export const updatePathItemStatus = (itemId: string, status: 'completed' | 'available', userId: string) => {
  const path = getLearningPath(userId);
  if (path) {
    const item = path.items.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      // Unlock next item if completed
      if (status === 'completed') {
        const idx = path.items.findIndex(i => i.id === itemId);
        if (idx + 1 < path.items.length) {
          path.items[idx + 1].status = 'available';
        }
      }
      saveLearningPath(path, userId);
    }
  }
};

// Global Preferences
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
