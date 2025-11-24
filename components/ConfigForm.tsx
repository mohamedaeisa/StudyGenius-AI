
import React, { useState, useRef, useEffect } from 'react';
import { GenerationRequest, EducationSystem, Language, Difficulty, DetailLevel, QuizType, UserProfile } from '../types';
import { YEARS, SUBJECTS, EDUCATION_SYSTEMS, TRANSLATIONS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';

interface ConfigFormProps {
  onSubmit: (data: GenerationRequest) => void;
  isLoading: boolean;
  loadingStatus?: string; // Prop to receive specific status messages
  appLanguage: Language;
  user: UserProfile;
  prefill?: Partial<GenerationRequest>;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onSubmit, isLoading, loadingStatus, appLanguage, user, prefill }) => {
  const t = TRANSLATIONS[appLanguage];

  const [formData, setFormData] = useState<GenerationRequest>({
    year: user.preferences.defaultYear || YEARS[9],
    curriculum: user.preferences.defaultCurriculum || EducationSystem.STANDARD,
    subject: SUBJECTS[0],
    topic: '',
    mode: 'notes',
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

  // Apply prefill if provided (e.g. from Learning Path)
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

  const getModeLabel = (m: string) => {
    switch(m) {
      case 'notes': return t.modeNotes;
      case 'quiz': return t.modeQuiz;
      case 'homework': return t.modeHomework;
      case 'flashcards': return t.modeFlashcards;
      case 'lazy': return t.modeLazy;
      case 'podcast': return t.modePodcast;
      case 'cheat-sheet': return t.modeCheatSheet;
      default: return m;
    }
  };

  // Calculate simplified progress percentage based on status string
  const getProgressPercent = () => {
    if (!loadingStatus) return 0;
    if (loadingStatus.includes("Script")) return 30;
    if (loadingStatus.includes("Synthesizing")) return 70;
    if (loadingStatus.includes("Audio")) return 90;
    return 10;
  };

  return (
    <Card className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 mb-2">
          {t.welcomeBack} {user.name}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          {t.welcomeSubtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Context */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.eduLevel}</label>
              <select 
                className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={formData.year}
                onChange={e => handleChange('year', e.target.value)}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.curriculum}</label>
              <select 
                className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                value={formData.curriculum}
                onChange={e => handleChange('curriculum', e.target.value)}
              >
                {EDUCATION_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.subject}</label>
              {!isCustomSubject ? (
                <div className="flex gap-2">
                   <select 
                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.subject}
                    onChange={e => handleChange('subject', e.target.value)}
                  >
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" onClick={() => setIsCustomSubject(true)} className="text-xs text-brand-600 underline whitespace-nowrap">
                    {t.other}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter subject..."
                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setIsCustomSubject(false)} className="text-xs text-brand-600 underline">
                    {t.list}
                  </button>
                </div>
              )}
            </div>
            
            {formData.mode !== 'lazy' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-1">
                  {t.topic} {formData.mode === 'homework' && <span className="text-slate-400 font-normal">{t.topicOptional}</span>}
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={formData.topic}
                  onChange={e => handleChange('topic', e.target.value)}
                  placeholder={formData.mode === 'podcast' ? t.podcastTopicPlaceholder : t.topicPlaceholder}
                  required={formData.mode !== 'homework'}
                />
              </div>
            )}
          </div>

          {/* Right Column: Mode Specifics */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-lg">
            {/* Mode Selection Cards */}
            <div className="grid grid-cols-2 gap-3">
              {['notes', 'quiz', 'homework', 'flashcards', 'lazy', 'podcast', 'cheat-sheet'].map((m) => {
                const isLazy = m === 'lazy';
                const isPodcast = m === 'podcast';
                const isCheatSheet = m === 'cheat-sheet';
                
                let borderClass = 'border-slate-200 dark:border-slate-700';
                let textClass = 'text-slate-500 dark:text-slate-400';
                let hoverClass = 'hover:border-brand-300 dark:hover:border-brand-700';
                let bgClass = 'bg-white dark:bg-slate-800';

                if (formData.mode === m) {
                   if (isLazy) {
                     borderClass = 'border-red-500';
                     bgClass = 'bg-red-50 dark:bg-red-900/20';
                     textClass = 'text-red-600 dark:text-red-300';
                   } else if (isPodcast) {
                     borderClass = 'border-purple-500';
                     bgClass = 'bg-purple-50 dark:bg-purple-900/20';
                     textClass = 'text-purple-600 dark:text-purple-300';
                   } else if (isCheatSheet) {
                     borderClass = 'border-teal-500';
                     bgClass = 'bg-teal-50 dark:bg-teal-900/20';
                     textClass = 'text-teal-600 dark:text-teal-300';
                   } else {
                     borderClass = 'border-brand-500';
                     bgClass = 'bg-brand-50 dark:bg-brand-900/20';
                     textClass = 'text-brand-600 dark:text-brand-300';
                   }
                } else {
                   if (isLazy) hoverClass = 'hover:border-red-300 dark:hover:border-red-700';
                   if (isPodcast) hoverClass = 'hover:border-purple-300 dark:hover:border-purple-700';
                   if (isCheatSheet) hoverClass = 'hover:border-teal-300 dark:hover:border-teal-700';
                }

                return (
                  <button 
                    key={m}
                    type="button"
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 shadow-sm ${borderClass} ${bgClass} ${textClass} ${formData.mode !== m ? hoverClass : ''}`}
                    onClick={() => handleChange('mode', m)}
                  >
                    {isLazy && <span className="mr-1">📺</span>}
                    {isPodcast && <span className="mr-1">🎙️</span>}
                    {isCheatSheet && <span className="mr-1">📝</span>}
                    {getModeLabel(m)}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t.language}</label>
              <select 
                className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
                value={formData.language}
                onChange={e => handleChange('language', e.target.value)}
              >
                <option value={Language.ENGLISH}>English</option>
                <option value={Language.ARABIC}>Arabic</option>
              </select>
            </div>

            {/* ... (existing logic for notes, quiz, homework) ... */}
            {formData.mode === 'notes' && (
              <div className="animate-fade-in space-y-4">
                 <div>
                  <label className="block text-sm font-medium mb-1">{t.detailLevel}</label>
                  <div className="flex gap-2">
                    {Object.values(DetailLevel).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleChange('detailLevel', level)}
                        className={`flex-1 py-1 px-2 text-xs rounded border ${formData.detailLevel === level ? 'bg-brand-100 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">{t.difficulty}</label>
                   <select 
                      className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
                      value={formData.difficulty}
                      onChange={e => handleChange('difficulty', e.target.value)}
                    >
                      {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
              </div>
            )}

            {formData.mode === 'quiz' && (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.quizType}</label>
                  <select 
                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600"
                    value={formData.quizType}
                    onChange={e => handleChange('quizType', e.target.value)}
                  >
                    {Object.values(QuizType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.numQuestions}: {formData.questionCount}</label>
                  <input 
                    type="range" 
                    min="5" 
                    max="20" 
                    step="5"
                    value={formData.questionCount}
                    onChange={e => handleChange('questionCount', parseInt(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            )}

            {formData.mode === 'homework' && (
              <div className="animate-fade-in space-y-4">
                <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {!formData.homeworkImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t.uploadPhoto}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.clickUpload}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={formData.homeworkImage} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg shadow-md"
                      />
                      <button 
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {formData.mode === 'lazy' && (
               <div className="animate-fade-in space-y-4">
                 <p className="text-xs text-slate-500 italic">{t.lazyIntro}</p>
                 <div>
                   <label className="block text-sm font-medium mb-1 text-red-600 dark:text-red-400">
                     {t.youtubeUrl}
                   </label>
                   <input 
                    type="text"
                    className="w-full p-2 rounded-lg border border-red-200 dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.youtubeUrl}
                    onChange={e => handleChange('youtubeUrl', e.target.value)}
                    placeholder={t.youtubePlaceholder}
                   />
                 </div>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-50 dark:bg-slate-800 text-slate-400">Optional</span>
                    </div>
                  </div>
                 <div>
                   <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
                     {t.transcriptLabel}
                   </label>
                   <textarea
                    className="w-full p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none h-24 text-xs"
                    value={formData.transcriptText}
                    onChange={e => handleChange('transcriptText', e.target.value)}
                    placeholder={t.transcriptPlaceholder}
                   />
                 </div>
               </div>
            )}

            {formData.mode === 'podcast' && (
               <div className="animate-fade-in p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                 <div>
                   <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-2 flex items-center gap-2">
                     <span className="text-xl">🎧</span> {t.modePodcast} - Commuter Mode
                   </p>
                   <p className="text-xs text-slate-600 dark:text-slate-400 mb-0">
                     {t.podcastIntro}
                   </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.podcastLength}</label>
                       <select 
                         className="w-full p-2 text-sm rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-purple-500"
                         value={formData.podcastLength}
                         onChange={e => handleChange('podcastLength', e.target.value)}
                       >
                         <option value="Short">{t.short}</option>
                         <option value="Medium">{t.medium}</option>
                         <option value="Long">{t.long}</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.podcastVoice}</label>
                       <select 
                         className="w-full p-2 text-sm rounded-lg border dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-purple-500"
                         value={formData.podcastVoice}
                         onChange={e => handleChange('podcastVoice', e.target.value)}
                       >
                         <option value="Female">{t.female}</option>
                         <option value="Male">{t.male}</option>
                       </select>
                    </div>
                 </div>
               </div>
            )}

            {formData.mode === 'cheat-sheet' && (
               <div className="animate-fade-in p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-900/30">
                 <p className="text-sm text-teal-800 dark:text-teal-200 font-medium mb-2 flex items-center gap-2">
                   <span className="text-xl">📝</span> {t.modeCheatSheet}
                 </p>
                 <p className="text-xs text-slate-600 dark:text-slate-400 mb-0">
                   {t.cheatSheetIntro}
                 </p>
               </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            type="submit" 
            isLoading={isLoading} 
            className={`w-full md:w-auto text-lg px-8 relative overflow-hidden ${
              formData.mode === 'lazy' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 
              formData.mode === 'podcast' ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' :
              formData.mode === 'cheat-sheet' ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' : ''
            }`}
            disabled={formData.mode === 'homework' && !formData.homeworkImage}
          >
            <span className="relative z-10">{getButtonLabel()}</span>
            {isLoading && loadingStatus && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-500" 
                style={{ width: `${getProgressPercent()}%` }}
              ></div>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ConfigForm;
