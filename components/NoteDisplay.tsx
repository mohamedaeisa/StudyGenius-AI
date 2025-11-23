
import React, { useEffect, useRef, useState } from 'react';
import { StudyNoteData, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Button from './ui/Button';

// Add Mermaid type to window
declare global {
  interface Window {
    mermaid: any;
    html2pdf: any;
  }
}

interface NoteDisplayProps {
  data: StudyNoteData;
  onBack: () => void;
  appLanguage: Language;
}

const MermaidDiagram: React.FC<{ code: string }> = ({ code }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  
  // Interaction State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.mermaid) {
      window.mermaid.initialize({ 
        startOnLoad: true, 
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
      });
      
      const renderDiagram = async () => {
        if (ref.current) {
          try {
            const id = `mermaid-${Math.round(Math.random() * 10000)}`;
            const { svg } = await window.mermaid.render(id, code);
            setSvgContent(svg);
            // Reset view on new render
            setScale(1);
            setPosition({ x: 0, y: 0 });
          } catch (e) {
            console.error('Mermaid render error:', e);
            ref.current!.innerHTML = '<div class="text-red-500 p-4">Error rendering diagram</div>';
          }
        }
      };
      renderDiagram();
    }
  }, [code]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); 
    // Only zoom if ctrl key is pressed or if it's a specific area, 
    // but for better UX, let's just use buttons for zoom usually, 
    // or intercept wheel only if we want specific behavior. 
    // Here we will implement pinch-to-zoom logic for trackpads or ctrl+wheel
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta), 4);
      setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale(s => Math.min(4, s + 0.2));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.2));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-800/50 relative group h-[500px]">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <button onClick={zoomIn} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Zoom In">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        </button>
        <button onClick={zoomOut} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Zoom Out">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
        </button>
        <button onClick={resetView} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Reset View">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 pointer-events-none opacity-50 text-xs text-slate-500 bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded">
        Drag to pan • Scroll to zoom
      </div>

      {/* Diagram Container */}
      <div 
        ref={containerRef}
        className={`w-full h-full overflow-hidden cursor-${isDragging ? 'grabbing' : 'grab'} bg-dot-pattern`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          ref={ref}
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out origin-center"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    </div>
  );
};

const NoteDisplay: React.FC<NoteDisplayProps> = ({ data, onBack, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];
  const [scrolled, setScrolled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleExportPDF = () => {
    const element = document.getElementById('study-note-content');
    if (element && window.html2pdf) {
      setIsExporting(true);
      
      const opt = {
        margin: [0.3, 0.3],
        filename: `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0, // Critical to prevent empty/blank pages when scrolled
          windowWidth: document.documentElement.scrollWidth,
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      // Small timeout to allow state to settle
      setTimeout(() => {
        window.html2pdf().set(opt).from(element).save().then(() => {
          setIsExporting(false);
        }).catch((err: any) => {
          console.error("PDF Export failed:", err);
          setIsExporting(false);
          // Fallback
          window.print();
        });
      }, 100);
    } else {
      window.print();
    }
  };
  
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // H1
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mt-10 mb-6 tracking-tight leading-tight">{line.replace('# ', '')}</h1>;
      }
      // H2
      if (line.startsWith('## ')) {
        return (
          <div key={idx} className="mt-10 mb-4 group">
            <h2 className="text-2xl font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2">
              <span className="w-2 h-8 bg-brand-500 rounded-full inline-block"></span>
              {line.replace('## ', '')}
            </h2>
          </div>
        );
      }
      // H3
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-xl font-bold text-slate-700 dark:text-slate-200 mt-6 mb-3">{line.replace('### ', '')}</h3>;
      }
      // Blockquote / Sticky Note
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="relative my-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
            <div className="relative bg-amber-50 dark:bg-slate-800 border-l-4 rtl:border-l-0 rtl:border-r-4 border-amber-500 p-6 rounded-r-lg rtl:rounded-l-lg shadow-sm">
              <span className="absolute top-4 ltr:right-4 rtl:left-4 text-amber-200 dark:text-amber-900/30 text-4xl font-serif leading-none">"</span>
              <p className="font-medium text-slate-700 dark:text-slate-300 italic relative z-10">
                {parseInline(line.replace('> ', ''))}
              </p>
            </div>
          </div>
        );
      }
      // Bullet list
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ltr:ml-4 rtl:mr-4 mb-2 flex items-start gap-3">
            <span className="text-brand-500 mt-1.5 text-xs">●</span>
            <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(line.replace(/^[-*] /, ''))}</span>
          </li>
        );
      }
      if (line.startsWith('```mermaid') || (line.startsWith('```') && lines[idx-1]?.startsWith('```mermaid'))) return null;
      if (line.startsWith('```')) return null;

      if (line.trim() === '') return <br key={idx} />;
      return <p key={idx} className="mb-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{parseInline(line)}</p>;
    });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="relative inline-block group mx-1">
             <span className="absolute inset-0 bg-brand-200 dark:bg-brand-900/60 transform -skew-x-12 rounded-sm group-hover:bg-brand-300 transition-colors"></span>
             <strong className="relative z-10 font-bold text-brand-900 dark:text-brand-100 px-1">{part.slice(2, -2)}</strong>
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Floating Action Bar */}
      <div className={`fixed top-20 ltr:right-4 rtl:left-4 z-40 flex flex-col gap-3 transition-all duration-300 ${scrolled ? 'translate-x-0' : 'ltr:translate-x-20 rtl:-translate-x-20 opacity-0 md:opacity-100 md:translate-x-0'}`}>
        <button 
          onClick={handleExportPDF}
          className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg hover:bg-brand-50 hover:text-brand-600 transition-all border border-slate-200 dark:border-slate-700 tooltip"
          title={t.exportPdf}
        >
          {isExporting ? (
             <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          )}
        </button>
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 dark:border-slate-700"
          title={t.close}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="max-w-4xl mx-auto animate-slide-up">
        {/* Header Section */}
        <div className="mb-10 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-500/20 blur-[100px] -z-10 rounded-full"></div>
          <Button variant="outline" onClick={onBack} className="md:hidden mb-4">← {t.back}</Button>
          <span className="inline-block py-1 px-3 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold tracking-widest uppercase mb-4">
            {t.modeNotes}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-brand-800 to-slate-900 dark:from-white dark:via-brand-200 dark:to-slate-200 mb-6 leading-tight">
            {data.title}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed italic font-serif">
            "{data.summary}"
          </p>
          <div className="flex justify-center gap-4 mt-6 text-sm text-slate-400 font-medium">
             <span>{t.generatedWith}</span>
             <span>•</span>
             <span>{new Date(data.timestamp).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content Card */}
        <div id="study-note-content" className="bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
          
          {data.mermaidCode && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 border-b border-slate-100 dark:border-slate-800">
              <MermaidDiagram code={data.mermaidCode} />
            </div>
          )}

          <div className="p-8 md:p-12">
            <article className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-brand-600">
              {renderMarkdown(data.markdownContent)}
            </article>

            {/* Footer of the note */}
            <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center" data-html2canvas-ignore="true">
              <div className="flex justify-center gap-4">
                <Button onClick={onBack} variant="secondary">{t.close}</Button>
                <Button onClick={handleExportPDF} variant="primary" isLoading={isExporting}>
                   {t.exportPdf}
                </Button>
                <Button onClick={() => window.print()} variant="outline">{t.print}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDisplay;
