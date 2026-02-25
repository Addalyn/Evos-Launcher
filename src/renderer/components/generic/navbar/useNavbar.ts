/**
 * @fileoverview Custom hooks for Navbar functionality
 * Contains business logic and state management for the navbar component.
 *
 * @author Evos Launcher Team
 * @version 2.2.6
   @since 2.2.6
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getBranches,
  getSpecialNames,
  getTicket,
  logout,
  getPlayerData,
} from 'renderer/lib/Evos';
import type { Branches, PlayerData } from 'renderer/lib/Evos';
import { isValidExePath } from 'renderer/lib/Error';
import { trackEvent } from '@aptabase/electron/renderer';
import EvosStore from 'renderer/lib/EvosStore';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import createNavigationPages from './navigationConfig';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Custom hook for navbar functionality and state management
 * @returns {object} Navbar state and handlers
 */
export default function useNavbar() {
  const evosStore = EvosStore();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowDimensions();

  // Local state
  const [isDev, setIsDev] = useState<boolean>(false);
  const [branchesData, setBranchesData] = useState<Branches>();
  const [error, setError] = useState();
  const [isPatching] = useState<boolean>(false);
  const [account] = useState<{ locked?: boolean } | undefined>();
  const [playerInfoMap, setPlayerInfoMap] = useState<{
    [key: string]: PlayerData;
  }>({});
  const [supportUs, setSupportUs] = useState<boolean>(false);
  const [activeGames, setActiveGames] = useState<{
    [username: string]: boolean;
  }>({});

  // Fetch branches data on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches();
        setBranchesData(response.data);
      } catch (err) {
        // Silently handle branch fetch error
      }
    };

    fetchBranches();
  }, []);

  // Destructured store values
  const {
    exePath,
    ticketEnabled,
    updateAuthenticatedUsers,
    activeUser,
    switchUser,
    authenticatedUsers,
    isDownloading,
    noLogEnabled,
    needPatching,
    branch,
    locked,
    setLocked,
    setBranch,
    setOldBranch,
    oldBranch,
    setNoBranchDownload,
  } = evosStore;

  // Check developer status when active user changes
  useEffect(() => {
    const checkDeveloperStatus = async () => {
      if (!activeUser?.handle) {
        setIsDev(false);
        return;
      }

      try {
        const specialNames = await getSpecialNames();
        const isUserDeveloper =
          specialNames?.Developers?.includes(activeUser.handle) || false;
        setIsDev(isUserDeveloper);
      } catch (err) {
        // Silently handle developer status check error
        setIsDev(false);
      }
    };

    checkDeveloperStatus();
  }, [activeUser?.handle]);

  // Fetch player data for authenticated users
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!activeUser?.token || authenticatedUsers.length === 0) {
        setPlayerInfoMap({});
        return;
      }

      try {
        const playerDataPromises = authenticatedUsers.map(async (user) => {
          try {
            const response = await getPlayerData(activeUser.token, user.handle);
            return { handle: user.handle, data: response.data };
          } catch (fetchError) {
            // If fetching fails for a user, return null to filter it out
            return null;
          }
        });

        const playerDataResults = await Promise.all(playerDataPromises);

        // Filter out null results and create the map
        const newPlayerInfoMap: { [key: string]: PlayerData } = {};
        playerDataResults.forEach((result) => {
          if (result && result.data) {
            newPlayerInfoMap[result.handle] = result.data;
          }
        });

        setPlayerInfoMap(newPlayerInfoMap);
      } catch (generalError) {
        // If there's a general error, reset the map
        setPlayerInfoMap({});
      }
    };

    fetchPlayerData();
  }, [activeUser?.token, authenticatedUsers]);

  // Listen for game state changes from main process
  useEffect(() => {
    const handleActiveGameChange = (...args: unknown[]) => {
      const [username, isActive] = args as [string, boolean];

      setActiveGames((prev) => {
        const newState = { ...prev };
        if (isActive) {
          newState[username] = true;
        } else {
          // Remove the game from active games when it's not active
          delete newState[username];
        }
        return newState;
      });
    };

    // Listen for setActiveGame IPC messages
    const removeListener = withElectron(
      (electron) =>
        electron.ipcRenderer.on('setActiveGame', handleActiveGameChange),
      null,
    );

    return () => {
      removeListener?.();
    };
  }, []);

  // Memoized values
  const pages = createNavigationPages(t, isDev);
  const drawerWidth = width !== null && width < 916 ? 60 : 240;

  // Handlers
  const handleChangeBranch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNoBranchDownload(false);
      const selectedValue = event.target.value;
      trackEvent('Branch', { branch: selectedValue });
      setOldBranch(branch);
      setBranch(selectedValue);
      setLocked(true);
      if (branchesData) {
        withElectron((electron) => {
          electron.ipcRenderer.updateBranch(branchesData[selectedValue]);
        });
      }
    },
    [
      branchesData,
      branch,
      setBranch,
      setOldBranch,
      setLocked,
      setNoBranchDownload,
    ],
  );

  const handleDirectBranchChange = useCallback(
    (branchName: string) => {
      setNoBranchDownload(false);
      trackEvent('Branch', { branch: branchName });
      setOldBranch(branch);
      setBranch(branchName);
      setLocked(true);
      if (branchesData) {
        withElectron((electron) => {
          electron.ipcRenderer.updateBranch(branchesData[branchName]);
        });
      }
    },
    [
      branchesData,
      branch,
      setBranch,
      setOldBranch,
      setLocked,
      setNoBranchDownload,
    ],
  );

  const handleLogOut = useCallback(() => {
    logout(activeUser?.token ?? '');
    updateAuthenticatedUsers(
      activeUser?.user as string,
      '',
      activeUser?.handle as string,
      activeUser?.banner as number,
      activeUser?.configFile as string,
    );
    navigate('/login');
  }, [activeUser, updateAuthenticatedUsers, navigate]);

  const doNavigate = useCallback(
    (href: string) => {
      trackEvent('Page', { page: `${activeUser?.user}: ${href}` });
      if (href === '#support') {
        setSupportUs(true);
        return;
      }
      navigate(href);
    },
    [activeUser, navigate],
  );

  const handleAddUser = useCallback(() => {
    navigate('/add-account');
  }, [navigate]);

  const isAuthenticated = useCallback(() => {
    return (
      activeUser !== null &&
      Object.keys(activeUser).length !== 0 &&
      activeUser.token !== ''
    );
  }, [activeUser]);

  // Handler for switching users
  const handleSwitchUser = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const user = event.currentTarget.innerText.split('#')[0];
      switchUser(user);
      navigate('/');
    },
    [switchUser, navigate],
  );

  // Handler for launching or killing the game
  const handleLaunchGameClick = useCallback(() => {
    if (!exePath.endsWith('AtlasReactor.exe') || !activeUser) return;

    const userName = activeUser.user;
    const isGameActive = activeGames[userName];

    if (isGameActive) {
      // Game is running, so ask for confirmation to kill it
      // Don't change state immediately - let the IPC handler manage state based on user choice
      withElectron((electron) => {
        electron.ipcRenderer.sendMessage('close-game', userName);
      });
    } else {
      // Game is not running, so launch it
      // Immediately set game as active when launching
      setActiveGames((prev) => ({ ...prev, [userName]: true }));

      if (ticketEnabled === 'true') {
        // Use ticket-based authentication
        getTicket(activeUser.token)
          .then((resp) => {
            withElectron((electron) => {
              electron.ipcRenderer.sendMessage('launch-game', {
                launchOptions: {
                  exePath,
                  ip: evosStore.ip,
                  port: evosStore.gamePort,
                  ticket: resp.data,
                  name: userName,
                  noLogEnabled,
                },
              });
            });
            return resp;
          })
          .catch((err) => {
            // If launch fails, reset the active state
            setActiveGames((prev) => ({ ...prev, [userName]: false }));
            setError(err);
          });
      } else {
        // Use config file authentication
        withElectron((electron) => {
          electron.ipcRenderer.sendMessage('launch-game', {
            launchOptions: {
              exePath,
              ip: evosStore.ip,
              port: evosStore.gamePort,
              config: activeUser.configFile,
              name: userName,
              noLogEnabled,
            },
          });
        });
      }
    }
  }, [
    exePath,
    activeUser,
    ticketEnabled,
    noLogEnabled,
    setError,
    evosStore,
    activeGames,
  ]);

  // Handler for canceling download
  const handleCancelDownloadBranch = useCallback(() => {
    withElectron((electron) => {
      electron.ipcRenderer.cancelDownloadBranch();
    });
  }, []);

  // Computed values
  const tooltipTitle = (() => {
    if (exePath.endsWith('AtlasReactor.exe')) {
      if (activeGames[activeUser?.user as string]) {
        return `${t('game.kill')} ${activeUser?.handle}`;
      }
      return `${t('game.play')} ${activeUser?.handle}`;
    }
    return t('errors.errorExe');
  })();

  return {
    // State
    isDev,
    branchesData,
    error,
    setError,
    isPatching,
    account,
    playerInfoMap,
    supportUs,
    setSupportUs,
    activeGames,
    location,
    pages,
    drawerWidth,
    tooltipTitle,
    // Store values
    exePath,
    ticketEnabled,
    activeUser,
    authenticatedUsers,
    isDownloading,
    noLogEnabled,
    needPatching,
    branch,
    locked,
    oldBranch,
    // Handlers
    handleChangeBranch,
    handleDirectBranchChange,
    handleLogOut,
    doNavigate,
    handleAddUser,
    isAuthenticated,
    handleSwitchUser,
    handleLaunchGameClick,
    handleCancelDownloadBranch,
    // Computed
    isValidExe: isValidExePath(exePath),
  };
}
