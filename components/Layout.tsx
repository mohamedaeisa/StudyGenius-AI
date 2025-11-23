
import React, { useEffect, useState } from 'react';
import { AppView, Language, UserProfile } from '../types';
import { getStoredTheme, saveStoredTheme, saveStoredLanguage } from '../services/storageService';
import { TRANSLATIONS } from '../constants';

interface LayoutProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
  appLanguage: Language;
  setAppLanguage: (lang: Language) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children, appLanguage, setAppLanguage, user, onLogout }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getStoredTheme());
  const [showCopyMsg, setShowCopyMsg] = useState(false);
  const t = TRANSLATIONS[appLanguage];

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (appLanguage === Language.ARABIC) {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
      body.classList.add('font-arabic');
      body.classList.remove('font-sans');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
      body.classList.add('font-sans');
      body.classList.remove('font-arabic');
    }
    saveStoredLanguage(appLanguage);
  }, [appLanguage]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLanguage = () => setAppLanguage(appLanguage === Language.ENGLISH ? Language.ARABIC : Language.ENGLISH);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopyMsg(true);
    setTimeout(() => setShowCopyMsg(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center cursor-pointer group" onClick={() => user && onNavigate(AppView.HOME)}>
              <span className="text-3xl ltr:mr-3 rtl:ml-3 transform group-hover:rotate-12 transition-transform duration-300">🧬</span>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 leading-tight">
                  {t.appTitle}
                </span>
                <span className="text-[0.65rem] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase group-hover:text-brand-500 transition-colors">
                  {t.developedBy}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {user && (
                <nav className="hidden md:flex ltr:space-x-6 rtl:space-x-reverse rtl:space-x-6">
                  <button
                    onClick={() => onNavigate(AppView.HOME)}
                    className={`text-sm font-medium transition-colors ${currentView === AppView.HOME ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                  >
                    {t.menuCreate}
                  </button>
                  <button
                    onClick={() => onNavigate(AppView.DASHBOARD)}
                    className={`text-sm font-medium transition-colors ${currentView === AppView.DASHBOARD ? 'text-brand-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                  >
                    {t.menuDashboard}
                  </button>
                </nav>
              )}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

              <div className="flex items-center gap-2">
                 <button 
                   onClick={handleShare}
                   className="p-2 text-slate-500 hover:text-brand-600 transition-colors relative hidden sm:block"
                   title={t.shareApp}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  {showCopyMsg && (
                    <span className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap animate-fade-in z-50">
                      {t.appLinkCopied}
                    </span>
                  )}
                </button>

                <button onClick={toggleLanguage} className="px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded">
                  {appLanguage === Language.ENGLISH ? 'ع' : 'EN'}
                </button>

                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>

                {user && (
                  <div className="relative group ml-2">
                    <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50 transform origin-top-right">
                       <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                         <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                         <p className="text-xs text-slate-500 truncate">{user.email}</p>
                       </div>
                       <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                         {t.logout}
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {user && (
        <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
          <div className="flex justify-around items-center h-16">
            <button 
              onClick={() => onNavigate(AppView.HOME)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === AppView.HOME ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              <span className="text-xs font-medium">{t.menuCreate}</span>
            </button>
            <button 
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === AppView.DASHBOARD ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              <span className="text-xs font-medium">{t.menuDashboard}</span>
            </button>
          </div>
        </nav>
      )}

      <footer className="hidden md:block bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 flex flex-col items-center justify-center text-sm text-slate-500">
          <p className="text-base font-medium bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-200">
             {t.developedBy}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
