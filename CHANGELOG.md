# Evos Launcher Changelog

# [3.1.7] - 2026-01-22

## Features & Improvements

- **Splash Screen Redesign**: Complete visual overhaul with modern, premium aesthetics
- **Download Page**: Improved the way the download works.
- **UI Modernization - Pages Redesign**: Complete visual overhaul of three key pages with contemporary design patterns
  - **ReplaysPage Modernization**:  
  - **LogsPage Modernization**:
  - **FollowedPlayersPage Modernization**:

- **Translation Support**:
  - Added 21 new translation keys across 10 languages (English, German, Spanish, French, Italian, Dutch, Russian, Turkish, Chinese, Brazilian Portuguese)
  - All new UI elements fully internationalized for global user base

# [3.1.6] - 2026-01-17

## Features & Improvements

- **Navigation Drawer Redesign**: 
  - Implemented a wider, more modern layout for the navigation drawer
  - Added smooth transitions and improved typography for menu items
  - Enhanced "special" items (like Support Us) with glassmorphism effects and radiant gradients
  - Improved spacing and borders across the entire drawer for a cleaner look
- **Theme Logic Refactor**:
  - Simplified theme application logic in `EvosStore` for better performance
  - Updated default theme colors for both dark and light modes to improve UI contrast
- **UI Compactness**:
  - Further optimized the Status Page layout by reducing padding in main components

# [3.1.5] - 2026-01-16

## Features & Improvements

- **Compact UI Layout**: Made the status page more compact for better space utilization
  - Reduced padding and margins in Queue components
  - Changed queue titles from `h4` to `h5` for a more compact appearance
  - Reduced spacing between player groups and queue sections
  - Removed decorative indicator dots from queue and server titles for cleaner look
  - Reduced List padding in Group components

## Bug Fixes

- **Empty Queue Display**: Fixed issue where "Not Queued" section would display empty when all players were in-game
  - Queue component now pre-filters groups and only renders when there are visible players
  - Prevents rendering empty queue sections, improving UI clarity

## Improvements

- Steam installation detection on Linux is no longer limited to Steam Deck and should now work on other systems as well.

# [3.1.4] - 2025-11-30

## Bug Fixes

- Fixed so automatic check for branches works correctly again.

# [3.1.3] - 2025-10-12

## Bug Fixes

- Fixed player card displaying another player's title in some circumstances.

# [3.1.2] - 2025-10-04

## Bug Fixes

- if user is still on evos-emu.com, update config to ar.zheneq.net. so no need to switch proxy manually.

# [3.1.1] - 2025-10-04

## Bug Fixes

- Changed evos-emu.com to ar.zheneq.net, as evos-emu.com is no longer available.

# [3.1.0] - 2025-09-17

## Features & Improvements

- **Updated Dependencies**: Several dependencies have been updated to their latest versions to improve performance and security.

# [3.0.10] - 2025-09-15

## Bug Fixes

- Fixed an issue where you would have been logged out but not tell you, requiring you to go to profile page or click logout to be able to log back in

# [3.0.9] - 2025-08-15

## Features & Improvements

- Checking for updates on the loading screen,
  - Change the way auto update works, no longer silent but with a window installer so you can install it yourself.
- Changed setting page, improved layout and accessibility.
  - Split code in multiple components for better organization and maintainability.
  - Now uses Tabs for better navigation. No longer a very long settings page.

# [3.0.8] - 2025-08-15

## Features & Improvements

- Improved Settings Page logic:
  - Now checks for valid user token before showing account/game/config/advanced/branch sections.
  - Moved `isElectron` to a state variable and set it via `useEffect` for better SSR compatibility.
  - Cleaned up and improved conditional rendering for better user experience and security.

# [3.0.7] - 2025-08-10

## Features & Improvements

- Add Settings to webversion and improve its functionality

# [3.0.6] - 2025-08-07

## Features & Improvements

- Add hour and minute to previous games played

# [3.0.5] - 2025-07-03

## Features & Improvements

- Enhanced authentication flow with improved session validation and error handling.
- Updated navigation drawer to dynamically display items based on user authentication status.
- Improved route configuration to ensure proper layout rendering for authenticated and unauthenticated pages.
- Added support for dynamic path truncation in settings for better UI readability.

## Bug Fixes

- Fixed navigation issues in the settings and status pages when switching users or logging out.
- Resolved WebSocket reconnection issues in the status page.
- Addressed layout inconsistencies in the login and settings pages.

## Code Cleanup

- Refactored navigation components to improve maintainability and performance.
- Updated type definitions for better type safety across navigation-related components.
- Removed redundant imports and unused variables in multiple files.

> **Note:** The launcher now allows users to access the navigation drawer, login, status, wiki, join Discord, changelog, and about pages without logging in.

# [3.0.4] - 2025-06-30

## Features & Improvements

- Updated text colors in Queue and Server components to use MUI text color for better readability and customization through settings.

# [3.0.3] - 2025-06-30

## Features & Improvements

- Added "Followed Players" feature with a new page, navigation entry, and state management in EvosStore.
- Refactored update system: removed legacy Updater, added VersionUpdater and BranchUpdater components, and improved update and patch flows.
- Enhanced WebSocket/game status logic for efficient UI updates, robust reconnection, and notifications for followed players coming online.
- Improved UI/UX for TrustBar, Server, Queue, Logs, and Replays pages with better DataGrid usage.
- Updated translations for all supported languages to improve clarity and add new features.

## Bug Fixes

- Fixed translation for updateRestarting in all supported languages.
- Resolved issues with branch patching dialog and error handling.
- Fixed duplicate React keys in team/player lists.
- Addressed Updater dialog visibility issues in certain layouts.
- Ensured getVersion IPC handler consistently returns the app version.

## Code Cleanup

- Removed obsolete Updater code and cleaned up version handling in the main process.
- Added useDevStatus hook to sync developer status to the global store.

## Technical Enhancements

- Improved code maintainability and modularity for future development.

## [3.0.1] - 2025-06-29

-- **Test Release**: This is a test release for internal review and testing purposes. to see if our update system still works properly.

## [3.0.0] - 2025-06-29

### Major Refactoring & Code Organization

- **Main Process Architecture Restructure**
  - Split main process code into organized modules for better maintainability
  - **New Structure:**
    - `src/main/config/` - Configuration management
    - `src/main/handlers/` - IPC handlers (`ipcHandlers.ts`)
    - `src/main/services/` - Core services:
      - `discordService.ts` - Discord integration logic
      - `downloadService.ts` - Download management
      - `gameService.ts` - Game launch and management
      - `translationService.ts` - Localization services
    - `src/main/types/` - TypeScript type definitions
    - `src/main/utils/` - Utility functions (`fileUtils.ts`)
    - `src/main/windows/` - Window management (`windowManager.ts`)

- **Renderer Process Architecture Restructure**
  - Reorganized frontend code for better scalability and maintainability
  - **New Structure:**
    - `src/renderer/config/` - Application configuration (`routes.config.tsx`)
    - `src/renderer/hooks/` - Custom React hooks:
      - `useDiscordRPC.ts` - Discord Rich Presence integration
      - `useGameWebSocket.ts` - WebSocket game state management
    - `src/renderer/types/` - Frontend type definitions (`app.types.ts`)
    - `src/renderer/utils/` - Utility functions (`theme.utils.ts`)
    - `src/renderer/components/common/` - Shared/common components

- **Statistics System Unification**
  - **Complete Migration:** Removed duplicate stats components (`stats/` and `stats-v1/` directories)
  - **Unified Components:** Consolidated all statistics functionality into `stats-unified/` directory
  - **Components Unified:**
    - Character statistics charts and line graphs
    - Games played analytics (monthly, by character, by server)
    - Player statistics and win rates
    - Top games analytics (damage, healing, deaths, accolades, etc.)
    - Previous games played tracking
  - **New Utilities:** Added `helpers.ts` and improved API client hooks (`useApiClient.tsx`, `useStrapiClient.ts`)

### Documentation & Code Quality

- **Comprehensive JSDoc Documentation**
  - Added detailed JSDoc comments throughout the codebase
  - Enhanced function and component documentation with:
    - Parameter descriptions and types
    - Return value documentation
    - Usage examples where applicable
    - Clear descriptions of component purposes
  - **Files Enhanced:**
    - All custom React hooks (`useHasFocus.ts`, `useInterval.ts`, `useWindowDimensions.ts`)
    - Core library files (`Error.ts`, `Evos.ts`, `EvosStore.ts`, `Resources.ts`)
    - Component files across atlas, generic, and page components
    - Main process utilities and services

- **Type Safety Improvements**
  - Enhanced TypeScript type definitions
  - Better type safety across main and renderer processes
  - Improved error handling with proper type annotations

### New Features & Enhancements

- **Navbar Component Modularization**
  - Complete restructuring of navbar system with dedicated components:
    - `BranchSelector.tsx` - Dedicated branch selection interface
    - `GameLaunchButton.tsx` - Game launch/termination controls
    - `NavigationDrawer.tsx` - Main navigation menu with scrollable content
    - `UserAccountSelector.tsx` - Multi-user account management
    - `navigationConfig.ts` - Centralized navigation configuration
    - `useNavbar.ts` - Custom hook for navbar state management
  - Enhanced user experience with better component separation
  - Improved maintainability through modular architecture

- **Route Configuration System**
  - New centralized route configuration in `routes.config.tsx`
  - Support for different layout types (standard, auth, minimal)
  - Electron-specific route filtering for cross-platform compatibility
  - Improved page title management

- **Hook-Based Architecture**
  - **Discord RPC Integration (`useDiscordRPC.ts`)**
    - Real-time Discord status updates based on game state
    - Automatic activity tracking with game timers
    - Enhanced presence information with character and map details
  - **WebSocket Game State (`useGameWebSocket.ts`)**
    - Real-time game status updates via WebSocket
    - Automatic reconnection handling
    - Live player status and game information

- **Enhanced Utility Functions**
  - **File Utilities (`fileUtils.ts`)**
    - SHA1 checksum calculation for file integrity
    - File accessibility and permission checking
    - Steam VDF file parsing for game discovery
    - Cross-platform path handling
  - **Electron Integration (`electronUtils.ts`)**
    - Safe Electron API access with web fallbacks
    - Feature detection for cross-platform compatibility
    - Enhanced error handling for Electron-specific features
  - **Theme Management (`theme.utils.ts`)**
    - Comprehensive Material-UI theme configuration
    - Custom color palette support
    - Enhanced scrollbar styling and visual elements

- **Window Management**
  - Dedicated window manager (`windowManager.ts`) for Electron windows
  - Improved splash screen handling
  - Enhanced development tools integration

### Code Architecture Improvements

- **Separation of Concerns**
  - Clear separation between business logic and presentation layers
  - Service-oriented architecture in main process
  - Hook-based state management in renderer process

- **Maintainability Enhancements**
  - Reduced code duplication through unified components
  - Improved file organization and naming conventions
  - Better dependency management and imports

- **Performance Optimizations**
  - Streamlined component structure
  - Improved code splitting and module organization
  - Enhanced build configuration

### Development Experience

- **Better Developer Tools**
  - Enhanced test configuration (`App.test.tsx` updates)
  - Improved build tooling configuration
  - Better development workflow support

### Bug Fixes

- **Localization**: Fixed missing translation key for "Stats Version" in settings (`settings.statsVersion`)

### Note for Developers

This release represents a major internal restructuring and modernization of the codebase without breaking user-facing functionality. The changes improve:

- **Code Organization**: Complete modularization of complex components like the navbar system
- **Statistics Infrastructure**: Unified and extensible statistics system with API versioning
- **Type Safety**: Enhanced TypeScript coverage with comprehensive type definitions
- **Documentation**: Extensive JSDoc documentation for better developer experience
- **Cross-Platform Support**: Improved Electron integration with web fallbacks
- **State Management**: Hook-based architecture for better component reusability
- **Real-Time Features**: Enhanced WebSocket and Discord RPC integration
- **Development Workflow**: Better separation of concerns and modular architecture

All existing features remain fully functional while providing a significantly more maintainable and extensible foundation for future development. The new component architecture allows for easier testing, debugging, and feature development.

## [2.2.7] - Release Date 6/28/2025

### Improvements

- **Proxy**: Added a proxy server in Russia

## [2.2.6] - Release Date TBD

### Improvements

- **Player Banners**: Added custom titles to the player banners including some color codes that some players have

## [2.2.5] - Release Date TBD

### Important Changes

- **Stats Reset**: All stats have been reset

### Improvements

- **Stats System**
  - You can now see the new stats and the old stats. Select it by using the dropdown menu in Global Stats, Personal Stats, and Previous games
  - Persistence of the selected stats - if you select the old stats it will stay on the old stats until you change it back to the new stats or application restart

### Bug Fixes

- **Colors**: Fixed the default secondary color to be the same as the primary color on first (reset) start

## [2.2.4] - Release Date TBD

### Improvements

- **Customization**: You can change the colors of the launcher to your liking found in settings

## [2.2.3] - Release Date TBD

### Bug Fixes

- **Localization**: Add missing localization for draft

## [2.2.2] - Release Date TBD

### Improvements

- **Fourlancer Support**
  - Split status based on Type and Mode (e.g., `PvP - Deathmatch` or `PvP - Fourlancer`, etc.)
  - Add search functionality for Fourlancer in previous games
  - Display Mode in current games (e.g., `PvP - Deathmatch - 4 vs 4`)

## [2.2.1] - Release Date TBD

### Improvements

- **Advanced Game Search**: Enhanced functionality for searching previous games
  - **Team Win**: Select which team that won, or Any to ignore
  - **Turns**: Must be entered as a valid number (e.g., `15`)
  - **Score**: Must be formatted correctly (e.g., `4-3`)
  - **Game Server Process Code**: Requires a valid format, such as `"Tethys-3-41158c11-6692-c073"`. You can find these codes in the game info or in the footer of the Discord #game channel. All other search options are disabled when searching for process code

- **Original Branch**: When selecting the "Original" branch, a notification will pop up indicating that this option is unsupported. You may still play, but functionality within the launcher will be limited

- **Settings**: Moved Branch under select exe path and gave it "loading" effect when fetching branch data, to minimize UI change impact when fetching data

### Bug Fixes

- **Replays**: Resolved a minor issue where the option to open the folder was not displayed if you already had the replay file

## [2.2.0] - Release Date TBD

### New Features

- **Custom Banners**: If a player has a custom banner, the launcher will now display this

### Improvements

- **File Handling for Branches**
  - Improved file handling process by downloading files to a temporary `.download` file first
  - Added a backup step by creating a `.bak` copy of the original file
  - After successful download, the `.download` file is renamed to replace the original file

- **User Interface**
  - For users experiencing issues, the "Play" button has been changed to a "Cancel" button. Pressing "Cancel" will no longer trigger branch outdated checks; users must manually update by pressing the button in settings
  - If there is an error, branch will no longer update automatically, preventing the launcher from trying to update the branch repeatedly; Users must manually update the branch in settings

## [2.1.8] - Release Date TBD

### Improvements

- **Branches**
  - Added "Recommended" and "Disabled" labels to clarify which branches are recommended for use
  - Integrated branches into the menu, removing the MOTD (was this feature crucial?)
  - Introduced the "Stable" branch as our recommended option. This branch includes the latest titles but excludes experimental features

### Bug Fixes

- **Branches**
  - Resolved an issue where the launcher would repeatedly show a branch update popup if a file was locked by a process
  - The launcher now retries downloading the file upon failure, without displaying a popup. It also provides an explanation for the download failure and includes a delay before retrying

## [2.1.7] - Release Date TBD

### Improvements

- **Branches**: Branches now include version numbers, allowing you to view the latest version of each branch
- **Updater**: New versions are now required to play the game and use the launcher
- **Developer Tools**: Added `isDev` from the lobby server to determine if the logged in user is a developer or not
- **Stats Calls**: Added AbortController to the stats calls to cancel the fetch if the user navigates away from the page

### Bug Fixes

- **Updater**: Updates now display the correct percentage progress
- **Crash**: Fixed a rare crash occurring with `sendStatusToWindow`

### Backend

- **API Server**: Now features significantly faster response times

## [2.1.6] - Branches!

### New Features

- **Branch Management**
  - Introduced support for branches, allowing users to download specific branches of the game. This feature facilitates the release of new content and patches
  - The default branch is "Vanilla," representing the unmodified version of the game. Future branches will be added automatically without requiring a launcher update
  - Branches can include custom launch settings where applicable, such as enabling or disabling new features
  - When a branch is updated, the launcher will automatically download the update
  - Branches can be deleted by us. If a branch is removed, you will need to switch to another branch before you can play the game again
  - This feature also supports releasing new content like the Snowspire map, which replaces the previous patching option in the launcher
  - If a branch is outdated, the launcher will automatically switch and download the latest version
  - Example branches could include:
    - **Vanilla**: The default branch with no modifications
    - **Stable**: Stable branches with modifications
    - **Beta**: Unstable branches with modifications
    - **Custom**: Custom branches for testing and development
  - These are just examples; currently, only the **Vanilla** branch is available

### Bug Fixes

- **Support Us**: Updated the "Support Us" button for light mode

## [2.1.5] - Release Date TBD

### New Features

- **Support Us**: Added a "Support Us" dialog to the launcher, providing information on how you can support us
- **Collapsible Games**: Introduced a setting to collapse or expand games by default on the status page

### Improvements

- **Top 20 Stats**: Added the following stat to the Top 20 Stats page:
  - Players who have earned all 4 accolades in a game
- **Discord Integration**: Discord status is now only displayed when you are in-game. You can now idle in the launcher without your status being visible to others
- **Skeleton Loading**: Added skeleton loading (to improve the user experience while waiting for the data to load)
  - ALL Global Stats
  - All Personal Stats
  - Status Page

## [2.1.4] - Release Date TBD

### New Features

- **Top 20 Stats**: Added the following stats to the Top 20 Stats page:
  - Players who needed the most healing (per game on average) (min 50 games)
  - Players who collected the most powerups (per game on average) (min 50 games)
  - Players who got the most reduced damage from cover (per game on average) (min 50 games)
  - Players who got the most extra damage from might (per game on average) (min 50 games)
  - Players who got the most reduced damage from weaken (per game on average) (min 50 games)
  - Players who denied the most movement (per game on average) (min 50 games)
  - Players who sighted the most enemies (per game on average) (min 50 games)
  - Players who collected the most accolades

### Improvements

- **Skeleton Loading**: Added skeleton loading (to improve the user experience while waiting for the data to load)
  - Global Stats
    - Games Played Per Month
    - Games Played Per Character
  - Personal Stats
    - Player Banner
    - All Total Stats
    - ALL Possible Wins / Losses / Winrate
    - Games Played Per Month
    - Games Played Per Character

- **Games Played (by user)**: Now fetches games from last 5 years instead of 1 year. If the month has no data the month will not be shown
- **Wins and Losses**: Now fetches games from last 5 years instead of 1 year. If the month has no data the month will not be shown

## [2.1.3] - The Furrbal

### New Features

- **Isadora**: Added Isadora character support

## [2.1.2] - Release Date TBD

### New Features

- **Wiki**: Added a Wiki page to the launcher, where you can find information about the game, freelancers, and more

> **Note:** Wiki is not complete yet; more information will be added as development continues. Wiki updates do not require launcher updates.

## [2.1.1] - Release Date TBD

### Improvements

- **Mentor System**
  - Updated to match new in-game mentor icon
  - Icon moved next to player name
  - Special effect changed to orange (matching icon color)
  - Status titles updated: `Mentor` (offline), `Mentor/Online`, `Mentor/In Game`

### Bug Fixes

- **Launcher Updates**: Rounded percentage text display
- **Username Display**: Dynamic font sizing for long usernames in player display boxes

## [2.1.0] - Such thing as too much stats?

### New Features

- **Advanced Game Statistics**
  - Total Healing Received
  - Total Player Absorb
  - Powerups Collected
  - Damage Reduced by Cover
  - Extra Damage from Might
  - Reduced Damage from Weaken
  - Movement Denied
  - Enemies Sighted
  - Catalyst usage tracking (Prep, Dash, Combat)

- **Ability History System**
  - Ability name with hover descriptions (values shown without mods)
  - Action type (ability button placement)
  - Cast count statistics
  - Total absorb, damage, and energy metrics
  - Target hit and taunt counts

### Improvements

- **Visual Design**: Adjusted win/lose colors to be lighter for better visibility
- **Accolades**: Now consistent between game and launcher display

### Bug Fixes

- **Localization**: Fixed missing Oz character localization from Evos Server Stats API

> **Note:** More statistics features coming soon, including additional top 20 stats!

## [2.0.11] - Release Date TBD

### New Features

- **Lex Character**: Added Lex character support and translations

### Improvements

- **Performance**: Optimized personal stats to render character stats only when clicked

## [2.0.10] - Release Date TBD

### Improvements

- **Mentors**: Added special visual effects for Mentors

### Bug Fixes

- **GitHub Integration**: Fixed Markdown formatting for GitHub messages

## [2.0.9] - Release Date TBD

### Improvements

- **Real-time Status**: Now uses WebSocket for in-game status updates (no more 20-second delays)

### Bug Fixes

- **Character Stats**: Fixed tooltip cropping on far-right datasets
- **Localization**: Fixed typo in healing done statistics

## [2.0.8] - Release Date TBD

### Improvements

- **Enhanced Character Statistics**: Added last 20 games averages for:
  - Damage done (overall and personal)
  - Healing done (overall and personal)
  - Damage received (overall and personal)

## [2.0.7] - Release Date TBD

### New Features

- **Game Information**: Game type and unique player count now displayed next to each game

### Improvements

- **Player Management**: Players automatically return to player list when games end

## [2.0.6] - Release Date TBD

### New Features

- **Enhanced Personal Stats**: Detailed performance graphs for last 20 PvP games
  - Metrics: damage, healing, damage taken, deaths per game
  - Role-based default views: Firepowers (damage), Support (healing), Frontliners (damage taken)
  - Interactive legend with show/hide functionality

### Bug Fixes

- **Updater**: Fixed restart button not appearing after delayed translation requests

## [2.0.5] - Release Date TBD

### Bug Fixes

- **Replays**: Fixed Magnus abilities not showing in replay popup
- **Privacy**: Win rate now only visible for own account

## [2.0.4] - The Dino Update

### New Features

- **Magnus**: Added Magnus character support

## [2.0.3] - The Discord Status Update

### New Features

- **Discord Rich Presence**: Shows launcher/in-game status in Discord
  - Launcher idle status
  - In-game status with username
  - Game details: character, map, current score, and time
  - Enable/disable option in settings

## [2.0.2] - Just a Chill Update

### New Features

- **Vonn**: Added Vonn character support

### Bug Fixes

- **Authentication**: Fixed rare logout issue during password changes

## [2.0.1] - Release Date TBD

### New Features

- **Play Button**: Restored play button to launcher top (disabled when game path not set)

### Improvements

- **Game Download**: No longer requires Discord role verification (uses linked account status)
- **Performance**: Special effects data now cached (1-minute duration)

### Bug Fixes

- **Error Handling**: Play button shows error message when game launch fails

## [2.0.0] - This should have been 2.0.1!

### New Features

- **Top 20 Integration**: Visual indicators when appearing in any top 20 statistic
- **Alternative Discord Linking**: "Link With Code" option for users unable to use standard OAuth
  - Get code via `/link` command in Discord
  - Prevents linking if Discord account already associated
- **Status Legend**: Shows all possible effects (MVP, Tournament Winner, Nitro Booster, Developer) - collapsed by default

## [1.9.9] - Discord Update

### Important Changes

- **BREAKING**: Stats require launcher version 1.9.9 or higher
- **Discord Linking Required**: Now mandatory for viewing stats, previous games, and special status

### New Features

- **Discord OAuth Integration**: Official Discord API authentication
  - Minimal data collection (Discord ID and username only)
  - Server membership verification
  - 26-day grace period before removing old effects

### Security

- Special effects now database-driven
- Automatic MVP status (TOP5 in any stat) - coming soon

## [1.9.8] - The Bots Update

### New Features

- **Bot Support**: Added bot player support in launcher and replays

### Improvements

- **Statistics Overhaul**:
  - Updated damage/healing/damage taken calculations to account for death frequency
  - Replaced Tournament page with search filters (PvP, Coop, Custom, Tournament)
  - Removed global stats text ratios for some statistics

### Bug Fixes

- **Bot Integration**: Bot players no longer clickable for profile viewing
- **Replay Compatibility**: Fixed replay system for bot players

### Personal

- Developer name change: BabyMillie → BabyAddalyn

## [1.9.7] - Release Date TBD

### New Features

- **Global Statistics** (minimum 200 games required):
  - Most kills on average
  - Least/Most deaths on average
  - Most deathblows on average
  - Most damage done on average
  - Most healing done on average
  - Most damage taken on average
- **Special Effects**: Added rainbow effect for special users

## [1.9.6] - Release Date TBD

### New Features

- **Freelancer Statistics**: Win/loss/winrate for individual freelancers (per map or all maps)
- **Navigation**: Added navbar to previous games page

### Bug Fixes

- **User Interface**: Fixed user switcher outline color for special status users

## [1.9.5] - Release Date TBD

### New Features

- **Tournament Games**: Added tournament-only games page
- **Special Borders**: Added special borders for:
  - Tournament Winners
  - MVP players
  - Developers
  - Nitro Boosters

## [1.9.4] - Release Date TBD

### New Features

- **Play Button**: Restored to launcher top
- **Annual Stats**: Added "(for the year)" labels with translations

### Improvements

- **Map Organization**: Reordered maps (Cloudspire Christmas moved to end)

### Bug Fixes

- **UI Polish**: Empty notification box no longer appears

## [1.9.3] - Release Date TBD

### New Features

- **Admin Messaging**:
  - Game dodge detection and warnings (7-day tracking)
  - Emergency application reset (Ctrl+F2)
  - Turkish language support

### Improvements

- **UI Redesign**: Custom titlebar, repositioned elements, draggable splash screen
- **Language Support**: English fallback for MOTD and notifications

### Bug Fixes

- **Build Process**: Removed npm install --force requirement

## [1.9.2] - Release Date TBD

### New Features

- **Account Security**:
  - Account ban detection with reason and duration display
  - Admin message system for warnings
  - Periodic update checking (no restart required)
- **User Management**: Redesigned user switcher using Player object with custom titles

### Important Changes

- **Login Requirement**: All users must re-login for feature access and validation

### Bug Fixes

- **UI Improvements**: Fixed status page whitespace and MOTD/notification spacing

## [1.9.1] - Release Date TBD

### New Features

- **Replay Enhancement**: Ability icons with mod information on hover
- **Visual Improvements**: Enhanced splash screen design
- **Update Notifications**: Added alerts when updating and restarting

### Bug Fixes

- **Localization**: Various translation improvements

## [1.9.0] - Release Date TBD

### New Features

- **Replay System**:
  - Server-based replay file opening and downloading
  - Copy-to-clipboard replay commands
  - In-launcher game launching from replay view
- **Language Support**: Added Simplified Chinese (ZH)

### Bug Fixes

- **Replay Display**: Fixed multiple user catalyst display issues

## [1.8.9] - The Replays Fix 2

### Bug Fixes

- **Player Matching**: Fixed issue where players didn't match between replay files and game data
- **API Integration**: Added GameServerProcessCode search for improved stat retrieval

## [1.8.7-1.8.8] - The Replays Fix

### Bug Fixes

- **Database Integration**: Fixed white page crashes when game not found in database
- **Timezone Handling**: Implemented workaround for server/client timezone discrepancies

### Technical Debt

- TODO: Add GameServerProcessCode to Discord embeds for better stat correlation

## [1.8.6] - The Replays

### New Features

- **Replay Management**: Added comprehensive replay page
  - Local replay file browser with game statistics
  - Discord sharing integration with screenshots
  - Bug reporting and sharing capabilities

### Improvements

- **Menu Organization**: Reordered menu items
- **Game Launch**: Removed patch file requirements

### Bug Fixes

- **Window Controls**: Restored Ctrl+W closing and Alt menu access
- **Code Quality**: Fixed lint errors and added translations

## [1.8.5] - Release Date TBD

### Improvements

- **Server Infrastructure**:
  - New proxy servers: fi.evos.live, de.evos.live, fr.evos.live
  - Domain migration: addalyn.baby → evos.live
  - Updated Discord links to https://evos.live/discord

### Removed

- **Christmas Features**: Disabled patching function (Christmas map disabled)

## [1.8.4] - Release Date TBD

### New Features

- **Analytics**: Added launcher usage statistics
- **Localization**: Working MOTD and notification translations

### Bug Fixes

- **Translation Issues**: Fixed various translation problems

## [1.8.3] - Release Date TBD

### New Features

- **Update Management**: Restored update button functionality

## [1.8.2] - Release Date TBD

### Bug Fixs

- **Localization**: Fixed translation errors
- **Game Integration**: Fixed black box ability previews in game

## [1.8.1] - Italiano and Brazilian Portuguese

### New Features

- **Language Support**: Complete Italian and Brazilian Portuguese translations
- **Visual Improvements**: Added flag icons for language selection

## [1.8.0] - The Translation Update

### New Features

- **Multi-language Support**: Complete translations for Dutch, German, Spanish, French, and Russian
- **Language Settings**: In-launcher language switching capability
- **Community Contribution**: Translation contribution system for additional languages

## [1.7.1] - Release Date TBD

### Bug Fixes

- **Patch Management**: Fixed infinite patch download loop

## [1.7.0] - Release Date TBD

### New Features

- **Installation Management**: Automatic AtlasReactor folder creation during download
- **Error Handling**: Download retry system (3 attempts before failure)

### Updates

- **Dependencies**: Updated React, Electron, and other core packages

## [1.6.5] - Release Date TBD

### Bug Fixes

- **Asset Management**: Fixed missing banners (Zheneq)

## [1.6.4] - The Path Update

### New Features

- **Installation Validation**: Program Files installation warnings (except Steam folders)
- **Path Guidance**: Added installation path validation and guidance

### Bug Fixes

- **Documentation**: Fixed changelog typos

## [1.6.3] - The Logs

### New Features

- **Log Management System**:
  - Game log viewer with color coding and formatting
  - Log file and directory access
  - Chronological ordering with time-based color coding
  - Launch prevention for problematic installations:
    - OneDrive folder installations (corrupts game)
    - Missing game files
    - Incorrect installation paths

### Examples

- **Correct paths**: `C:\Program Files (x86)\Steam\steamapps\common\Atlas Reactor\Games\Atlas Reactor\Live\Win64\AtlasReactor.exe`
- **Incorrect paths**: `C:\Users\<user>\OneDrive\Documents\Atlas Reactor\Win64\AtlasReactor.exe`

## [1.6.2] - The Stats Fix

### New Features

- **Historical Data**: Restored previous year statistics

### Improvements

- **User Interface**: Updated login page with IP change instructions

## [1.6.1] - The Stats Update

### New Features

- **Win Rate Statistics**: Restored win rate display
- **Offline Mode**: Added Atlas Reactor offline functionality warnings

### Security

- **Authentication**: Forced re-login for unauthorized stats access

## [1.6.0] - The Stats Update

### New Features

- **Enhanced Player Statistics**: Detailed per-freelancer and per-map statistics
- **Map Integration**: Consolidated map interface replacing separate stat pages

## [1.5.5] - Release Date TBD

### Improvements

- **Infrastructure**: Added new proxy server (Finland location)

## [1.5.4] - The Trustwar Update

### New Features

- **Trust War Integration**: Main page Trust War display with player trust affiliation icons

### Improvements

- **API Optimization**: Temporary MOTD/notification migration to reduce API failures
- **UI Polish**: Removed player greyout effects

## [1.5.3] - Release Date TBD

### Bug Fixes

- **Window Management**: Fixed false positive launcher close warnings when game not running

## [1.5.2] - Bugfixes

### New Features

- **Safety Features**: Launcher close confirmation when game running
- **User Experience**: Main page notification focus to reduce clutter

### Improvements

- **Download Stability**: Enhanced download process reliability

## [1.5.1] - Fur-real

### New Features

- **Nev Character**: Added Nev:3 character support

## [1.5.0] - The Bugfix Update

### New Features

- **Game Launch Validation**:
  - Christmas map file checking before launch
  - Launch prevention during patching
  - Discord integration

### Bug Fixes

- **Configuration**: Fixed all chat enabling for new configurations
- **Anti-spam**: Prevented spam launching during patching

## [1.4.6] - The Christmas Update - Disable Launching Game

### Security

- **Launch Requirements**: Christmas map installation required for game launch

## [1.4.5] - The Christmas Update - Map Stats

### New Features

- **Map Statistics**: Christmas map integration in statistics

## [1.4.4] - The Christmas Update - v3

### New Features

- **Configuration Options**: Auto-patching disable option for troubleshooting

### Bug Fixes

- **Settings**: Fixed all chat setting configuration

## [1.4.3] - The Christmas Update - Fixed v2

### Improvements

- **Download System**: Enhanced file download mechanism for game and patches

## [1.4.2] - The Christmas Update - Fixed

### New Features

- **Auto-Patcher System**:
  - Automatic patch file management with Christmas map support
  - Future extensibility for additional patches

### Improvements

- **Communication**:
  - Backup notification system
  - Launcher enhancement framework

### Bug Fixes

- **Chat System**: All chat functionality improvements

## [1.4.1] - The Christmas Update

### New Features

- **Auto-Patcher System**:
  - Automatic patch downloads for Christmas map
  - Future extensibility for additional content

### Improvements

- **Infrastructure**:
  - Backup MOTD and notification systems
  - Future launcher enhancement framework

### Bug Fixes

- **Chat System**: All chat functionality improvements

## [1.4.0] - The Improvements

### New Features

- **Account Management**: In-launcher password reset functionality
- **Performance**: 2x faster game download speeds
- **Update System**: "Update & Launch" button for seamless updates (Steam Deck friendly)
- **Communication**: Message of the Day (MOTD) and important notification systems

## [1.3.9] - The Exe Search

### New Features

- **Game Discovery**: Automatic Steam installation detection with auto-path setting

### Bug Fixes

- **Chat System**: Comprehensive all chat functionality fix

## [1.3.8] - The Fix

### Bug Fixes

- **Compatibility**: Fixed issues from version 1.3.7

## [1.3.7] - Release Date TBD

### New Features

- **Default Configuration**: All chat automatically enabled (disable only via launcher settings)

## [1.3.6] - Release Date TBD

### New Features

- **Character Support**: Added Meridian character statistics

## [1.3.5] - Release Date TBD

### New Features

- **Multi-Server Support**: Second proxy server with dropdown selection (main, proxy1, proxy2)
- **Enhanced Statistics**: Most played game server in global stats, game type and server info in previous games
- **Integration**: Map links with Discord game info

### Improvements

- **Performance**: Download process no longer freezes launcher

### Removed

- **Manual Configuration**: Automated port configuration (previously manual)

## [1.3.4] - Release Date TBD

### Improvements

- **Character Organization**: Reordered characters with role-based color coding

## [1.3.3] - Release Date TBD

### New Features

- **Enhanced Statistics**: Win/Loss/Winrate tracking with per-map monthly statistics graphs

## [1.3.2] - Release Date TBD

### New Features

- **Statistics**: Additional statistics features

## [1.3.1] - Release Date TBD

### Bug Fixes

- **Calculations**: Fixed MVP, Damage, Healing, Tank calculation accuracy
- **Typography**: Corrected various typos

## [1.3.0] - Release Date TBD

### New Features

- **Statistics System**: Global statistics, Personal/Player statistics, Previous match history

## [1.2.7] - Release Date TBD

### Bug Fixes

- **Asset Management**: Fixed splash screen format (PNG instead of WebP)

## [1.2.6] - Release Date TBD

### New Features

- **Loading Experience**: Added splash screen during application loading

### Improvements

- **Authentication**: Reduced unnecessary re-login prompts

## [1.2.5] - Release Date TBD

### New Features

- **Experimental Features**: Optional proxy support for connectivity troubleshooting

## [1.2.4] - Release Date TBD

### New Features

- **Username Support**: Capital letter compatibility with legacy config migration

### Bug Fixes

- **Account Management**: Fixed dropdown "Add Account" functionality and account deletion processes

## [1.2.3] - Release Date TBD

### New Features

- **Launch Options**: Optional `-nolog` parameter (disabled by default)

### Reverted

- **Configuration**: Removed automatic `-nolog` addition

## [1.2.2] - Release Date TBD

### Bug Fixes

- **Error Handling**: General error handling improvements

## [1.2.1] - Release Date TBD

### New Features

- **Account Registration**: Form validation and unique code requirement system
- **Beta Access**: Discord-based beta access through #beta-access channel
- **Multi-instance Support**: `-nolog` parameter for crash prevention

## [1.2.0] - Release Date TBD

### New Features

- **Game Distribution**: Discord role-based game downloading system
- **Update Notifications**: In-launcher update availability display

### Security

- **Access Control**: Discord role verification for downloads

### Bug Fixes

- **Authentication**: Fixed login persistence when already authenticated

## [1.1.3] - Release Date TBD

### New Features

- **Process Management**: Per-user game termination capability

### Improvements

- **Error Handling**: Enhanced server offline error messaging

## [1.1.2] - Release Date TBD

### New Features

- **Documentation System**: About and Changelog pages with GitHub integration
- **Asset Management**: Character placeholder image for map/layout selection
- **User Guidance**: IP field validation (no ports or protocols allowed)

### Technical

- **File Organization**: Standardized page naming convention to (Page)Page.tsx

## [1.1.1] - Release Date TBD

### New Features

- **Account Registration**: User account creation with dedicated pages

### Security

- **Authentication**: Login validation via ticket system

### Cleanup

- **Code Quality**: Removed unused store items

## [1.1.0] - Release Date TBD

### New Features

- **Ticket Authentication**: Eliminated manual JSON file creation requirement
- **Configuration Management**: Persistent settings across sessions with multi-user support

## [1.0.4] - Release Date TBD

### New Features

- **Multi-User Support**: Per-user configuration management, user switching, and quick user selection

### Technical

- **Dependencies**: Removed react-auth-kit dependency in favor of custom implementation
- **Testing**: Restored npm test functionality

## [1.0.3] - Release Date TBD

### New Features

- **Authentication Foundation**: Experimental ticketing system (non-functional)

## [1.0.2] - Release Date TBD

### Bug Fixes

- **Installation**: Fixed installer functionality

## [1.0.1] - Release Date TBD

### Removed

- **Launch Arguments**: Disabled pending ticket implementation

## [1.0.0] - Initial Release

### New Features

- **Core Functionality**: Initial launcher with basic game launching capability and user interface

---

## Contributing to the Changelog

When adding new entries:

1. **Add entries at the top** under a new version section
2. **Use consistent formatting**:
   - `### New Features` for new functionality
   - `### Improvements` for enhancements to existing features
   - `### Bug Fixes` for bug fixes
   - `### Security` for security-related changes
   - `### Removed` for removed features
   - `### Technical` for technical/internal changes

3. **Keep entries concise but descriptive**
4. **Group related changes** under logical subsections when appropriate
5. **Use consistent language** and maintain professional tone
6. **Reference issues/PRs** when applicable using standard notation

### Version Numbering

- Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- Use `[X.X.X] - YYYY-MM-DD` format for released versions
- Use `[X.X.X] - TBD` for unreleased versions
- Add descriptive subtitles for major releases when appropriate
