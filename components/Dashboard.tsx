import React, { useState, useEffect, useMemo } from 'react';
import { HistoryItem, Language, UserProfile, AnalysisResult, QuizResult } from '../types';
import { getHistory, getQuizResults, updateHistoryItem, getAnalysis, saveAnalysis } from '../services/storageService';
import { generateProgressReport } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  onLoadItem: (item: HistoryItem) => void;
  appLanguage: Language;
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ onLoadItem, appLanguage, user }) => {
  const t = TRANSLATIONS[appLanguage];
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagInputOpen, setTagInputOpen] = useState<string | null>(null); 
  const [newTagValue, setNewTagValue] = useState('');
  
  // Tracker State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch data specific to the logged-in user
  useEffect(() => {
    setHistory(getHistory(user.id));
    setResults(getQuizResults(user.id).reverse().slice(0, 10));
    setAnalysis(getAnalysis(user.id));
  }, [user.id]);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const newAnalysis = await generateProgressReport(user, history, getQuizResults(user.id));
      setAnalysis(newAnalysis);
      saveAnalysis(newAnalysis, user.id);
    } catch (e) {
      console.error(e);
      alert("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 50) return '#3b82f6'; // Blue
    return '#ef4444'; // Red
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    history.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [history]);

  const handleAddTag = (itemId: string) => {
    if (!newTagValue.trim()) return;
    const tagToAdd = newTagValue.trim();
    
    const item = history.find(i => i.id === itemId);
    if (item) {
      const currentTags = item.tags || [];
      // Prevent duplicates
      if (currentTags.includes(tagToAdd)) {
        setNewTagValue('');
        setTagInputOpen(null);
        return;
      }

      const updatedTags = [...currentTags, tagToAdd];
      
      updateHistoryItem(itemId, { tags: updatedTags }, user.id);
      
      // Update local state to reflect change immediately
      setHistory(prev => prev.map(i => i.id === itemId ? { ...i, tags: updatedTags } : i));
      setNewTagValue('');
      setTagInputOpen(null);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, itemId: string, tagToRemove: string) => {
    e.stopPropagation(); // Prevent opening the item
    const item = history.find(i => i.id === itemId);
    if (item) {
      const updatedTags = (item.tags || []).filter(t => t !== tagToRemove);
      updateHistoryItem(itemId, { tags: updatedTags }, user.id);
      setHistory(prev => prev.map(i => i.id === itemId ? { ...i, tags: updatedTags } : i));
    }
  };

  const filteredHistory = activeTag 
    ? history.filter(item => item.tags?.includes(activeTag))
    : history;

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (level >= 60) return 'text-brand-600 bg-brand-100 dark:bg-brand-900/30';
    if (level >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  // Determine current stats for display (fallback if no analysis)
  const localAvg = results.length > 0 
    ? Math.round(results.reduce((a: number, b: QuizResult) => a + b.percentage, 0) / results.length) 
    : 0;

  const displayAnalysis = analysis || {
    overallStatus: results.length > 0 ? (appLanguage === Language.ARABIC ? "نشط" : "Active") : (appLanguage === Language.ARABIC ? "جاهز للبدء" : "Ready to Start"),
    summary: results.length > 0 ? t.clickToAnalyze : t.noDataYet,
    strengths: [],
    weaknesses: [],
    recommendations: [],
    masteryLevel: localAvg,
    timestamp: Date.now()
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
      
      {/* Analytics Column */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* AI Progress Tracker Card */}
        <Card className="relative overflow-hidden border-2 border-brand-100 dark:border-brand-900/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
             <div>
               <h3 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600">
                 ✨ {t.aiProgressReport}
               </h3>
               {analysis && (
                 <p className="text-xs text-slate-400 mt-1">
                   {t.analysisGenerated} {new Date(analysis.timestamp).toLocaleDateString()}
                 </p>
               )}
             </div>
             <Button 
               size="sm" 
               variant={analysis ? "outline" : "primary"}
               onClick={handleGenerateAnalysis}
               isLoading={isAnalyzing}
             >
               {analysis ? t.refreshAnalysis : t.generateAnalysis}
             </Button>
          </div>

          {isAnalyzing ? (
            <div className="text-center py-12">
               <div className="animate-spin h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-brand-600 font-medium animate-pulse">{t.generating}</p>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Mastery Circle */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                      <circle 
                        cx="64" cy="64" r="60" 
                        stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 60} 
                        strokeDashoffset={2 * Math.PI * 60 * (1 - (displayAnalysis.masteryLevel || 0) / 100)} 
                        strokeLinecap="round" 
                        className={displayAnalysis.masteryLevel >= 80 ? 'text-green-500' : displayAnalysis.masteryLevel >= 50 ? 'text-brand-500' : 'text-amber-500'} 
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold">{displayAnalysis.masteryLevel}%</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">{t.overallMastery}</span>
                </div>

                <div className="flex-grow">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getMasteryColor(displayAnalysis.masteryLevel)}`}>
                    {displayAnalysis.overallStatus}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{displayAnalysis.summary}"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                  <h4 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                    <span>💪</span> {t.strengths}
                  </h4>
                  <ul className="space-y-1">
                    {displayAnalysis.strengths && displayAnalysis.strengths.length > 0 ? displayAnalysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-700 dark:text-green-200 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0"></span>
                        {s}
                      </li>
                    )) : <li className="text-sm text-slate-500 italic opacity-60">Analysis required</li>}
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <span>🎯</span> {t.areasFocus}
                  </h4>
                  <ul className="space-y-1">
                    {displayAnalysis.weaknesses && displayAnalysis.weaknesses.length > 0 ? displayAnalysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-red-700 dark:text-red-200 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 flex-shrink-0"></span>
                        {w}
                      </li>
                    )) : <li className="text-sm text-slate-500 italic opacity-60">Analysis required</li>}
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <span>🚀</span> {t.recommendedPlan}
                  </h4>
                  <ul className="space-y-1">
                    {displayAnalysis.recommendations && displayAnalysis.recommendations.length > 0 ? displayAnalysis.recommendations.map((r, i) => (
                      <li key={i} className="text-sm text-blue-700 dark:text-blue-200 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                        {r}
                      </li>
                    )) : <li className="text-sm text-slate-500 italic opacity-60">Analysis required</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Standard Analytics */}
        <Card>
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold">{t.perfTrend}</h3>
             <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                User: {user.name}
             </span>
          </div>
          
          {results.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results}>
                  <XAxis dataKey="topic" tick={{fontSize: 10}} interval={0} angle={-15} textAnchor="end" height={50}/>
                  <YAxis />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
              {t.noQuizData}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="bg-gradient-to-br from-brand-500 to-indigo-600 text-white border-none">
                <div className="text-4xl font-bold mb-1">{results.length}</div>
                <div className="text-indigo-100 text-sm">{t.quizzesCompleted}</div>
             </Card>
             <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
                <div className="text-4xl font-bold mb-1">
                  {results.length > 0 ? Math.round(results.reduce((a: number, b: QuizResult) => a + b.percentage, 0) / results.length) : 0}%
                </div>
                <div className="text-emerald-100 text-sm">{t.avgScore}</div>
             </Card>
        </div>
      </div>

      {/* History Column */}
      <div className="lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t.recentGen}</h3>
        </div>

        {/* Tags Filter Bar */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTag === null 
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {t.all}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag 
                    ? 'bg-brand-600 text-white' 
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {filteredHistory.length === 0 && (
            <p className="text-slate-500 italic text-sm text-center py-8">
              {history.length === 0 ? t.noActivity : t.noFilterMatch}
            </p>
          )}
          
          {filteredHistory.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group relative"
            >
              <div 
                className="cursor-pointer"
                onClick={() => onLoadItem(item)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors line-clamp-1 ltr:pr-4 rtl:pl-4">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 capitalize flex items-center gap-2">
                      <span>{item.type === 'note' ? t.modeNotes : item.type === 'quiz' ? t.modeQuiz : t.modeHomework}</span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${item.type === 'note' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : item.type === 'quiz' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                    {item.type === 'note' ? t.doc : item.type === 'quiz' ? t.quizShort : t.chk}
                  </span>
                </div>
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                {item.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {tag}
                    <button 
                      onClick={(e) => handleRemoveTag(e, item.id, tag)}
                      className="ltr:ml-1 rtl:mr-1 text-slate-400 hover:text-red-500 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
                
                {tagInputOpen === item.id ? (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <input
                      type="text"
                      autoFocus
                      className="w-24 text-xs px-2 py-1 rounded border border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-600"
                      placeholder={t.addTag}
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTag(item.id);
                        if (e.key === 'Escape') {
                          setTagInputOpen(null);
                          setNewTagValue('');
                        }
                      }}
                    />
                    <button 
                      onClick={() => handleAddTag(item.id)}
                      className="text-brand-600 hover:text-brand-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagInputOpen(item.id);
                      setNewTagValue('');
                    }}
                    className="text-xs text-slate-400 hover:text-brand-600 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    {t.addTag}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;