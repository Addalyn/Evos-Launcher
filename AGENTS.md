# AGENTS.md

> Operational guide and codebase reference for AI agents working on **Evos-Launcher**.

---

## 1. Project Overview

**Evos-Launcher** is an Electron-based desktop launcher and companion client tailored for the revived *Atlas Reactor* community ecosystem. It integrates with community-hosted game backends (primarily [Zheneq/EvoS](https://github.com/Zheneq/EvoS) lobby server and [Zheneq/hc](https://github.com/Zheneq/hc) game server).

### Core Features
- **Authentication & Multi-Account Management**: Store and switch between multiple user accounts and credentials.
- **Launch & Ticket Management**: Automated game process execution, config file injection, and ticket-based authentication.
- **Real-Time Social & Lobbies**: Live player status tracking, in-launcher chat, followed players, and Discord Rich Presence (RPC) integration.
- **Game Content & Statistics**: In-depth player stats, match history, replay parsing/downloading, quests, and tournament tracking/administration.
- **Updates & Maintenance**: Auto-updater integration (`electron-updater`), branch/patch asset downloader, and error log viewer.
- **App Editions**: Standard and Lite edition (`APP_EDITION=lite`).

---

## 2. Tech Stack & Dependencies

| Layer | Technologies |
| :--- | :--- |
| **Runtime & Shell** | Electron `^44.5.1`, Node `>=14.x`, Electron React Boilerplate (ERB) |
| **Frontend Framework** | React `^19.1.1`, React DOM `^19.1.1`, React Router DOM `^7.9.1` |
| **Language & Typings** | TypeScript `^5.9.2`, `@types/react` `^19.1.13`, `@types/node` `^24.5.1` |
| **UI Components & Styling** | Material UI (MUI) `^7.3.2`, Emotion `^11.14`, Material React Table `^3.2.1`, MUI Color Input |
| **State & Storage** | Zustand `^5.0.8`, `electron-settings` `^4.0.2`, `browserStorage` (fallback) |
| **Data & Networking** | Axios `^1.12.2`, `react-use-websocket` `^4.13.0`, Cheerio `^1.1.2`, Strapi client |
| **Data Viz & Markdown** | Chart.js `^4.5.0`, `react-chartjs-2` `^5.3.0`, `react-markdown` `^10.1.0` |
| **Internationalization** | `i18next` `^25.5.2`, `react-i18next` `^15.7.3` |
| **Build & Packaging** | Webpack `^5.101.3`, `ts-loader`, `electron-builder` `^24.9.1`, `electronmon` `^2.0.2` |
| **Testing & Linting** | Jest `^30.1.3`, `@testing-library/react` `^16.3.0`, ESLint `^8.56.0` (`eslint-config-erb`) |
| **Native / Platform Tools** | `regedit` `^5.1.4` (Windows registry via VBS scripts), `semaphore` `^1.1.0` |

---

## 3. Directory Structure

```plaintext
Evos-Launcher/
├── .erb/                       # Electron React Boilerplate build configs & scripts
│   ├── configs/                # Webpack configs (main, renderer, preload, dll)
│   └── scripts/                # Helper scripts (clean, port check, native deps, notarize)
├── assets/                     # Static assets (icons, images, audio, Windows VBS scripts)
│   └── vbs/                    # External VBScript files required by `regedit` on Windows
├── release/                    # Output directory for packaged application builds
├── src/
│   ├── __tests__/              # Unit and component tests (Jest + Testing Library)
│   ├── main/                   # Main Electron process
│   │   ├── config/             # Config files, default launcher settings
│   │   ├── discord/            # Discord auth, OAuth flow, and rich presence services
│   │   ├── download/           # File download handlers and checksum validation
│   │   ├── handlers/           # IPC handler implementations (ipcHandlers.ts)
│   │   ├── services/           # GameService, DiscordService, DownloadService, TranslationService
│   │   ├── types/              # Main process types and interfaces
│   │   ├── utils/              # Utilities (path helpers, system metrics, file utils)
│   │   ├── windows/            # Window lifecycle & creation (MainWindow, SplashWindow)
│   │   ├── main.ts             # Electron main entry point, lifecycle, tray setup
│   │   ├── preload.ts          # Secure context bridge exposing `window.electron`
│   │   └── util.ts             # Asset resolver and environment helpers
│   └── renderer/               # Renderer React process
│       ├── components/
│       │   ├── atlas/          # Atlas Reactor-specific assets, models, and widgets
│       │   ├── common/         # Shared UI elements (buttons, inputs, tooltips, cards)
│       │   ├── generic/        # Layout components, navigation bar, tournament brackets
│       │   ├── pages/          # Full route pages (LoginPage, StatsPage, ReplaysPage, etc.)
│       │   ├── settings/       # Settings tabs and configuration panels
│       │   ├── stats-unified/  # Unified player statistics views and leaderboards
│       │   └── ui/             # Atomic UI controls and modal dialogs
│       ├── config/             # Route configurations and navigation definitions
│       ├── hooks/              # Custom React hooks (window dimension, interval, state)
│       ├── lib/                # Core stores and clients:
│       │   ├── EvosStore.ts    # Global Zustand store (state, auth, theme, settings)
│       │   ├── Evos.ts         # Lobby server & game server communication protocol
│       │   ├── chatApi.ts      # Real-time chat API client
│       │   └── strapi.tsx      # News and CMS integration
│       ├── locales/            # i18n localization JSON dictionaries (en, fr, de, etc.)
│       ├── types/              # Renderer process TypeScript models
│       ├── utils/              # Client-side utility functions and formatting helpers
│       ├── App.tsx             # Root React component, theme provider, and route tree
│       ├── index.tsx           # React DOM render entry point
│       └── preload.d.ts        # Global Window interface augmentation (`window.electron`)
├── package.json                # Project dependencies, scripts, and build metadata
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 4. Key Development Commands

Always run these commands from the repository root:

### Development
```bash
# Start renderer dev server (checks port & serves via webpack-dev-server)
npm start

# Run the Electron main process in dev mode (watches src/main/** with electronmon)
npm run start:main

# Start preload compilation in dev mode
npm run start:preload

# Run Lite Edition in development mode
npm run start:lite
```

### Build & Packaging
```bash
# Build both main and renderer bundles for production
npm run build

# Build Lite Edition bundle
npm run build:lite

# Package desktop installer/binaries with electron-builder
npm run package

# Package Lite Edition
npm run package:lite

# Rebuild native modules against current Electron headers
npm run rebuild
```

### Quality & Testing
```bash
# Run ESLint across all TypeScript and JavaScript files
npm run lint

# Run Jest test suites
npm test
```

---

## 5. Architectural Patterns & Rules for Agents

### 5.1. IPC Communication (Main $\leftrightarrow$ Renderer)
1. **Never expose raw Electron or Node modules** in the renderer.
2. Follow the 3-step contract whenever adding or modifying IPC calls:
   - **Step 1: Declare in `src/main/preload.ts`**:
     Add the channel name to the `Channels` union and expose typed methods on `electronHandler`.
   - **Step 2: Implement in `src/main/handlers/ipcHandlers.ts`**:
     Register `ipcMain.handle` (for request/response) or `ipcMain.on` (for one-way messages). Handle errors gracefully and log via `electron-log`.
   - **Step 3: Augment types in `src/renderer/preload.d.ts`**:
     Ensure `Window['electron']` exposes the exact method signature so TypeScript provides full autocomplete and type safety in the renderer.
3. In renderer components, call IPC methods via `window.electron.<method>()` or use the safe wrapper `withElectron` defined in `EvosStore.ts` if running in environments where `window.electron` might be mocked or missing.

### 5.2. State Management with Zustand (`EvosStore.ts`)
- Global launcher state (active account, saved accounts, theme mode, game executable path, download states, active server) resides in `EvosStore`.
- Use selectors for state consumption in components to prevent unnecessary re-renders:
  ```tsx
  const currentUser = useEvosStore((state) => state.currentUser);
  const setCurrentUser = useEvosStore((state) => state.setCurrentUser);
  ```
- Any state that must survive app restarts should synchronize with `electron-settings` via the store's persistence handlers.

### 5.3. React 19 & Styling Conventions
- **Component Style**: Use React 19 functional components with TypeScript interfaces for `Props`.
- **UI Framework**: Utilize `@mui/material` and Emotion (`@emotion/styled`, `sx` prop). Match the existing dark sci-fi aesthetic inspired by *Atlas Reactor*.
- **Avoid Tailwind**: Do not add Tailwind CSS; keep styles unified using MUI system, CSS modules, and `App.css` / `Discord.css`.
- **Modals & Dialogs**: Follow patterns in `src/renderer/components/ui/` for custom confirm/alert dialogs.

### 5.4. Windows & Platform-Specific Constraints
- **Windows Registry (`regedit`)**:
  - The app searches for game installations via the Windows Registry.
  - On Windows, `regedit` requires external VBS files located at `resources/assets/vbs`.
  - Always guard registry operations with `process.platform === 'win32'`.
- **Path Handling**:
  - Always use `path.join()`, `path.resolve()`, or `path.normalize()` instead of string concatenation with `/` or `\`.
- **Game Process Management**:
  - Process launching and ticket injection are handled in `src/main/services/gameService.ts`.
  - Closing the launcher monitors whether the game process is still active and prompts the user before terminating.

### 5.5. Logging and Error Handling
- In the **Main Process**, use `electron-log`:
  ```ts
  import log from 'electron-log';
  log.info('Operation succeeded:', details);
  log.error('Failed to execute command:', err);
  ```
- Avoid unhandled promise rejections in IPC handlers. Always wrap async operations in `try/catch` and return `{ success: boolean, error?: string }` or a descriptive error payload back to the renderer.

### 5.6. Internationalization (i18n)
- All user-facing strings in renderer pages and dialogs should use `useTranslation()` from `react-i18next`:
  ```tsx
  const { t } = useTranslation();
  return <Typography>{t('SETTINGS.GAME_PATH_LABEL')}</Typography>;
  ```
- When adding new UI copy, add corresponding keys to `src/renderer/locales/en/translation.json` and keep keys grouped by page/feature.

---

## 6. Pre-Commit / Pull Request Checklist for Agents

Before completing any task, verify:
- [ ] `npm run lint` passes without new errors.
- [ ] Any new IPC handlers are synchronized across `preload.ts`, `ipcHandlers.ts`, and `preload.d.ts`.
- [ ] No raw credentials or sensitive tokens are written to log files.
- [ ] Path resolution works correctly across both Windows and Unix environments.
- [ ] Existing comments, docstrings, and licensing headers are preserved.
