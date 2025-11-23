
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

export const loginUser = (email: string, name: string, preferences: UserPreferences): UserProfile => {
  const users = getUsers();
  
  if (users[email]) {
    // Existing user - update preferences if changed, or just return
    const updatedUser = {
      ...users[email],
      name: name, // Update name if changed
      preferences: { ...users[email].preferences, ...preferences }
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
      joinedAt: Date.now()
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
    joinedAt: Date.now()
  };
  
  saveUser(guestUser);
  localStorage.setItem(ACTIVE_USER_KEY, guestUser.email);
  return guestUser;
};

export const getActiveUser = (): UserProfile | null => {
  const email = localStorage.getItem(ACTIVE_USER_KEY);
  if (!email) return null;
  
  const users = getUsers();
  return users[email] || null;
};

export const logoutUser = () => {
  localStorage.removeItem(ACTIVE_USER_KEY);
};
