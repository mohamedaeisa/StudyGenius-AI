
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AuthScreen from './components/AuthScreen';
import ConfigForm from './components/ConfigForm';
import NoteDisplay from './components/NoteDisplay';
import QuizDisplay from './components/QuizDisplay';
import HomeworkDisplay from './components/HomeworkDisplay';
import Dashboard from './components/Dashboard';
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
    } catch (error) {
      console.error("Generation failed", error);
      alert("Something went wrong with the AI generation. Please try again.");
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
    if (currentView === AppView.AUTH) {
      return <AuthScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} appLanguage={appLanguage} />;
    }

    if (!currentUser) return null; // Should ideally redirect to AUTH

    switch (currentView) {
      case AppView.HOME:
        return <ConfigForm onSubmit={handleGeneration} isLoading={isLoading} appLanguage={appLanguage} user={currentUser} />;
      
      case AppView.NOTES:
        return noteData ? (
          <NoteDisplay 
            data={noteData} 
            onBack={() => setCurrentView(AppView.HOME)} 
            appLanguage={appLanguage}
          />
        ) : null;
      
      case AppView.QUIZ:
        return quizData ? (
          <QuizDisplay 
            data={quizData} 
            language={currentLanguage}
            onBack={() => setCurrentView(AppView.HOME)} 
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
        return <Dashboard onLoadItem={handleLoadHistory} appLanguage={appLanguage} user={currentUser} />;
      
      default:
        return <div>View Not Found</div>;
    }
  };

  return (
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
  );
};

export default App;
