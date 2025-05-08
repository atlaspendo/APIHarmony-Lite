
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => {
        set({ isAuthenticated: false });
        // Optionally clear other app-specific persisted data on logout
        // For example, if openApiStore needs reset:
        // useOpenApiStore.getState().clear(); 
      },
    }),
    {
      name: 'api-harmony-auth-storage', // Unique name for localStorage item
      storage: createJSONStorage(() => localStorage), 
    }
  )
);
