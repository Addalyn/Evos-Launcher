/**
 * @fileoverview Discord Rich Presence integration hooks and utilities
 * Manages Discord RPC status updates based on game state
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { useEffect } from 'react';
import { Status } from '../lib/Evos';
import { convertToRealName } from '../lib/Resources';
import { DiscordStatus } from '../types/app.types';
import { withElectron } from '../utils/electronUtils';

/**
 * Hook for managing Discord Rich Presence integration
 * Updates Discord status based on current game state and user activity
 * @param {object} params - Hook parameters
 * @param {any} params.evosStore - The Evos store instance
 * @param {Status | undefined} params.globalStatus - Current global game status
 * @param {Date | undefined} params.gameTimer - Game start timer
 * @param {(timer: Date | undefined) => void} params.setGameTimer - Function to update game timer
 * @param {(key: string, options?: any) => string} params.t - Translation function
 */
export default function useDiscordRPC({
  evosStore,
  globalStatus,
  gameTimer,
  setGameTimer,
  t,
}: {
  evosStore: any;
  globalStatus: Status | undefined;
  gameTimer: Date | undefined;
  setGameTimer: (timer: Date | undefined) => void;
  t: (key: string, options?: any) => string;
}): void {
  useEffect(() => {
    if (evosStore.enableDiscordRPC !== 'true') {
      return;
    }

    const status: Status | undefined = globalStatus;
    if (!status) {
      return;
    }

    const myUser = status.players.find(
      (player) => player.handle === evosStore.activeUser?.handle,
    );

    if (!myUser) {
      withElectron((electron) => {
        electron.ipcRenderer.stopDiscord();
      });
      return;
    }

    let map = null as Status['games'][0] | null;
    let currentTeam = '';
    let currentCharacter = '';

    // Update game timer when entering/leaving game
    if (myUser.status === 'In Game') {
      if (gameTimer === undefined) {
        setGameTimer(new Date());
      }
    } else {
      setGameTimer(undefined);
    }

    // Find current game and team information
    status.games.forEach((game) => {
      const teamA = game.teamA.find(
        (player) => player.accountId === myUser.accountId,
      );
      const teamB = game.teamB.find(
        (player) => player.accountId === myUser.accountId,
      );

      if (teamA || teamB) {
        map = game;
        currentTeam = teamA ? 'Team A' : 'Team B';
        currentCharacter = teamA
          ? teamA.characterType
          : teamB?.characterType || '';
      }
    });

    const discordStatus: DiscordStatus = {
      details: `Playing as ${myUser.handle}`,
      state: `${myUser.status} ${
        map !== null && myUser.status === 'In Game'
          ? `as ${t(convertToRealName(currentCharacter.toLowerCase()) as string, { lng: 'en' })} (${map.teamAScore} - ${map.teamBScore})`
          : ''
      }`,
      buttons: [
        {
          label: 'Start playing!',
          url: 'https://evos.live/discord',
        },
      ],
      startTimestamp:
        myUser.status === 'In Game' ? gameTimer || new Date() : undefined,
      smallImageKey:
        map !== null && myUser.status === 'In Game'
          ? map.map.toLowerCase()
          : 'logo',
      smallImageText:
        map !== null && myUser.status === 'In Game'
          ? `Playing on ${t(`maps.${map.map}`, { lng: 'en' })} as ${t(
              convertToRealName(currentCharacter.toLowerCase()) as string,
              { lng: 'en' },
            )} in ${currentTeam}`
          : '',
      largeImageKey:
        map !== null && myUser.status === 'In Game'
          ? currentCharacter.toLowerCase()
          : '',
      largeImageText:
        map !== null && myUser.status === 'In Game'
          ? `${t(convertToRealName(currentCharacter.toLowerCase()) as string, {
              lng: 'en',
            })}`
          : '',
    };

    withElectron((electron) => {
      electron.ipcRenderer.sendDiscordStatus(discordStatus);
    });
  }, [
    evosStore.activeUser,
    evosStore.enableDiscordRPC,
    gameTimer,
    globalStatus,
    t,
    setGameTimer,
  ]);
}
