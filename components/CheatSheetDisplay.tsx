
import React from 'react';
import { CheatSheetData, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Button from './ui/Button';

interface CheatSheetDisplayProps {
  data: CheatSheetData;
  onBack: () => void;
  appLanguage: Language;
}

const CheatSheetDisplay: React.FC<CheatSheetDisplayProps> = ({ data, onBack, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];

  const parseInline = (text: string) => {
    // Bold parsing (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      // Simple Code parsing (`text`)
      if (part.includes('`')) {
         const codeParts = part.split(/(`.*?`)/g);
         return codeParts.map((cp, j) => {
            if (cp.startsWith('`') && cp.endsWith('`')) {
                return <code key={`${i}-${j}`} className="bg-slate-100 dark:bg-slate-700 px-1 rounded font-mono text-sm text-pink-600 dark:text-pink-400">{cp.slice(1, -1)}</code>;
            }
            return cp;
         });
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // H1 - Title (skip if duplicative of card title, but render if distinct)
      if (line.startsWith('# ')) {
         return null; 
      }
      // H2 - Sections
      if (line.startsWith('## ')) {
        return (
          <div key={idx} className="break-inside-avoid-column mb-4 mt-6 border-b-2 border-teal-500 pb-1">
            <h2 className="text-lg font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {line.replace('## ', '')}
            </h2>
          </div>
        );
      }
      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ltr:ml-4 rtl:mr-4 mb-1 text-sm text-slate-700 dark:text-slate-300 leading-snug list-disc marker:text-teal-500">
             {parseInline(line.replace(/^[-*] /, ''))}
          </li>
        );
      }
      // Numbered lists
      if (line.match(/^\d+\. /)) {
         return <li key={idx} className="ltr:ml-4 rtl:mr-4 mb-1 text-sm text-slate-700 dark:text-slate-300 leading-snug list-decimal marker:font-bold marker:text-teal-600">
            {parseInline(line.replace(/^\d+\. /, ''))}
         </li>;
      }
      // Empty line
      if (line.trim() === '') return <div key={idx} className="h-2"></div>;
      
      return <p key={idx} className="mb-2 text-sm text-slate-600 dark:text-slate-400 leading-snug text-justify">{parseInline(line)}</p>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20 p-4">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6 no-print">
        <Button variant="outline" onClick={onBack}>← {t.back}</Button>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={() => window.print()}>🖨️ {t.print}</Button>
        </div>
      </div>

      {/* Sheet Container */}
      <div id="cheat-sheet-print" className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
         {/* Decorative Top Bar */}
         <div className="h-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"></div>
         
         <div className="p-8 md:p-12">
            {/* Title Header */}
            <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-6 mb-6">
               <span className="inline-block py-1 px-3 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold tracking-widest uppercase mb-2 border border-teal-100 dark:border-teal-800">
                 Cheat Sheet
               </span>
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">{data.topic}</h1>
               <p className="text-xs text-slate-400 uppercase tracking-widest">{new Date(data.timestamp).toLocaleDateString()}</p>
            </div>

            {/* Dense Content Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
               {renderContent(data.content)}
            </div>
         </div>
         
         {/* Decorative Bottom Bar */}
         <div className="h-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between px-4 text-[10px] text-slate-300">
            <span>StudyGenius AI</span>
            <span>Page 1 of 1</span>
         </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; color: black; }
          #cheat-sheet-print { box-shadow: none; border: none; }
          .columns-1 { column-count: 2; } /* Force columns on print */
        }
      `}</style>
    </div>
  );
};

export default CheatSheetDisplay;
