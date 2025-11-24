
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import ConfigForm from './components/ConfigForm';
import NoteDisplay from './components/NoteDisplay';
import QuizDisplay from './components/QuizDisplay';
import HomeworkDisplay from './components/HomeworkDisplay';
import Dashboard from './components/Dashboard';
import FlashcardReview from './components/FlashcardReview';
import GamificationScreen from './components/GamificationScreen';
import PodcastPlayer from './components/PodcastPlayer';
import CheatSheetDisplay from './components/CheatSheetDisplay';
import VivaMode from './components/VivaMode';
import { Analytics } from '@vercel/analytics/react';
import { 
  AppView, 
  GenerationRequest, 
  StudyNoteData, 
  QuizData, 
  HomeworkData,
  HistoryItem,
  Language,
  UserProfile,
  UserPreferences,
  Flashcard,
  FlashcardSet,
  PodcastData,
  CheatSheetData
} from './types';
import { generateStudyNotes, generateQuiz, checkHomework, generateFlashcards, generateLazyGuide, generatePodcast, generateCheatSheet } from './services/geminiService';
import { saveToHistory, getStoredLanguage, saveFlashcards } from './services/storageService';
import { loginUser, getActiveUser, logoutUser, loginGuest } from './services/authService';
import { awardXP, checkStreak, checkBadges } from './services/gamificationService';
import { XP_REWARDS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>(''); // New state for granular progress
  const [appLanguage, setAppLanguage] = useState<Language>(getStoredLanguage());
  
  // Application Data States
  const [noteData, setNoteData] = useState<StudyNoteData | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);
  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [cheatSheetData, setCheatSheetData] = useState<CheatSheetData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);
  
  // Flashcards Review State
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);

  // Config Prefill (for Learning Path)
  const [configPrefill, setConfigPrefill] = useState<Partial<GenerationRequest> | undefined>(undefined);

  // Initialize Auth & Gamification Streak
  useEffect(() => {
    const activeUser = getActiveUser();
    if (activeUser) {
      // Check streaks on load
      const streakUpdatedUser = checkStreak(activeUser);
      setCurrentUser(streakUpdatedUser);
      setCurrentView(AppView.HOME);
    } else {
      setCurrentView(AppView.AUTH);
    }
  }, []);

  const handleGamificationUpdate = (user: UserProfile, xpAmount: number) => {
    const { user: xpUser, levelUp } = awardXP(user, xpAmount);
    const { user: badgedUser, newBadges } = checkBadges(xpUser);
    
    setCurrentUser(badgedUser);
    
    // Simple alert for now, could be a toast later
    if (levelUp) alert("🎉 Level Up! You are now Level " + badgedUser.gamification.level);
    if (newBadges.length > 0) alert("🏅 New Badge Unlocked!");
  };

  const handleLogin = (email: string, name: string, preferences: UserPreferences) => {
    const user = loginUser(email, name, preferences);
    // Initial check
    const updated = checkStreak(user);
    setCurrentUser(updated);
    setCurrentView(AppView.HOME);
  };

  const handleGuestLogin = () => {
    const user = loginGuest();
    setCurrentUser(user);
    setCurrentView(AppView.HOME);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentView(AppView.AUTH);
    setNoteData(null);
    setQuizData(null);
    setHomeworkData(null);
    setPodcastData(null);
    setCheatSheetData(null);
  };

  const handleGeneration = async (request: GenerationRequest) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setLoadingStatus('Initializing...');
    setCurrentLanguage(request.language);

    try {
      if (request.mode === 'notes') {
        const data = await generateStudyNotes(request);
        setNoteData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'note',
          title: data.title,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        handleGamificationUpdate(currentUser, XP_REWARDS.GENERATE_NOTE);
        setCurrentView(AppView.NOTES);
      } else if (request.mode === 'quiz') {
        const data = await generateQuiz(request);
        setQuizData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'quiz',
          title: data.title,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        setCurrentView(AppView.QUIZ);
      } else if (request.mode === 'homework') {
        const data = await checkHomework(request);
        setHomeworkData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'homework',
          title: data.title,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        handleGamificationUpdate(currentUser, XP_REWARDS.CHECK_HOMEWORK);
        setCurrentView(AppView.HOMEWORK);
      } else if (request.mode === 'flashcards') {
        const data = await generateFlashcards(request);
        saveFlashcards(data.cards, currentUser.id);
        saveToHistory({
          id: Date.now().toString(),
          type: 'flashcards',
          title: `Flashcards: ${data.topic}`,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        setReviewCards(data.cards);
        setCurrentView(AppView.FLASHCARDS);
      } else if (request.mode === 'lazy') {
        // Pass callback for progress updates
        const data = await generateLazyGuide(request, (status) => setLoadingStatus(status));
        setNoteData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'lazy',
          title: `📺 ${data.title}`,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        handleGamificationUpdate(currentUser, XP_REWARDS.GENERATE_NOTE);
        setCurrentView(AppView.NOTES);
      } else if (request.mode === 'podcast') {
        // Pass callback for progress updates
        const data = await generatePodcast(request, (status) => setLoadingStatus(status));
        setPodcastData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'podcast',
          title: data.title,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        handleGamificationUpdate(currentUser, XP_REWARDS.LISTEN_PODCAST);
        setCurrentView(AppView.PODCAST);
      } else if (request.mode === 'cheat-sheet') {
        const data = await generateCheatSheet(request);
        setCheatSheetData(data);
        saveToHistory({
          id: Date.now().toString(),
          type: 'cheat-sheet',
          title: `Sheet: ${data.topic}`,
          timestamp: Date.now(),
          data: data
        }, currentUser.id);
        
        handleGamificationUpdate(currentUser, XP_REWARDS.GENERATE_CHEAT_SHEET);
        setCurrentView(AppView.CHEAT_SHEET);
      }
    } catch (error: any) {
      console.error("Generation failed", error);
      let msg = "Something went wrong with the AI generation.";
      if (error.message) {
        msg += `\n\nError details: ${error.message}`;
        if (error.message.includes('API Key') || error.message.includes('401') || error.message.includes('403')) {
          msg += "\n\nPlease check your API Key configuration in the deployment settings.";
        }
      }
      alert(msg);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
      setConfigPrefill(undefined);
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    if (currentUser) {
      let xp = XP_REWARDS.COMPLETE_QUIZ;
      if (score === total) xp += XP_REWARDS.PERFECT_SCORE;
      handleGamificationUpdate(currentUser, xp);
    }
    setCurrentView(AppView.HOME); // Or stay?
  };

  const handleFlashcardComplete = () => {
    if (currentUser) {
      handleGamificationUpdate(currentUser, XP_REWARDS.REVIEW_SESSION);
    }
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (item.type === 'note' || item.type === 'lazy') {
      setNoteData(item.data as StudyNoteData);
      setCurrentView(AppView.NOTES);
    } else if (item.type === 'quiz') {
      setQuizData(item.data as QuizData);
      setCurrentView(AppView.QUIZ);
    } else if (item.type === 'homework') {
      setHomeworkData(item.data as HomeworkData);
      setCurrentView(AppView.HOMEWORK);
    } else if (item.type === 'flashcards') {
      const set = item.data as FlashcardSet;
      setReviewCards(set.cards);
      setCurrentView(AppView.FLASHCARDS);
    } else if (item.type === 'podcast') {
      setPodcastData(item.data as PodcastData);
      setCurrentView(AppView.PODCAST);
    } else if (item.type === 'cheat-sheet') {
      setCheatSheetData(item.data as CheatSheetData);
      setCurrentView(AppView.CHEAT_SHEET);
    }
  };

  const handleStartReview = (cards: Flashcard[]) => {
    setReviewCards(cards);
    setCurrentView(AppView.FLASHCARDS);
  };

  const handleStartPathItem = (req: Partial<GenerationRequest>) => {
    setConfigPrefill(req);
    setCurrentView(AppView.HOME);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.AUTH:
        return (
          <AuthScreen 
            onLogin={handleLogin} 
            onGuestLogin={handleGuestLogin}
            appLanguage={appLanguage} 
          />
        );
      case AppView.HOME:
        return currentUser ? (
          <ConfigForm 
            onSubmit={handleGeneration} 
            isLoading={isLoading} 
            loadingStatus={loadingStatus} // Pass the status
            appLanguage={appLanguage}
            user={currentUser}
            prefill={configPrefill}
            onNavigate={setCurrentView}
          />
        ) : null;
      case AppView.NOTES:
        return noteData ? (
          <NoteDisplay 
            data={noteData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.QUIZ:
        return quizData && currentUser ? (
          <QuizDisplay 
            data={quizData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            language={currentLanguage}
            appLanguage={appLanguage}
            userId={currentUser.id}
            onComplete={(score, total) => handleQuizComplete(score, total)} 
          />
        ) : null;
      case AppView.HOMEWORK:
        return homeworkData ? (
          <HomeworkDisplay 
            data={homeworkData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.FLASHCARDS:
        return currentUser ? (
          <FlashcardReview 
            cards={reviewCards} 
            onComplete={handleFlashcardComplete} 
            userId={currentUser.id}
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.PODCAST:
        return podcastData ? (
          <PodcastPlayer 
            data={podcastData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.CHEAT_SHEET:
        return cheatSheetData ? (
          <CheatSheetDisplay 
            data={cheatSheetData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.DASHBOARD:
        return currentUser ? (
          <Dashboard 
            onLoadItem={handleLoadHistory} 
            appLanguage={appLanguage}
            user={currentUser}
            onReviewFlashcards={handleStartReview}
            onStartPathItem={handleStartPathItem}
          />
        ) : null;
      case AppView.GAMIFICATION:
        return currentUser ? (
          <GamificationScreen 
            user={currentUser}
            appLanguage={appLanguage}
          />
        ) : null;
      case AppView.VIVA:
        return currentUser ? (
          <VivaMode 
            user={currentUser}
            appLanguage={appLanguage}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        appLanguage={appLanguage} 
        setAppLanguage={setAppLanguage}
        user={currentUser}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
      <Analytics />
    </>
  );
};

export default App;
