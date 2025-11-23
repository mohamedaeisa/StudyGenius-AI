import React, { useState, useEffect } from 'react';
import { QuizData, QuizResult, Language, QuizQuestion } from '../types';
import { analyzeWeakness } from '../services/geminiService';
import { saveQuizResult } from '../services/storageService';
import { TRANSLATIONS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';

interface QuizDisplayProps {
  data: QuizData;
  onBack: () => void;
  language: Language;
  appLanguage: Language;
  userId: string;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ data, onBack, language, appLanguage, userId }) => {
  const t = TRANSLATIONS[appLanguage];
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(data.questions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [mode, setMode] = useState<'quiz' | 'flashcard'>('quiz');
  const [isFlipped, setIsFlipped] = useState(false);
  const [userMistakes, setUserMistakes] = useState<{id: number, question: string, userAnswer: string, correct: string}[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);

  useEffect(() => {
    setActiveQuestions(data.questions);
    setCurrentIdx(0);
    setScore(0);
    setUserMistakes([]);
    setIsAnswered(false);
    setQuizCompleted(false);
    setIsReviewMode(false);
    setAiAnalysis('');
    setAnalyzing(false);
  }, [data]);

  const currentQuestion = activeQuestions[currentIdx];

  // Helper to compare strings robustly (trim whitespace)
  const isCorrectOption = (opt: string, correct: string) => {
    return (opt || '').trim() === (correct || '').trim();
  };

  const handleAnswer = () => {
    if (!selectedOption) return;
    
    const isCorrect = isCorrectOption(selectedOption, currentQuestion.correctAnswer);
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setUserMistakes(prev => [...prev, {
        id: currentQuestion.id,
        question: currentQuestion.question,
        userAnswer: selectedOption,
        correct: currentQuestion.correctAnswer
      }]);
    }

    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx(curr => curr + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsFlipped(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    
    if (!isReviewMode) {
      const result: QuizResult = {
        id: Date.now().toString(),
        topic: data.topic,
        score: score,
        total: activeQuestions.length,
        percentage: Math.round((score / activeQuestions.length) * 100),
        date: Date.now()
      };
      saveQuizResult(result, userId);
    }

    if (userMistakes.length > 0 && !isReviewMode) {
      setAnalyzing(true);
      const mistakesForAI = userMistakes.map(({question, userAnswer, correct}) => ({question, userAnswer, correct}));
      const analysis = await analyzeWeakness(data.topic, mistakesForAI, language);
      setAiAnalysis(analysis);
      setAnalyzing(false);
    }
  };

  const startReviewMode = () => {
    const mistakeIds = new Set(userMistakes.map(m => m.id));
    const questionsToReview = data.questions.filter(q => mistakeIds.has(q.id));
    
    setActiveQuestions(questionsToReview);
    setIsReviewMode(true);
    setQuizCompleted(false);
    setCurrentIdx(0);
    setScore(0);
    setUserMistakes([]);
    setIsAnswered(false);
    setSelectedOption(null);
    setAiAnalysis('');
  };

  const resetQuiz = () => {
    setActiveQuestions(data.questions);
    setIsReviewMode(false);
    setQuizCompleted(false);
    setCurrentIdx(0);
    setScore(0);
    setUserMistakes([]);
    setIsAnswered(false);
    setSelectedOption(null);
    setAiAnalysis('');
  };

  // --- RESULT VIEW ---
  if (quizCompleted) {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';

    return (
      <div className="max-w-3xl mx-auto animate-fade-in pb-20 pt-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 mb-2">
            {isReviewMode ? t.reviewComplete : t.quizComplete}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           {/* Score Card */}
           <Card className="flex flex-col items-center justify-center p-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-900/20 opacity-50"></div>
             <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 rtl:rotate-90">
                  <circle
                    cx="96" cy="96" r={radius}
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="96" cy="96" r={radius}
                    stroke="currentColor" strokeWidth="12" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`${color} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${color}`}>{percentage}%</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">{t.accuracy}</span>
                </div>
             </div>
             <div className="mt-4 text-center">
               <p className="text-lg font-medium">{t.correct}: <span className="text-green-500">{score}</span> / {activeQuestions.length}</p>
             </div>
           </Card>

           {/* Actions Card */}
           <div className="space-y-4">
             {userMistakes.length > 0 && (
                <button 
                  onClick={startReviewMode}
                  className="w-full p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-700 flex items-center justify-between group transition-all hover:shadow-md"
                >
                  <div className="ltr:text-left rtl:text-right">
                       <h4 className="font-bold">{t.reviewMistakes}</h4>
                       <p className="text-xs opacity-80">{userMistakes.length} {t.questionsToImprove}</p>
                  </div>
                </button>
             )}
             
             <button 
                onClick={resetQuiz}
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group transition-all hover:border-brand-500 hover:shadow-md"
             >
                <div className="ltr:text-left rtl:text-right">
                   <h4 className="font-bold text-slate-700 dark:text-slate-200">{isReviewMode ? t.restartReview : t.retake}</h4>
                   <p className="text-xs text-slate-500">{t.tryBetter}</p>
                </div>
             </button>

             <button 
                onClick={onBack}
                className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between group transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
             >
                <span className="font-bold text-slate-600 dark:text-slate-400">{t.backDashboard}</span>
             </button>
           </div>
        </div>

        {/* AI Analysis Section */}
        {(analyzing || aiAnalysis) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-2">
              <span className="text-2xl animate-pulse">✨</span>
              <h3 className="font-bold text-lg">{t.aiCoach}</h3>
            </div>
            <div className="p-6">
              {analyzing ? (
                <div className="flex flex-col items-center py-8">
                  <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-slate-500 font-medium">{t.analyzing}</p>
                </div>
              ) : (
                 <div className="prose dark:prose-invert max-w-none">
                     <p className="whitespace-pre-line text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                       {aiAnalysis}
                     </p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- FLASHCARD VIEW ---
  if (mode === 'flashcard') {
    return (
      <div className="max-w-xl mx-auto pt-10 h-[600px] flex flex-col">
         <div className="flex justify-between items-center mb-6">
          <Button variant="outline" size="sm" onClick={onBack}>{t.exit}</Button>
          <div className="flex flex-col items-center">
             <span className="text-xs uppercase tracking-widest text-slate-400">{t.card}</span>
             <span className="font-mono font-bold text-xl">{currentIdx + 1}<span className="text-slate-300">/</span>{activeQuestions.length}</span>
          </div>
          <button onClick={() => setMode('quiz')} className="text-sm font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-full transition-colors">
            {t.switchToQuiz}
          </button>
        </div>

        <div className="flex-1 perspective-1000 relative group">
           <div 
            className={`relative w-full h-full transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center hover:shadow-brand-500/20 transition-shadow">
              <div className="w-16 h-1 bg-brand-500 rounded-full mb-8"></div>
              <h3 className="text-2xl md:text-3xl font-bold leading-tight">{currentQuestion.question}</h3>
              <p className="absolute bottom-8 text-sm font-medium text-slate-400 flex items-center gap-2">
                <span className="animate-bounce">👆</span> {t.tapFlip}
              </p>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-brand-600 to-indigo-700 text-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border border-white/10">
               <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">{t.answer}</span>
               <h3 className="text-3xl font-bold mb-6">{currentQuestion.correctAnswer}</h3>
               <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md">
                 <p className="text-indigo-100 text-lg leading-relaxed">{currentQuestion.explanation}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 px-4">
           <Button 
             disabled={currentIdx === 0} 
             onClick={() => { setCurrentIdx(c => c - 1); setIsFlipped(false); }} 
             variant="outline"
             className="w-32"
           >
             {t.previous}
           </Button>
           <Button 
             onClick={() => {
               if (currentIdx < activeQuestions.length - 1) {
                  setCurrentIdx(c => c + 1);
                  setIsFlipped(false);
               } else {
                 setMode('quiz'); 
               }
             }}
             className="w-32"
           >
             {currentIdx === activeQuestions.length - 1 ? t.done : t.next}
           </Button>
        </div>
      </div>
    );
  }

  // --- STANDARD QUIZ VIEW ---
  const progressPercent = ((currentIdx) / activeQuestions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto animate-slide-up pb-20 pt-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 font-medium">
          <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          {t.quit}
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{t.progress}</span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{currentIdx + 1} <span className="text-slate-300">/</span> {activeQuestions.length}</span>
          </div>
          <button onClick={() => setMode('flashcard')} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 p-2 rounded-lg hover:bg-indigo-100 transition-colors" title={t.switchToFlash}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
        <div 
          className="bg-gradient-to-r from-brand-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out relative" 
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="mb-8 relative z-10">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700 text-center">
           {isReviewMode && (
             <span className="inline-block bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold mb-4 uppercase tracking-wider">Review Mode</span>
           )}
           <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
             {currentQuestion.question}
           </h2>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQuestion.options.map((opt, idx) => {
          let itemClass = "relative p-6 rounded-2xl border-2 ltr:text-left rtl:text-right transition-all duration-200 transform hover:scale-[1.02] group ";
          let indicatorIcon = <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-bold flex items-center justify-center group-hover:bg-slate-200">{String.fromCharCode(65 + idx)}</span>;

          if (isAnswered) {
            // Robust comparison
            if (isCorrectOption(opt, currentQuestion.correctAnswer)) {
              itemClass += "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-500/20 shadow-lg";
              indicatorIcon = <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">✓</span>;
            } else if (opt === selectedOption) {
              itemClass += "border-red-500 bg-red-50 dark:bg-red-900/20 opacity-90";
              indicatorIcon = <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">✕</span>;
            } else {
              itemClass += "border-slate-100 dark:border-slate-800 opacity-40 grayscale";
            }
          } else {
            if (selectedOption === opt) {
              itemClass += "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-brand-500/20 shadow-lg ring-1 ring-brand-500";
              indicatorIcon = <span className="w-8 h-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center">●</span>;
            } else {
              itemClass += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 hover:shadow-lg";
            }
          }

          return (
            <button
              key={idx}
              className={itemClass}
              onClick={() => !isAnswered && setSelectedOption(opt)}
              disabled={isAnswered}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">{indicatorIcon}</div>
                <span className={`font-medium text-lg ${isAnswered && isCorrectOption(opt, currentQuestion.correctAnswer) ? 'text-green-800 dark:text-green-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {opt}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback & Navigation */}
      <div className="mt-8">
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isAnswered ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
           <div className="bg-blue-50 dark:bg-slate-800/80 backdrop-blur-md border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <span className="text-xl">💡</span> {t.correct}: {currentQuestion.correctAnswer}
            </h4>
            <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
             onClick={isAnswered ? handleNext : handleAnswer} 
             disabled={!selectedOption && !isAnswered}
             className="w-full md:w-auto text-lg px-8 py-3 shadow-xl shadow-brand-500/30 disabled:opacity-50 disabled:shadow-none transition-all"
          >
             {isAnswered ? (currentIdx === activeQuestions.length - 1 ? t.seeResults : t.nextQuestion) : t.checkAnswer}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;