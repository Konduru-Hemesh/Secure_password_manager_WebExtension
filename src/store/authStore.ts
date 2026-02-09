import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthState } from '../utils/types';

interface AuthStore extends AuthState {
    encryptionKey: string | null;
    setRegistered: (registered: boolean, passwordHash: string, salt: string) => void;
    setAuthenticated: (authenticated: boolean, key?: string) => void;
    logout: () => void;
    reset: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            isRegistered: false,
            isAuthenticated: false,
            masterPasswordHash: undefined,
            vaultSalt: undefined,
            encryptionKey: null,

            setRegistered: (registered, passwordHash, salt) => set({
                isRegistered: registered,
                masterPasswordHash: passwordHash,
                vaultSalt: salt
            }),

            setAuthenticated: (authenticated, key) => set({
                isAuthenticated: authenticated,
                encryptionKey: key || null
            }),

            logout: () => set({ isAuthenticated: false, encryptionKey: null }),

            reset: () => set({
                isRegistered: false,
                isAuthenticated: false,
                masterPasswordHash: undefined,
                vaultSalt: undefined,
                encryptionKey: null
            }),
        }),
        {
            name: 'zerovault-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isRegistered: state.isRegistered,
                masterPasswordHash: state.masterPasswordHash,
                vaultSalt: state.vaultSalt
            }),
        }
    )
);
