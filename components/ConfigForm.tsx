
import React, { useState, useRef, useEffect } from 'react';
import { GenerationRequest, EducationSystem, Language, Difficulty, DetailLevel, QuizType, UserProfile, AppView } from '../types';
import { YEARS, SUBJECTS, EDUCATION_SYSTEMS, TRANSLATIONS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';

interface ConfigFormProps {
  onSubmit: (data: GenerationRequest) => void;
  isLoading: boolean;
  loadingStatus?: string;
  appLanguage: Language;
  user: UserProfile;
  prefill?: Partial<GenerationRequest>;
  onNavigate: (view: AppView) => void; // Added for Viva navigation
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit, isLoading, loadingStatus, appLanguage, user, prefill, onNavigate }) => {
  const t = TRANSLATIONS[appLanguage];

  const [formData, setFormData] = useState<GenerationRequest>({
    year: user.preferences.defaultYear || YEARS[9],
    curriculum: user.preferences.defaultCurriculum || EducationSystem.STANDARD,
    subject: SUBJECTS[0],
    topic: '',
    mode: 'notes', // Default
    language: appLanguage,
    difficulty: Difficulty.MEDIUM,
    detailLevel: DetailLevel.MEDIUM,
    quizType: QuizType.MCQ,
    questionCount: 10,
    homeworkImage: undefined,
    homeworkMimeType: undefined,
    youtubeUrl: '',
    transcriptText: '',
    podcastLength: 'Short',
    podcastVoice: 'Female'
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, language: appLanguage }));
  }, [appLanguage]);

  useEffect(() => {
    if (prefill) {
      setFormData(prev => ({ ...prev, ...prefill }));
    }
  }, [prefill]);

  const [customSubject, setCustomSubject] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mode === 'homework' && !formData.homeworkImage) {
      alert("Please upload an image for homework checking.");
      return;
    }
    if (formData.mode === 'lazy' && !formData.youtubeUrl && !formData.transcriptText) {
      alert("Please enter a YouTube URL or paste the transcript.");
      return;
    }

    onSubmit({
      ...formData,
      subject: isCustomSubject ? customSubject : formData.subject
    });
  };

  const handleChange = (field: keyof GenerationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardClick = (id: string) => {
    if (id === 'viva') {
      onNavigate(AppView.VIVA);
    } else {
      handleChange('mode', id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          homeworkImage: reader.result as string,
          homeworkMimeType: file.type
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setFormData(prev => ({
      ...prev,
      homeworkImage: undefined,
      homeworkMimeType: undefined
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getButtonLabel = () => {
    if (isLoading) {
      if (loadingStatus) return loadingStatus;
      return "Generating...";
    }
    switch (formData.mode) {
      case 'notes': return t.btnGenerateGuide;
      case 'quiz': return t.btnGenerateQuiz;
      case 'homework': return t.btnCheckHomework;
      case 'flashcards': return t.btnGenerateFlashcards;
      case 'lazy': return t.btnLazy;
      case 'podcast': return t.btnPodcast;
      case 'cheat-sheet': return t.btnGenerateCheatSheet;
      default: return t.btnGenerateGuide;
    }
  };

  // Calculate simplified progress percentage
  const getProgressPercent = () => {
    if (!loadingStatus) return 0;
    if (loadingStatus.includes("Script")) return 30;
    if (loadingStatus.includes("Synthesizing")) return 70;
    if (loadingStatus.includes("Audio")) return 90;
    if (loadingStatus.includes("Connecting")) return 20;
    if (loadingStatus.includes("Analyzing")) return 50;
    if (loadingStatus.includes("Generating")) return 80;
    return 10;
  };

  // --- Configuration Data for Cards ---
  const CATEGORIES = [
    {
      title: "Create & Learn",
      description: "Convert content into study materials",
      color: "blue",
      items: [
        { id: 'notes', icon: '📝', label: t.modeNotes },
        { id: 'podcast', icon: '🎧', label: t.modePodcast },
        { id: 'lazy', icon: '📺', label: t.modeLazy },
        { id: 'flashcards', icon: '📚', label: t.modeFlashcards },
        { id: 'cheat-sheet', icon: '⚡', label: t.modeCheatSheet },
        { id: 'viva', icon: '🗣️', label: t.modeViva },
      ]
    },
    {
      title: "Practice & Test",
      description: "Active recall and self-testing",
      color: "amber",
      items: [
        { id: 'quiz', icon: '❓', label: t.modeQuiz },
        { id: 'exam-sim', icon: '📝', label: "Exam Simulation", disabled: true, sub: "(Coming Soon)" },
      ]
    },
    {
      title: "Check & Improve",
      description: "Verify your work",
      color: "emerald",
      items: [
        { id: 'homework', icon: '📸', label: t.modeHomework },
        { id: 'essay', icon: '✍️', label: "Essay Fixer", disabled: true, sub: "(Coming Soon)" },
      ]
    }
  ];

  // Helper to get styling based on category color
  const getCategoryStyles = (color: string) => {
    switch(color) {
      case 'blue': return {
        headerText: 'text-blue-700 dark:text-blue-400',
        // Stronger distinction: Colored icon box, subtle colored border on hover
        iconBox: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
        cardBase: 'hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-800 dark:hover:bg-blue-900/10',
        active: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/30',
        dot: 'text-blue-500'
      };
      case 'amber': return {
        headerText: 'text-amber-700 dark:text-amber-400',
        iconBox: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
        cardBase: 'hover:border-amber-300 hover:bg-amber-50/30 dark:hover:border-amber-800 dark:hover:bg-amber-900/10',
        active: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-900/30',
        dot: 'text-amber-500'
      };
      case 'emerald': return {
        headerText: 'text-emerald-700 dark:text-emerald-400',
        iconBox: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
        cardBase: 'hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/10',
        active: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        dot: 'text-emerald-500'
      };
      default: return {
        headerText: 'text-slate-700',
        iconBox: 'bg-slate-100 text-slate-600',
        cardBase: 'hover:border-slate-300',
        active: 'ring-2 ring-brand-500',
        dot: 'text-brand-500'
      };
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20 space-y-8">
      
      {/* 1. Header & Context Bar */}
      <div className="text-center space-y-6">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 mb-2">
            {t.welcomeBack} {user.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {t.welcomeSubtitle}
          </p>
        </div>

        {/* Context Bar (Simulating the screenshot style) */}
        <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
           <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              
              {/* Level */}
              <div className="flex-1 p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                 <div className="text-2xl">🎓</div>
                 <div className="flex flex-col items-start w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">{t.eduLevel}</label>
                    <select 
                      className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer w-full text-sm appearance-none"
                      value={formData.year}
                      onChange={e => handleChange('year', e.target.value)}
                    >
                      {YEARS.map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                    </select>
                 </div>
                 <div className="text-slate-400 text-xs">▼</div>
              </div>

              {/* Curriculum */}
              <div className="flex-1 p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                 <div className="text-2xl">🏫</div>
                 <div className="flex flex-col items-start w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">{t.curriculum}</label>
                    <select 
                      className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer w-full text-sm appearance-none truncate"
                      value={formData.curriculum}
                      onChange={e => handleChange('curriculum', e.target.value)}
                    >
                      {EDUCATION_SYSTEMS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                    </select>
                 </div>
                 <div className="text-slate-400 text-xs">▼</div>
              </div>

              {/* Subject */}
              <div className="flex-1 p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                 <div className="text-2xl">📚</div>
                 <div className="flex flex-col items-start w-full">
                    <div className="flex justify-between w-full">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">{t.subject}</label>
                        {!isCustomSubject && <button onClick={() => setIsCustomSubject(true)} className="text-[9px] text-brand-500 hover:underline">{t.other}</button>}
                    </div>
                    
                    {!isCustomSubject ? (
                      <select 
                        className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer w-full text-sm appearance-none"
                        value={formData.subject}
                        onChange={e => handleChange('subject', e.target.value)}
                      >
                        {SUBJECTS.map(s => <option key={s} value={s} className="text-black">{s}</option>)}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          placeholder="Enter Subject"
                          className="bg-transparent border-b border-brand-300 w-full text-sm focus:outline-none text-slate-800 dark:text-white font-bold placeholder:font-normal"
                          value={customSubject}
                          onChange={e => setCustomSubject(e.target.value)}
                          autoFocus
                        />
                        <button type="button" onClick={() => setIsCustomSubject(false)} className="text-xs text-slate-400 hover:text-red-500">✕</button>
                      </div>
                    )}
                 </div>
                 {!isCustomSubject && <div className="text-slate-400 text-xs">▼</div>}
              </div>

              {/* Language */}
              <div className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors min-w-[140px]">
                 <div className="text-2xl">🌐</div>
                 <div className="flex flex-col items-start w-full">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">{t.language}</label>
                    <select 
                      className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer w-full text-sm appearance-none"
                      value={formData.language}
                      onChange={e => handleChange('language', e.target.value)}
                    >
                      <option value={Language.ENGLISH} className="text-black">English</option>
                      <option value={Language.ARABIC} className="text-black">Arabic</option>
                    </select>
                 </div>
                 <div className="text-slate-400 text-xs">▼</div>
              </div>

           </div>
        </Card>
      </div>

      {/* 2. The "Hub" - Categories (Revamped) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {CATEGORIES.map((cat) => {
          const styles = getCategoryStyles(cat.color);
          
          return (
            <div key={cat.title} className="flex flex-col h-full animate-slide-up">
              <div className="mb-4 px-2">
                <h3 className={`font-bold text-lg ${styles.headerText}`}>{cat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>
              </div>
              
              <div className="flex flex-col gap-3 flex-grow">
                {cat.items.map((item: any) => {
                  const isActive = formData.mode === item.id;
                  const isDisabled = item.disabled;
                  
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleCardClick(item.id)}
                      className={`
                        relative w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group text-left
                        ${isDisabled 
                          ? 'opacity-60 cursor-not-allowed border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900' 
                          : `cursor-pointer border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${styles.cardBase} hover:shadow-md`
                        }
                        ${isActive ? styles.active : ''}
                      `}
                    >
                      {/* Icon Box */}
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105 flex-shrink-0
                        ${styles.iconBox}
                        ${isActive ? 'shadow-sm ring-2 ring-white dark:ring-slate-800' : ''}
                      `}>
                        {item.icon}
                      </div>
                      
                      {/* Text */}
                      <div className="flex-grow min-w-0">
                        <span className={`block font-bold text-sm truncate ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.label}
                        </span>
                        {item.sub && <span className="text-[10px] font-bold opacity-70 uppercase tracking-wide block mt-0.5">{item.sub}</span>}
                      </div>

                      {/* Active Indicator Dot */}
                      {isActive && (
                        <div className={`w-3 h-3 rounded-full bg-current ${styles.dot}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Specific Input Section (Clean Card) */}
      <Card className={`border-t-4 animate-slide-up transition-colors shadow-xl
        ${formData.mode === 'lazy' ? 'border-red-500' : formData.mode === 'homework' ? 'border-emerald-500' : formData.mode === 'quiz' ? 'border-amber-500' : 'border-blue-600'}
      `}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-2">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-slate-400 font-normal text-sm">Selected Mode:</span>
                {formData.mode === 'notes' ? 'Study Notes' : formData.mode.charAt(0).toUpperCase() + formData.mode.slice(1)}
             </h3>
             {/* Quick Options Badge */}
             <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">
               {formData.subject}
             </span>
          </div>

          {/* Content Inputs Based on Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* Primary Input (Topic/File/URL) */}
             <div>
                {formData.mode === 'homework' ? (
                  <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-800/20"
                       onClick={() => fileInputRef.current?.click()}>
                    {!formData.homeworkImage ? (
                      <>
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📸</div>
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">{t.uploadPhoto}</p>
                        <p className="text-xs text-slate-500">{t.clickUpload}</p>
                      </>
                    ) : (
                      <div className="relative">
                        <img src={formData.homeworkImage} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-md" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); clearImage(); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
                  </div>
                ) : formData.mode === 'lazy' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-red-600 dark:text-red-400 mb-1.5 tracking-wide">{t.youtubeUrl}</label>
                      <input 
                        type="text"
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium"
                        value={formData.youtubeUrl}
                        onChange={e => handleChange('youtubeUrl', e.target.value)}
                        placeholder={t.youtubePlaceholder}
                      />
                    </div>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                      <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-slate-800 text-slate-400 font-medium">OR (Recommended)</span></div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5 tracking-wide">{t.transcriptLabel}</label>
                      <textarea
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none h-32 text-xs font-mono leading-relaxed resize-none"
                        value={formData.transcriptText}
                        onChange={e => handleChange('transcriptText', e.target.value)}
                        placeholder={t.transcriptPlaceholder}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center">
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 tracking-wide">
                      {t.topic} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-xl border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none text-lg font-medium shadow-sm transition-all"
                      value={formData.topic}
                      onChange={e => handleChange('topic', e.target.value)}
                      placeholder={formData.mode === 'podcast' ? t.podcastTopicPlaceholder : t.topicPlaceholder}
                      required={formData.mode !== 'homework'}
                      autoFocus
                    />
                    {formData.mode === 'homework' && <span className="text-xs text-slate-400 mt-2 block">{t.topicOptional}</span>}
                  </div>
                )}
             </div>

             {/* Secondary Options (Settings) */}
             <div className="space-y-5 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
                
                {/* Notes Options */}
                {formData.mode === 'notes' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">{t.detailLevel}</label>
                      <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        {Object.values(DetailLevel).map(level => (
                          <button key={level} type="button" onClick={() => handleChange('detailLevel', level)}
                            className={`flex-1 py-2 text-xs rounded-md font-bold transition-all ${formData.detailLevel === level ? 'bg-brand-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">{t.difficulty}</label>
                       <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none" value={formData.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
                          {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                  </>
                )}

                {/* Quiz Options */}
                {formData.mode === 'quiz' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">{t.quizType}</label>
                      <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none" value={formData.quizType} onChange={e => handleChange('quizType', e.target.value)}>
                        {Object.values(QuizType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                         <label className="block text-xs font-bold uppercase text-slate-400 tracking-wide">{t.numQuestions}</label>
                         <span className="text-xs font-bold text-orange-600">{formData.questionCount}</span>
                      </div>
                      <input type="range" min="5" max="20" step="5" value={formData.questionCount} onChange={e => handleChange('questionCount', parseInt(e.target.value))} className="w-full accent-orange-500" />
                    </div>
                  </>
                )}

                {/* Podcast Options */}
                {formData.mode === 'podcast' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">{t.podcastLength}</label>
                       <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none" value={formData.podcastLength} onChange={e => handleChange('podcastLength', e.target.value)}>
                         <option value="Short">{t.short}</option>
                         <option value="Medium">{t.medium}</option>
                         <option value="Long">{t.long}</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">{t.podcastVoice}</label>
                       <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600 text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none" value={formData.podcastVoice} onChange={e => handleChange('podcastVoice', e.target.value)}>
                         <option value="Female">{t.female}</option>
                         <option value="Male">{t.male}</option>
                       </select>
                    </div>
                  </div>
                )}

                {/* Cheat Sheet Options (None specific, just placeholder or tips) */}
                {formData.mode === 'cheat-sheet' && (
                   <div className="text-xs text-slate-500 italic bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      💡 <strong>Tip:</strong> Best for quick revision before exams. Generates a dense summary of formulas and key definitions.
                   </div>
                )}

                {/* Lazy Options (None additional) */}
                {formData.mode === 'lazy' && (
                   <div className="text-xs text-slate-500 italic bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      💡 <strong>Tip:</strong> Use a transcript for 100% accuracy. URLs are analyzed via Google Search grounding.
                   </div>
                )}
             </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              isLoading={isLoading} 
              className={`w-full md:w-auto text-lg px-10 py-4 font-bold relative overflow-hidden shadow-xl transform transition-transform active:scale-95 rounded-xl ${
                formData.mode === 'lazy' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 
                formData.mode === 'podcast' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' :
                formData.mode === 'homework' ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' :
                formData.mode === 'quiz' ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500' :
                formData.mode === 'cheat-sheet' ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' : ''
              }`}
              disabled={formData.mode === 'homework' && !formData.homeworkImage}
            >
              <span className="relative z-10">{getButtonLabel()}</span>
              {isLoading && loadingStatus && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500" style={{ width: `${getProgressPercent()}%` }}></div>
              )}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
};

export default ConfigForm;
