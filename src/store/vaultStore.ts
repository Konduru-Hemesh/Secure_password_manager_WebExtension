import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VaultState, Credential, SyncStatus } from '../utils/types';
import { matchURL } from '../utils/urlMatcher';
import { saveCredentials } from '../services/storage';
import { useAuthStore } from './authStore';
import { syncService } from '../services/sync.service';

interface VaultStore extends VaultState {
    addCredential: (credential: Omit<Credential, 'id' | 'lastUpdated'>) => Promise<void>;
    updateCredential: (id: string, updates: Partial<Credential>) => Promise<void>;
    deleteCredential: (id: string) => Promise<void>;
    setSyncStatus: (status: SyncStatus) => void;
    setLocked: (locked: boolean) => void;
    clearVault: () => void;
    setCredentials: (credentials: Credential[]) => void;
    syncVault: () => Promise<void>;
}

// Helper to save to storage
const persistToStorage = async (credentials: Credential[]) => {
    const key = useAuthStore.getState().encryptionKey;
    if (key) {
        await saveCredentials(credentials, key);
        console.log('VaultStore: Persisted to storage');
    } else {
        console.warn('VaultStore: Cannot persist, no encryption key');
    }
};

export const useVaultStore = create<VaultStore>()(
    persist(
        (set, get) => ({
            isLocked: true,
            credentials: [],
            syncStatus: 'synced',
            lastSynced: Date.now(),

            addCredential: async (credential) => {
                const newCredential = {
                    ...credential,
                    id: crypto.randomUUID(),
                    lastUpdated: Date.now(),
                };

                set((state) => ({
                    credentials: [...state.credentials, newCredential],
                    syncStatus: 'pending' // Mark as pending sync
                }));

                // Persist securely
                await persistToStorage(get().credentials);

                // Trigger sync (optimistic)
                get().syncVault();
            },

            updateCredential: async (id, updates) => {
                set((state) => ({
                    credentials: state.credentials.map((c) =>
                        c.id === id ? { ...c, ...updates, lastUpdated: Date.now() } : c
                    ),
                    syncStatus: 'pending'
                }));

                await persistToStorage(get().credentials);
                get().syncVault();
            },

            deleteCredential: async (id) => {
                set((state) => ({
                    credentials: state.credentials.filter((c) => c.id !== id),
                    syncStatus: 'pending'
                }));

                await persistToStorage(get().credentials);
                get().syncVault();
            },

            setSyncStatus: (status) => set({ syncStatus: status }),

            setLocked: (locked) => set({ isLocked: locked }),

            clearVault: () => set({ credentials: [], lastSynced: undefined, syncStatus: 'synced' }),

            setCredentials: (credentials) => set({ credentials }),

            syncVault: async () => {
                const { credentials, lastSynced, setSyncStatus } = get();

                try {
                    setSyncStatus('syncing');
                    const result = await syncService.syncChanges(credentials, lastSynced || 0);

                    if (result.status === 'synced' && result.timestamp) {
                        set({
                            lastSynced: result.timestamp,
                            syncStatus: 'synced',
                            // In a real app, merge serverItems here
                        });
                    } else if (result.status === 'error') {
                        setSyncStatus('error');
                    }
                } catch (error) {
                    console.error('VaultStore: Sync failed', error);
                    setSyncStatus('error');
                }
            }
        }),
        {
            name: 'zerovault-vault-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                isLocked: state.isLocked,
                syncStatus: state.syncStatus,
                lastSynced: state.lastSynced
                // Exclude credentials from persistence (they go to chrome.storage.local)
            }),
        }
    )
);

// Helper function to get credentials by URL (outside the store)
export function getCredentialsByURL(url: string): Credential[] {
    const state = useVaultStore.getState();
    return state.credentials.filter((c) => matchURL(c.url, url));
}
