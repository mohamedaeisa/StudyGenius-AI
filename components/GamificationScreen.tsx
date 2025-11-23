
import React from 'react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS, BADGES, LEVEL_THRESHOLD } from '../constants';
import Card from './ui/Card';

interface GamificationScreenProps {
  user: UserProfile;
  appLanguage: Language;
}

const GamificationScreen: React.FC<GamificationScreenProps> = ({ user, appLanguage }) => {
  const t = TRANSLATIONS[appLanguage];
  
  // Mock Leaderboard Data (in a real app, fetch from backend)
  const leaderboard = [
    { name: 'Sarah M.', xp: 2450, level: 12, isUser: false },
    { name: user.name, xp: user.gamification.xp, level: user.gamification.level, isUser: true },
    { name: 'Ahmed K.', xp: 1890, level: 9, isUser: false },
    { name: 'John D.', xp: 1200, level: 6, isUser: false },
    { name: 'Maria S.', xp: 850, level: 4, isUser: false },
  ].sort((a, b) => b.xp - a.xp);

  const currentLevelXpStart = (user.gamification.level - 1) * LEVEL_THRESHOLD;
  const nextLevelXpStart = user.gamification.level * LEVEL_THRESHOLD;
  const xpProgress = Math.min(100, Math.max(0, ((user.gamification.xp - currentLevelXpStart) / LEVEL_THRESHOLD) * 100));

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in space-y-8">
      
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-brand-600 mb-2">
          {t.menuGamification}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Track your achievements and compete with others!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Challenge & Progress */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weekly Challenge Banner (Moved from Dashboard) */}
          <div className="bg-gradient-to-r from-amber-200 to-yellow-400 dark:from-amber-900 dark:to-yellow-900/50 rounded-3xl p-8 shadow-xl border border-yellow-300 dark:border-yellow-800 relative overflow-hidden transform transition-transform hover:scale-[1.01]">
            <div className="absolute top-0 right-0 text-9xl opacity-10 transform translate-x-10 -translate-y-4 select-none">🏆</div>
            <h3 className="text-yellow-900 dark:text-yellow-100 font-black text-sm uppercase tracking-widest mb-2 opacity-80">{t.weeklyChallenge}</h3>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3">{t.challengeTitle}</h2>
            <p className="text-slate-800 dark:text-slate-200 mb-6 font-medium text-lg max-w-md">{t.challengeDesc}</p>
            
            <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-black/40 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md shadow-sm">
                    <span className="text-lg">🎁</span> {t.challengeReward}
                </div>
                <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-black/40 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md shadow-sm">
                    <span className="text-lg">⏳</span> 2 Days Left
                </div>
            </div>
          </div>

          {/* Level Progress Detailed */}
          <Card className="p-8 relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl"></div>
             <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <span>📈</span> Level Progress
             </h3>
             
             <div className="flex items-center justify-between mb-2 text-sm font-bold text-slate-500">
                <span>Level {user.gamification.level}</span>
                <span>Level {user.gamification.level + 1}</span>
             </div>
             <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-600 relative"
                  style={{ width: `${xpProgress}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                </div>
             </div>
             <p className="text-center text-sm text-slate-500">
                <span className="font-bold text-brand-600">{nextLevelXpStart - user.gamification.xp} XP</span> needed for next level
             </p>
          </Card>

          {/* Trophy Room (Badges) - Moved from Dashboard */}
          <Card className="bg-slate-50 dark:bg-slate-800/50 p-8">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
               <span>🎖️</span> {t.trophyRoom}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {BADGES.map(badge => {
                const isUnlocked = user.gamification.earnedBadges.includes(badge.id);
                // @ts-ignore
                const name = t[badge.nameKey] || badge.nameKey;
                // @ts-ignore
                const desc = t[badge.descKey] || badge.descKey;
                
                return (
                  <div key={badge.id} className="relative group flex flex-col items-center text-center">
                     <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 transition-all duration-300 transform group-hover:-translate-y-1 ${
                       isUnlocked 
                         ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-300 dark:from-yellow-900/30 dark:to-amber-900/10 dark:border-yellow-700/50 grayscale-0' 
                         : 'bg-slate-100 border-slate-200 dark:bg-slate-700 dark:border-slate-600 grayscale opacity-40'
                     }`}>
                       {badge.icon}
                     </div>
                     <span className={`mt-3 text-xs font-bold ${isUnlocked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{name}</span>
                     
                     {/* Tooltip */}
                     <div className="absolute bottom-full mb-2 w-40 p-3 bg-slate-900 text-white text-xs rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-50 shadow-xl transform translate-y-2 group-hover:translate-y-0">
                       <p className="font-bold mb-1 text-amber-400">{name}</p>
                       <p className="leading-relaxed">{desc}</p>
                       {!isUnlocked && <p className="text-slate-400 mt-2 italic border-t border-slate-700 pt-1">Locked</p>}
                       {isUnlocked && <p className="text-green-400 mt-2 font-bold border-t border-slate-700 pt-1">Unlocked!</p>}
                     </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-1">
           <Card className="h-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                 <span className="text-2xl">🏅</span>
                 <h3 className="font-bold text-xl">{t.leaderboard}</h3>
              </div>

              <div className="space-y-4">
                 {leaderboard.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center p-4 rounded-xl border transition-all ${
                        entry.isUser 
                          ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800 shadow-md transform scale-105' 
                          : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm mr-4 ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-slate-300 text-slate-800' :
                          index === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-500'
                       }`}>
                          {index + 1}
                       </div>
                       
                       <div className="flex-grow">
                          <p className={`font-bold ${entry.isUser ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                             {entry.name} {entry.isUser && '(You)'}
                          </p>
                          <p className="text-xs text-slate-500">Level {entry.level}</p>
                       </div>

                       <div className="font-mono font-bold text-slate-600 dark:text-slate-400">
                          {entry.xp.toLocaleString()} XP
                       </div>
                    </div>
                 ))}
              </div>
              
              <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                 <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">
                    Keep studying to climb the ranks!
                 </p>
              </div>
           </Card>
        </div>

      </div>
    </div>
  );
};

export default GamificationScreen;
