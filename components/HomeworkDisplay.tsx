
import React, { useState } from 'react';
import { HomeworkData, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Button from './ui/Button';

interface HomeworkDisplayProps {
  data: HomeworkData;
  onBack: () => void;
  appLanguage: Language;
}

const HomeworkDisplay: React.FC<HomeworkDisplayProps> = ({ data, onBack, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];
  const [isZoomed, setIsZoomed] = useState(false);

  const parseInline = (text: string) => {
    // Bold parsing (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-1 rounded mx-0.5">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) return null; // Skip main title as we render it in header
      
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold mt-4 mb-2 text-slate-800 dark:text-slate-200">{line.replace('### ', '')}</h3>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ltr:ml-4 rtl:mr-4 list-none relative ltr:pl-5 rtl:pr-5 mb-2 text-slate-700 dark:text-slate-300">
             <span className="absolute ltr:left-0 rtl:right-0 top-1.5 w-1.5 h-1.5 bg-brand-400 rounded-full"></span>
             {parseInline(line.replace(/^[-*] /, ''))}
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
         return <li key={idx} className="ltr:ml-5 rtl:mr-5 list-decimal mb-2 font-medium text-slate-700 dark:text-slate-300">{parseInline(line.replace(/^\d+\. /, ''))}</li>;
      }
      if (line.trim() === '') return <br key={idx} />;
      return <p key={idx} className="mb-2 leading-relaxed text-slate-600 dark:text-slate-400">{parseInline(line)}</p>;
    });
  };

  // Split by H2 headers (## ), keeping the structure
  const sections = data.feedback.split(/\n(?=## )/);

  return (
    <div className="max-w-7xl mx-auto animate-slide-up pb-20">
      
      {/* Zoom Modal */}
      {isZoomed && data.originalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <img 
            src={data.originalImage} 
            alt="Zoomed Homework" 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          <button className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button variant="outline" onClick={onBack} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
             <span className="ltr:block rtl:hidden">←</span>
             <span className="ltr:hidden rtl:block">→</span>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Homework Report</h1>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={() => window.print()} className="w-full md:w-auto flex items-center justify-center gap-2">
            <span>🖨️</span> {t.print}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Student Work (Sticky) - spans 4 columns */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
           <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700">
             <div className="flex justify-between items-center mb-4">
               <span className="text-xs font-mono text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded">
                  {new Date(data.timestamp).toLocaleDateString()}
               </span>
             </div>
             
             {data.originalImage ? (
               <div 
                 className="relative group overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 cursor-zoom-in"
                 onClick={() => setIsZoomed(true)}
               >
                 <img 
                   src={data.originalImage} 
                   alt="Submitted Homework" 
                   className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                 />
               </div>
             ) : (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">No Image</span>
                </div>
             )}
           </div>
        </div>

        {/* Right Column: AI Feedback - spans 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          {sections.map((section, index) => {
            const lines = section.split('\n');
            const firstLine = lines[0].trim();
            
            let type: 'default' | 'success' | 'error' | 'warning' | 'info' = 'default';
            let title = '';
            let content = section;
            let icon = '📝';

            if (firstLine.startsWith('## ')) {
              title = firstLine.replace('## ', '');
              content = lines.slice(1).join('\n'); // remove header

              if (title.includes('✅') || title.includes('Correct') || title.includes('Strength')) { type = 'success'; icon = '✅'; }
              else if (title.includes('❌') || title.includes('Improvement') || title.includes('Correction')) { type = 'error'; icon = '🔧'; }
              else if (title.includes('💡') || title.includes('Action') || title.includes('Recommend')) { type = 'warning'; icon = '💡'; }
              else if (title.includes('🔍') || title.includes('Analysis')) { type = 'info'; icon = '🔍'; }
            } else {
               // Intro section (H1 usually)
               return (
                 <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
                   <div className="prose dark:prose-invert max-w-none prose-h1:text-4xl prose-h1:font-black prose-h1:text-transparent prose-h1:bg-clip-text prose-h1:bg-gradient-to-r prose-h1:from-brand-600 prose-h1:to-purple-600">
                     {renderContent(content)}
                   </div>
                 </div>
               );
            }

            // Styling logic
            let bgClass = "bg-white dark:bg-slate-800";
            let borderClass = "border-l-4 rtl:border-l-0 rtl:border-r-4 border-slate-200";
            let titleColor = "text-slate-800 dark:text-white";
            let iconBg = "bg-slate-100 dark:bg-slate-700";

            switch(type) {
              case 'success':
                bgClass = "bg-green-50/50 dark:bg-green-900/10";
                borderClass = "border-l-4 rtl:border-l-0 rtl:border-r-4 border-green-500";
                titleColor = "text-green-800 dark:text-green-300";
                iconBg = "bg-green-100 dark:bg-green-900/30 text-green-600";
                break;
              case 'error':
                bgClass = "bg-red-50/50 dark:bg-red-900/10";
                borderClass = "border-l-4 rtl:border-l-0 rtl:border-r-4 border-red-500";
                titleColor = "text-red-800 dark:text-red-300";
                iconBg = "bg-red-100 dark:bg-red-900/30 text-red-600";
                break;
              case 'warning':
                bgClass = "bg-amber-50/50 dark:bg-amber-900/10";
                borderClass = "border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-500";
                titleColor = "text-amber-800 dark:text-amber-300";
                iconBg = "bg-amber-100 dark:bg-amber-900/30 text-amber-600";
                break;
              case 'info':
                bgClass = "bg-blue-50/50 dark:bg-blue-900/10";
                borderClass = "border-l-4 rtl:border-l-0 rtl:border-r-4 border-blue-500";
                titleColor = "text-blue-800 dark:text-blue-300";
                iconBg = "bg-blue-100 dark:bg-blue-900/30 text-blue-600";
                break;
            }

            return (
              <div key={index} className={`${bgClass} rounded-2xl p-6 shadow-sm ${borderClass} transition-all duration-300 hover:shadow-md`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-xl shadow-inner`}>
                    {icon}
                  </div>
                  <div className="flex-grow">
                    <h3 className={`text-xl font-bold mb-3 ${titleColor}`}>{title.replace(/^[✅❌💡🔍]\s*/, '')}</h3>
                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {renderContent(content)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomeworkDisplay;
