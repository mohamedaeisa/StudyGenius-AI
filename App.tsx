
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import ConfigForm from './components/ConfigForm';
import NoteDisplay from './components/NoteDisplay';
import QuizDisplay from './components/QuizDisplay';
import HomeworkDisplay from './components/HomeworkDisplay';
import Dashboard from './components/Dashboard';
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
  UserPreferences
} from './types';
import { generateStudyNotes, generateQuiz, checkHomework } from './services/geminiService';
import { saveToHistory, getStoredLanguage } from './services/storageService';
import { loginUser, getActiveUser, logoutUser, loginGuest } from './services/authService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [isLoading, setIsLoading] = useState(false);
  const [appLanguage, setAppLanguage] = useState<Language>(getStoredLanguage());
  
  // Application Data States
  const [noteData, setNoteData] = useState<StudyNoteData | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [homeworkData, setHomeworkData] = useState<HomeworkData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);

  // Initialize Auth
  useEffect(() => {
    const activeUser = getActiveUser();
    if (activeUser) {
      setCurrentUser(activeUser);
      // Ensure we start at HOME if logged in, or stick to current if reloaded
      setCurrentView(AppView.HOME);
    } else {
      setCurrentView(AppView.AUTH);
    }
  }, []);

  const handleLogin = (email: string, name: string, preferences: UserPreferences) => {
    const user = loginUser(email, name, preferences);
    setCurrentUser(user);
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
  };

  const handleGeneration = async (request: GenerationRequest) => {
    if (!currentUser) return;
    
    setIsLoading(true);
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
        setCurrentView(AppView.HOMEWORK);
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
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (item.type === 'note') {
      setNoteData(item.data as StudyNoteData);
      setCurrentView(AppView.NOTES);
    } else if (item.type === 'quiz') {
      setQuizData(item.data as QuizData);
      setCurrentView(AppView.QUIZ);
    } else if (item.type === 'homework') {
      setHomeworkData(item.data as HomeworkData);
      setCurrentView(AppView.HOMEWORK);
    }
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
            appLanguage={appLanguage}
            user={currentUser}
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
      case AppView.DASHBOARD:
        return currentUser ? (
          <Dashboard 
            onLoadItem={handleLoadHistory} 
            appLanguage={appLanguage}
            user={currentUser}
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
