import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Quest } from '../data/quests';

export interface User {
  wallet: string;
  alias: string;
  xp: number;
  rank: number;
  avatar: string;
  completed: string[];
}

export interface QuestSubmission {
  id: string;
  questId: string;
  userId: string;
  userWallet: string;
  submittedAt: string;
  proofs: Record<number, string>;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SocialAccounts {
  twitter?: string;
  discord?: string;
  telegram?: string;
}

interface AppState {
  currentUser: User | null;
  isConnected: boolean;
  isOnline: boolean;
  syncing: boolean;

  quests: Quest[];
  completedQuests: string[];
  questSubmissions: QuestSubmission[];
  verificationAttempts: Record<string, number>;
  userSocialAccounts: Record<string, SocialAccounts>;

  connectWallet: () => void;
  disconnectWallet: () => void;
  completeQuest: (questId: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  syncWithDatabase: () => Promise<void>;
  loadInitialState: () => Promise<void>;
  updateSocialAccounts: (wallet: string, accounts: SocialAccounts) => Promise<void>;
}

const API_BASE = 'http://dnkquest-backend.vercel.app/api';

async function fetchUser(wallet: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/state`);
    const data = await res.json();
    return data.users.find((u: User) => u.wallet === wallet) || null;
  } catch (e) {
    console.error('Fetch user failed:', e);
    return null;
  }
}

async function createUser(user: User): Promise<void> {
  await fetch(`${API_BASE}/user/${user.wallet}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
}

async function saveUserCompletedQuests(wallet: string, completedQuests: string[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/user/${wallet}/completed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedQuests })
    });
  } catch (err) {
    console.error('Failed to save completed quests:', err);
  }
}

async function loadUserCompletedQuests(wallet: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/user/${wallet}/completed`);
    const data = await res.json();
    return data.completedQuests || [];
  } catch {
    return [];
  }
}

async function loadFromDatabase(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/state`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load DB:', err);
    return null;
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isConnected: false,
      isOnline: typeof navigator !== 'undefined' && navigator.onLine,
      syncing: false,
      quests: [],
      completedQuests: [],
      questSubmissions: [],
      verificationAttempts: {},
      userSocialAccounts: {},

      loadInitialState: async () => {
        set({ syncing: true });
        const dbData = await loadFromDatabase();
        if (dbData) {
          set({
            quests: dbData.quests || [],
            questSubmissions: dbData.questSubmissions || [],
            userSocialAccounts: dbData.userSocialAccounts || {},
            syncing: false
          });
        } else {
          set({ syncing: false });
        }
      },

      syncWithDatabase: async () => {
        const state = get();
        if (!state.isOnline) return;
        set({ syncing: true });
        try {
          await Promise.all([
            fetch(`${API_BASE}/state/quests`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state.quests),
            }),
            fetch(`${API_BASE}/state/questSubmissions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state.questSubmissions),
            }),
            fetch(`${API_BASE}/state/userSocialAccounts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state.userSocialAccounts),
            }),
            ...(state.currentUser
              ? [
                  fetch(`${API_BASE}/user/${state.currentUser.wallet}/completed`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completedQuests: state.completedQuests }),
                  }),
                ]
              : []),
          ]);
        } catch (error) {
          console.error('Sync failed:', error);
        } finally {
          set({ syncing: false });
        }
      },

      updateSocialAccounts: async (wallet, accounts) => {
        try {
          await fetch(`${API_BASE}/user/${wallet}/socials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accounts }),
          });

          // update local state
          set((state) => ({
            userSocialAccounts: {
              ...state.userSocialAccounts,
              [wallet]: accounts
            }
          }));
        } catch (err) {
          console.error('Failed to update social accounts:', err);
        }
      },

      connectWallet: async () => {
        if (!window.ethereum) return alert('MetaMask required');

        try {
          const [wallet] = await window.ethereum.request({ method: 'eth_requestAccounts' });
          let user = await fetchUser(wallet);
          const dbCompleted = await loadUserCompletedQuests(wallet);

          if (!user) {
            user = {
              wallet,
              alias: `user_${wallet.slice(-6)}`,
              xp: 0,
              rank: 0,
              avatar: 'https://example.com/default-avatar.png',
              completed: dbCompleted
            };
            await createUser(user);
          }

          set({
            currentUser: user,
            isConnected: true,
            completedQuests: dbCompleted
          });

          get().syncWithDatabase();
        } catch (error) {
          console.error('Wallet connection failed:', error);
          alert('Wallet connection failed. Try again.');
        }
      },

      disconnectWallet: () => set({ currentUser: null, isConnected: false, completedQuests: [] }),

      completeQuest: async (questId) => {
        const { currentUser, completedQuests, quests } = get();
        if (!currentUser || completedQuests.includes(questId)) return;
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;

        const updated = [...completedQuests, questId];
        set({ completedQuests: updated });
        await saveUserCompletedQuests(currentUser.wallet, updated);
      },

      getAllUsers: async () => {
        try {
          const res = await fetch(`${API_BASE}/state`);
          const data = await res.json();
          return data.users.sort((a: User, b: User) => b.xp - a.xp);
        } catch {
          return [];
        }
      }
    }),
    {
      name: 'live-store',
      partialize: (state) => ({
        verificationAttempts: state.verificationAttempts,
        userSocialAccounts: state.userSocialAccounts
      })
    }
  )
);

if (typeof window !== 'undefined') {
  useStore.getState().loadInitialState();

  window.addEventListener('online', () => {
    useStore.setState({ isOnline: true });
    useStore.getState().syncWithDatabase();
  });

  window.addEventListener('offline', () => {
    useStore.setState({ isOnline: false });
  });

  setInterval(() => {
    const state = useStore.getState();
    if (state.isOnline && !state.syncing) {
      state.syncWithDatabase();
    }
  }, 10000);
}
