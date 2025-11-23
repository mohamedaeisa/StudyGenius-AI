

import React, { useState } from 'react';
import { EducationSystem, Language, UserPreferences } from '../types';
import { EDUCATION_SYSTEMS, TRANSLATIONS, YEARS } from '../constants';
import Button from './ui/Button';
import Card from './ui/Card';

interface AuthScreenProps {
  onLogin: (email: string, name: string, prefs: UserPreferences) => void;
  onGuestLogin: () => void;
  appLanguage: Language;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onGuestLogin, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(YEARS[9]);
  const [curriculum, setCurriculum] = useState(EducationSystem.STANDARD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onLogin(email, name, {
        defaultYear: year,
        defaultCurriculum: curriculum,
        defaultLanguage: appLanguage
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in p-4">
      <div className="mb-8 text-center">
        <span className="text-6xl mb-4 block">🧬</span>
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-purple-600 mb-2">
          {t.appTitle}
        </h1>
        <p className="text-slate-500 text-lg">{t.loginSubtitle}</p>
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 shadow-2xl border-t-4 border-brand-500">
        <h2 className="text-2xl font-bold mb-6 text-center">{t.loginTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t.emailLabel}</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="student@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{t.nameLabel}</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t.prefYearLabel}</label>
              <select 
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-brand-500 outline-none text-sm"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{t.prefCurrLabel}</label>
              <select 
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-brand-500 outline-none text-sm"
                value={curriculum}
                onChange={e => setCurriculum(e.target.value as EducationSystem)}
              >
                {EDUCATION_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <Button type="submit" className="w-full py-3 text-lg mt-4 shadow-xl shadow-brand-500/20">
            {t.btnLogin}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">{t.or}</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full py-3 text-lg"
            onClick={onGuestLogin}
          >
            {t.btnGuest}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AuthScreen;