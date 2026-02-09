import { MessageType, type Message } from '../../utils/messaging';
import { matchURL } from '../../utils/urlMatcher';
import { encryptVaultData, decryptVaultData } from '../../utils/crypto';

console.log('ZeroVault: Background script initialized');

interface StoredCredential {
    id: string;
    name: string;
    url: string;
    username: string;
    password: string;
    notes?: string;
    createdAt: string;
}

let sessionKey: string | null = null;

// Initialize session key from storage.session (if available)
chrome.storage.session.get('sessionKey').then((result) => {
    if (result.sessionKey) {
        sessionKey = result.sessionKey as string;
        console.log('ZeroVault: Restored session key from session storage');
    }
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('ZeroVault: Extension installed');
    chrome.storage.local.set({
        zerovault_initialized: true,
        install_date: new Date().toISOString(),
    });
});

// Handle messages
chrome.runtime.onMessage.addListener((
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
) => {
    console.log('ZeroVault: Background received message:', message.type);

    switch (message.type) {
        case MessageType.SET_SESSION_KEY:
            if (message.data?.key) {
                sessionKey = message.data.key;
                chrome.storage.session.set({ sessionKey });
                console.log('ZeroVault: Session key set');
                sendResponse({ success: true });
            }
            break;

        case MessageType.REQUEST_CREDENTIALS:
            handleRequestCredentials(message.data, sendResponse);
            return true; // Async

        case MessageType.FORM_SUBMITTED:
            handleFormSubmitted(message.data, sender.tab);
            sendResponse({ success: true });
            break;

        case MessageType.SAVE_CREDENTIAL:
            handleSaveCredential(message.data);
            sendResponse({ success: true });
            break;

        default:
            console.log('ZeroVault: Unknown message type:', message.type);
    }

    return false;
});

async function getDecryptedCredentials(): Promise<StoredCredential[]> {
    if (!sessionKey) {
        console.log('ZeroVault: Locked (no session key)');
        return [];
    }

    try {
        const result = await chrome.storage.local.get('vault_credentials');
        const encrypted = result.vault_credentials;

        if (!encrypted) return [];

        // Check if data is already array (legacy/migration) or string (encrypted)
        if (Array.isArray(encrypted)) {
            // Potentially handle legacy plain text migration here if needed
            // For now we assume encrypted
            console.warn('ZeroVault: Found unencrypted array in storage, ignored for security');
            return [];
        }

        const decrypted = await decryptVaultData(encrypted as string, sessionKey);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('ZeroVault: Decryption failed:', error);
        return [];
    }
}

async function saveEncryptedCredentials(credentials: StoredCredential[]) {
    if (!sessionKey) {
        console.error('ZeroVault: Cannot save, no session key');
        return;
    }

    try {
        const json = JSON.stringify(credentials);
        const encrypted = await encryptVaultData(json, sessionKey);
        await chrome.storage.local.set({ vault_credentials: encrypted });
    } catch (error) {
        console.error('ZeroVault: Encryption failed:', error);
    }
}

async function handleRequestCredentials(
    data: { url: string },
    sendResponse: (response: any) => void
) {
    const credentials = await getDecryptedCredentials();
    const matching = credentials.filter((c) => matchURL(c.url, data.url));
    console.log(`ZeroVault: Found ${matching.length} matching credentials`);
    sendResponse({ credentials: matching });
}

async function handleFormSubmitted(
    data: { url: string; username: string; password: string },
    tab?: chrome.tabs.Tab
) {
    if (!tab?.id) return;
    if (!sessionKey) return; // Ignore if locked

    const credentials = await getDecryptedCredentials();
    const existing = credentials.find((c) =>
        matchURL(c.url, data.url) && c.username === data.username
    );

    if (existing) {
        if (existing.password !== data.password) {
            // TODO: Update prompt
            console.log('ZeroVault: Password changed');
        }
    } else {
        chrome.tabs.sendMessage(tab.id, {
            type: MessageType.SHOW_SAVE_PROMPT,
            data,
        });
    }
}

async function handleSaveCredential(data: { url: string; username: string; password: string }) {
    if (!sessionKey) return;

    const credentials = await getDecryptedCredentials();

    const newCredential: StoredCredential = {
        id: crypto.randomUUID(),
        name: new URL(data.url).hostname.replace('www.', ''),
        url: data.url,
        username: data.username,
        password: data.password,
        notes: '',
        createdAt: new Date().toISOString(),
    };

    credentials.push(newCredential);
    await saveEncryptedCredentials(credentials);
    console.log('ZeroVault: Credential saved');
}

// Auto-lock timer
let autoLockTimer: any = null;
function resetAutoLockTimer() {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    autoLockTimer = setTimeout(() => {
        console.log('ZeroVault: Auto-locking');
        sessionKey = null;
        chrome.storage.session.remove('sessionKey');
    }, 15 * 60 * 1000);
}

chrome.runtime.onMessage.addListener(resetAutoLockTimer);
