
import { UserProfile, UserPreferences, Language, EducationSystem } from '../types';
import { YEARS } from '../constants';

const USERS_KEY = 'studygenius_users';
const ACTIVE_USER_KEY = 'studygenius_active_user';

// Mock database interactions using LocalStorage
const getUsers = (): Record<string, UserProfile> => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveUser = (user: UserProfile) => {
  const users = getUsers();
  users[user.email] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const INITIAL_GAMIFICATION = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: 0,
  earnedBadges: []
};

export const loginUser = (email: string, name: string, preferences: UserPreferences): UserProfile => {
  const users = getUsers();
  
  if (users[email]) {
    // Existing user - ensure gamification exists (migration)
    const existing = users[email];
    const updatedUser = {
      ...existing,
      name: name,
      preferences: { ...existing.preferences, ...preferences },
      gamification: existing.gamification || INITIAL_GAMIFICATION
    };
    saveUser(updatedUser);
    localStorage.setItem(ACTIVE_USER_KEY, email);
    return updatedUser;
  } else {
    // New user
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email,
      name,
      preferences,
      joinedAt: Date.now(),
      gamification: INITIAL_GAMIFICATION
    };
    saveUser(newUser);
    localStorage.setItem(ACTIVE_USER_KEY, email);
    return newUser;
  }
};

export const loginGuest = (): UserProfile => {
  const guestUser: UserProfile = {
    id: 'guest',
    email: 'guest',
    name: 'Guest Student',
    preferences: {
      defaultYear: YEARS[9], // Grade 10
      defaultCurriculum: EducationSystem.STANDARD,
      defaultLanguage: Language.ENGLISH
    },
    joinedAt: Date.now(),
    gamification: INITIAL_GAMIFICATION
  };
  
  saveUser(guestUser);
  localStorage.setItem(ACTIVE_USER_KEY, guestUser.email);
  return guestUser;
};

export const getActiveUser = (): UserProfile | null => {
  const email = localStorage.getItem(ACTIVE_USER_KEY);
  if (!email) return null;
  
  const users = getUsers();
  let user = users[email] || null;
  
  // Patch logic for old users without gamification
  if (user && !user.gamification) {
    user = { ...user, gamification: INITIAL_GAMIFICATION };
    saveUser(user);
  }
  
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(ACTIVE_USER_KEY);
};
