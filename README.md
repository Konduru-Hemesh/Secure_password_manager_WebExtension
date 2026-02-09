# ZeroVault: Zero-Knowledge Password Manager

![ZeroVault Banner](public/vite.svg)

> **Securely store and manage your passwords with Zero-Knowledge encryption.**

ZeroVault is a modern, secure, and user-friendly browser extension designed to keep your digital life safe. Built with a "Zero-Knowledge" architecture, it ensures that your data is encrypted locally on your device before it's ever stored, meaning only *you* have access to your passwords.

## Table of Contents

- [Intro](#intro)
- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installing and Running](#installing-and-running)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Intro

In an age of increasing data breaches, trusting third parties with your passwords is risky. ZeroVault solves this by implementing client-side encryption. Your master password never leaves your device, and your vault is encrypted using AES-GCM before being saved to local storage.

## About

ZeroVault was built to provide a seamless, secure password management experience directly in your browser. It combines robust security practices with a clean, modern UI powered by React and TailwindCSS.

### Key Principles
- **Zero-Knowledge**: We cannot see your data.
- **Local-First**: Data persists locally on your device.
- **Open Source**: Verify the code yourself.

## Features

- 🔐 **Zero-Knowledge Encryption**: AES-GCM encryption with PBKDF2 key derivation.
- 📝 **Credential Management**: Add, edit, and delete passwords easily.
- ⚡ **Auto-fill**: Automatically detects login forms and offers to fill credentials.
- 🛡️ **Security Audit**: Analyze your vault for weak or reused passwords.
- 🎲 **Password Generator**: Generate strong, unique passwords instantly.
- ☁️ **Sync Capable**: Built-in architecture to support multi-device sync (Mock service currently implemented).
- 🎨 **Modern UI**: Clean, responsive interface providing a premium user experience.

## Tech Stack

**Frontend & Extension Core:**
- **React 19**: Library for building user interfaces.
- **TypeScript**: Static typing for reliability.
- **Vite**: Next-generation frontend tooling.
- **TailwindCSS**: Utility-first CSS framework for styling.
- **Zustand**: Small, fast, and scalable state management.
- **React Router**: Declarative routing for React.
- **Lucide React**: Beautiful & consistent icons.
- **CRXJS**: Vite plugin for Chrome Extension development.

**Security:**
- **Web Crypto API**: Native browser cryptography for AES-GCM and PBKDF2.

## Installing and Running

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/zerovault.git
    cd zerovault
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Build the extension**
    ```bash
    npm run build
    ```

### Loading into Chrome/Edge

1.  Open your browser and navigate to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle in the top right).
3.  Click **Load unpacked**.
4.  Select the `dist` folder created in your project directory.

### Development Mode

To run in watch mode (updates automatically as you change code):
```bash
npm run dev
```

## Usage

1.  **Welcome**: On first install, you will be prompted to create a Master Password.
2.  **Unlock**: Use your Master Password to unlock the vault.
3.  **Add Credentials**: Click the "+" button to save new login details.
4.  **Auto-fill**: Navigate to a login page (e.g., github.com). If you have saved credentials, a ZeroVault icon will appear in the password field. Click it to fill.
5.  **Audit**: Go to **Settings > Security Dashboard** to check your password health.

## Project Structure

```
Web_Extension
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Layout wrappers
│   │   ├── modals/         # Modal components
│   │   └── ui/             # Base UI elements (Inputs, Buttons)
│   ├── extension/          # Extension-specific scripts
│   │   ├── background/     # Service worker
│   │   ├── contentScript/  # DOM interaction scripts
│   │   └── popup/          # Extension popup entry point
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Application views (Vault, Settings, Auth)
│   ├── services/           # External services (Storage, Sync)
│   ├── store/              # State management (Zustand)
│   └── utils/              # Helpers (Crypto, Types)
├── manifest.json           # Extension manifest
└── package.json            # Project dependencies
```

## Troubleshooting

### Extension not loading changes?
If you are in `npm run dev` mode, most changes reload automatically. However, changes to `manifest.json` or background scripts may require you to reload the extension manually from the `chrome://extensions` page.

### Password not filling?
Ensure the website's form fields are standard `<input>` elements. ZeroVault detects forms based on standard HTML attributes.

## License

Distributed under the MIT License. See `LICENSE` for more information.
