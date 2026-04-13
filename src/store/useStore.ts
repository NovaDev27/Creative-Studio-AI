import { create } from 'zustand';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type WorkType =
  | 'BOOK'
  | 'LIGHT_NOVEL'
  | 'WEB_NOVEL'
  | 'FANFICTION'
  | 'SHORT_STORY'
  | 'CHRONICLE'
  | 'FABLE'
  | 'POEM'
  | 'HAIKU'
  | 'BIOGRAPHY'
  | 'AUTOBIOGRAPHY'
  | 'EPISTOLARY';

export type AmbientMode = 'none' | 'coffee' | 'library' | 'rain' | 'urban';

interface AppState {
  user: User | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  
  // Ambient Mode State
  ambientMode: AmbientMode;
  setAmbientMode: (mode: AmbientMode) => void;
  
  // Focus Mode
  isFocusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  isZenMode: boolean;
  setZenMode: (zen: boolean) => void;
  isTypewriterSound: boolean;
  setTypewriterSound: (sound: boolean) => void;

  // Customization
  globalFont: string;
  setGlobalFont: (font: string) => void;
  
  // Loading State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;

  // Credits & Subscription
  credits: number;
  isLifetime: boolean;
  setCredits: (credits: number) => void;
  setIsLifetime: (isLifetime: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;

  // Theme & UX
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (seen: boolean) => void;

  // Writing Goals
  wordCountGoal: number;
  setWordCountGoal: (goal: number) => void;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  dailyWordCount: number;
  setDailyWordCount: (count: number) => void;
  lastWordCountDate: string;
  setLastWordCountDate: (date: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  
  ambientMode: 'none',
  setAmbientMode: (mode) => set({ ambientMode: mode }),
  
  isFocusMode: false,
  setFocusMode: (focus) => set({ isFocusMode: focus }),
  isZenMode: false,
  setZenMode: (zen) => set({ isZenMode: zen }),
  isTypewriterSound: false,
  setTypewriterSound: (sound) => set({ isTypewriterSound: sound }),

  globalFont: 'Poppins',
  setGlobalFont: (font) => set({ globalFont: font }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  loadingText: 'Preparando sua história...',
  setLoadingText: (text) => set({ loadingText: text }),

  credits: 0,
  isLifetime: false,
  setCredits: (credits) => set({ credits }),
  setIsLifetime: (isLifetime) => set({ isLifetime }),

  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  hasSeenTutorial: false,
  setHasSeenTutorial: (seen) => set({ hasSeenTutorial: seen }),

  wordCountGoal: 50000,
  setWordCountGoal: (goal) => set({ wordCountGoal: goal }),
  dailyGoal: 500,
  setDailyGoal: (goal) => set({ dailyGoal: goal }),
  dailyWordCount: 0,
  setDailyWordCount: (count) => set({ dailyWordCount: count }),
  lastWordCountDate: new Date().toDateString(),
  setLastWordCountDate: (date) => set({ lastWordCountDate: date }),

  fetchProfile: async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        // Map any legacy fields or just set what's needed
        // Note: credits/isLifetime might not be in the new User schema yet
        // but let's keep them if they exist or default them
        set({ 
          credits: profile.credits || 0, 
          isLifetime: profile.isLifetime || false,
          dailyWordCount: profile.dailyWordCount || 0,
          lastWordCountDate: profile.lastWordCountDate || new Date().toDateString()
        });
      } else {
        // Profile doesn't exist, useAuth hook usually handles creation
        // but we can have a fallback here if needed
        set({ credits: 0, isLifetime: false });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  },
}));
