/* eslint-disable no-alert */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Paper, TextField, Typography } from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import html2canvas from 'html2canvas';
import { useTranslation, Trans } from 'react-i18next';
import { PlayerData, getTicket } from 'renderer/lib/Evos';
import { strapiClient } from 'renderer/lib/strapi';
import { withElectron } from 'renderer/utils/electronUtils';
// eslint-disable-next-line import/no-cycle
import { Games } from '../stats-unified/PreviousGamesPlayed';

/**
 * Represents a character taunt configuration
 */
interface CharacterTaunt {
  /** Unique identifier for the taunt */
  id: number;
  /** Name or type of the taunt */
  name: string;
  /** Whether the taunt is unlocked */
  unlocked: boolean;
  /** Additional taunt metadata */
  [key: string]: unknown;
}

/**
 * Represents a character loadout configuration
 */
interface CharacterLoadout {
  /** Unique identifier for the loadout */
  id: number;
  /** Name of the loadout */
  name: string;
  /** Loadout configuration data */
  config: Record<string, unknown>;
  /** Additional loadout metadata */
  [key: string]: unknown;
}

/**
 * Represents ability game summary statistics for a specific ability
 */
/**
 * Represents ability game summary statistics for a specific ability
 */
type AbilityGameSummaryList = {
  /** Name of the ability class */
  AbilityClassName: string;
  /** Display name of the ability */
  AbilityName: string;
  /** Type of action performed */
  ActionType: number;
  /** Number of times the ability was cast */
  CastCount: number;
  /** Name of the mod applied to the ability */
  ModName: string;
  /** Number of times taunts were used */
  TauntCount: number;
  /** Total amount of damage absorbed */
  TotalAbsorb: number;
  /** Total damage dealt by the ability */
  TotalDamage: number;
  /** Total energy gained for self */
  TotalEnergyGainOnSelf: number;
  /** Total energy gained for other players */
  TotalEnergyGainToOthers: number;
  /** Total energy lost by other players */
  TotalEnergyLossToOthers: number;
  /** Total healing provided */
  TotalHealing: number;
  /** Total potential damage that could have been absorbed */
  TotalPotentialAbsorb: number;
  /** Total number of targets hit */
  TotalTargetsHit: number;
};

/**
 * Represents a player's statistics and information in a game
 */
type PlayerType = {
  /** Unique player identifier */
  id: number;
  /** Game identifier this player participated in */
  game_id: number;
  /** Player's username */
  user: string;
  /** Character played by the player */
  character: string;
  /** Number of takedowns achieved */
  takedowns: number;
  /** Number of deaths */
  deaths: number;
  /** Number of deathblows delivered */
  deathblows: number;
  /** Total damage dealt */
  damage: number;
  /** Total healing provided */
  healing: number;
  /** Total damage received */
  damage_received: number;
  /** Record creation timestamp */
  createdAt: string;
  /** Record last update timestamp */
  updatedAt: string;
  /** Team identifier */
  team: string;
  /** Total healing received from other players */
  TotalHealingReceived: number;
  /** Total damage absorbed by the player */
  TotalPlayerAbsorb: number;
  /** Number of powerups collected */
  PowerupsCollected: number;
  /** Damage avoided through evasion */
  DamageAvoidedByEvades: number;
  /** Incoming damage reduced by cover */
  MyIncomingDamageReducedByCover: number;
  /** Extra outgoing damage from empowerment */
  MyOutgoingExtraDamageFromEmpowered: number;
  /** Reduced outgoing damage from weakness */
  MyOutgoingReducedDamageFromWeakened: number;
  /** Movement denied to enemies */
  MovementDeniedByMe: number;
  /** Average enemies sighted per turn */
  EnemiesSightedPerTurn: number;
  /** Whether dash catalyst was used */
  DashCatalystUsed: boolean;
  /** Name of the dash catalyst used */
  DashCatalystName: string;
  /** Whether combat catalyst was used */
  CombatCatalystUsed: boolean;
  /** Name of the combat catalyst used */
  CombatCatalystName: string;
  /** Whether prep catalyst was used */
  PrepCatalystUsed: boolean;
  /** Name of the prep catalyst used */
  PrepCatalystName: string;
  /** Advanced ability statistics */
  advancedstats: AbilityGameSummaryList[];
  /** Whether player achieved deadliest performance */
  Deadliest: boolean;
  /** Whether player achieved most supportive performance */
  Supportiest: boolean;
  /** Whether player achieved tankiest performance */
  Tankiest: boolean;
  /** Whether player achieved most decorated performance */
  MostDecorated: boolean;
};

/**
 * Represents a completed game with all associated data
 */
type Game = {
  /** Unique game identifier */
  id: number;
  /** Date when the game was played */
  date: string;
  /** Internal game identifier */
  gameid: number;
  /** Winning team identifier */
  teamwin: string;
  /** Number of turns in the game */
  turns: number;
  /** Final score of the game */
  score: string;
  /** Map where the game was played */
  map: string;
  /** Array of player statistics */
  stats: PlayerType[];
  /** Type of game mode */
  gametype: string;
  /** Server where the game was hosted */
  server: string;
  /** Game version */
  version: string;
  /** Discord channel ID associated with the game */
  channelid: string;
  /** Record creation timestamp */
  createdAt: string;
  /** Game server process code */
  GameServerProcessCode: string;
};

/**
 * Represents character skin customization options
 */
interface CharacterSkin {
  /** Index of the selected skin */
  skinIndex: number;
  /** Index of the selected pattern */
  patternIndex: number;
  /** Index of the selected color */
  colorIndex: number;
}

/**
 * Represents comprehensive character information and customization
 */
interface CharacterInfo {
  /** Numeric identifier for the character type */
  CharacterType: number;
  /** Character skin configuration */
  CharacterSkin: CharacterSkin;
  /** Character cards configuration */
  CharacterCards: Record<string, number>;
  /** Character mods configuration */
  CharacterMods: Record<string, number>;
  /** Character ability VFX swaps */
  CharacterAbilityVfxSwaps: Record<string, number>;
  /** Array of character taunts */
  CharacterTaunts: CharacterTaunt[];
  /** Array of character loadouts */
  CharacterLoadouts: CharacterLoadout[];
  /** Number of matches played with this character */
  CharacterMatches: number;
  /** Current level of the character */
  CharacterLevel: number;
}

/**
 * Extended player information including team and character details
 */
export interface TeamPlayerInfo extends PlayerData {
  /** Team identifier */
  TeamId: number;
  /** Banner background identifier */
  BannerID: number;
  /** Emblem identifier */
  EmblemID: number;
  /** Ribbon identifier */
  RibbonID: number;
  /** Title identifier */
  TitleID: string;
  /** Player handle/username */
  Handle: string;
  /** Character information and customization */
  CharacterInfo: CharacterInfo;
  /** Numeric identifier for the character type */
  CharacterType: number;
  /** Character skin configuration */
  CharacterSkin: CharacterSkin;
  /** Character cards configuration */
  CharacterCards: Record<string, number>;
  /** Character mods configuration */
  CharacterMods: Record<string, number>;
  /** Character ability VFX swaps */
  CharacterAbilityVfxSwaps: Record<string, number>;
  /** Array of character taunts */
  CharacterTaunts: CharacterTaunt[];
  /** Array of character loadouts */
  CharacterLoadouts: CharacterLoadout[];
  /** Number of matches played with this character */
  CharacterMatches: number;
  /** Current level of the character */
  CharacterLevel: number;
}

/**
 * Game configuration settings
 */
interface GameConfig {
  /** Map name */
  Map: string;
  /** Type of game mode */
  GameType: string;
  /** Name of the game room */
  RoomName: string;
}

/**
 * Information about a game instance
 */
interface GameInfo {
  /** Monitor server process code */
  MonitorServerProcessCode: string;
  /** Game server process code */
  GameServerProcessCode: string;
  /** Timestamp when the game was created */
  CreateTimestamp: number;
  /** Number of active players */
  ActivePlayers: number;
  /** Map being played */
  Map: string;
  /** Number of players on team A */
  TeamAPlayers: number;
  /** Number of players on team B */
  TeamBPlayers: number;
  /** Game configuration settings */
  GameConfig: GameConfig;
}

/**
 * Represents a replay file with metadata and content
 */
export interface ReplayFile {
  /** Unique identifier for the replay */
  id: string;
  /** File name of the replay */
  name: string;
  /** Full file system path to the replay */
  fullPath: string;
  /** Date when the file was last modified */
  lastModified: Date;
  /** Raw content of the replay file */
  content: string;
  /** Parsed game information from the replay */
  gameInfo?: GameInfo;
  /** Team and player information from the replay */
  TeamPlayerInfo: TeamPlayerInfo[];
}

/**
 * Props for the ReplayDialog component
 */
interface ReplayDialogProps {
  /** The selected replay file to display */
  selectedReplay: ReplayFile;
  /** Game data associated with the replay */
  game: Game | undefined;
  /** Whether the dialog is in a loading state */
  loading: boolean;
  /** Error message from log processing */
  logError: string;
  /** Whether the dialog is open */
  openDialog: boolean;
  /** Function to set dialog open state */
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
  /** Whether the dialog was opened from the log page */
  fromLogPage: boolean;
}

/**
 * ReplayDialog component for displaying replay information and actions
 * @param props - The component props
 * @returns JSX element for the replay dialog
 */
export function ReplayDialog({
  selectedReplay,
  game,
  loading,
  logError,
  openDialog,
  setOpenDialog,
  fromLogPage,
}: ReplayDialogProps) {
  const evosStore = EvosStore();
  const { ticketEnabled, activeUser, exePath, noLogEnabled } = evosStore;

  const { t, i18n } = useTranslation();
  const [replayExists, setReplayExists] = useState(false);
  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [openCopyToClipBoardDialog, setOpenCopyToClipBoardDialog] =
    useState(false);
  const [reason, setReason] = useState('');

  /**
   * Copies text to the system clipboard
   * @param text - The text to copy to clipboard
   */
  const handleCopyToClibBoard = (text: string) => {
    if (selectedReplay) {
      navigator.clipboard.writeText(text);
    }
  };

  /**
   * Opens the reason dialog for Discord upload
   */
  const handleOpenReasonDialog = () => {
    setOpenReasonDialog(true);
  };

  /**
   * Opens the copy to clipboard dialog
   */
  const handleCopyToClipBoardDialog = () => {
    setOpenCopyToClipBoardDialog(true);
  };

  /**
   * Launches the game and copies the provided text to clipboard
   * @param text - The text to copy before launching the game
   */
  const handleLaunchGameAndCopyText = (text: string) => {
    handleCopyToClibBoard(text);
    setOpenCopyToClipBoardDialog(false);
    setOpenDialog(false);
    if (exePath.endsWith('AtlasReactor.exe')) {
      const userName = (activeUser?.user as string) ?? '';
      if (ticketEnabled === 'true') {
        // eslint-disable-next-line promise/catch-or-return
        getTicket(activeUser?.token ?? '')
          // eslint-disable-next-line promise/always-return
          .then((resp) => {
            withElectron((electron) =>
              electron.ipcRenderer.sendMessage('launch-game', {
                launchOptions: {
                  exePath,
                  ip: evosStore.ip,
                  port: evosStore.gamePort,
                  ticket: resp.data,
                  name: userName,
                  noLogEnabled,
                },
              }),
            );
          });
      } else {
        withElectron((electron) =>
          electron.ipcRenderer.sendMessage('launch-game', {
            launchOptions: {
              exePath,
              ip: evosStore.ip,
              port: evosStore.gamePort,
              config: activeUser?.configFile,
              name: userName,
              noLogEnabled,
            },
          }),
        );
      }
    }
  };

  /**
   * Closes the copy to clipboard dialog
   */
  const handleCloseCopyToClipBoardDialog = () => {
    setOpenCopyToClipBoardDialog(false);
  };

  /**
   * Closes the reason dialog
   */
  const handleCloseReasonDialog = () => {
    setOpenReasonDialog(false);
  };

  /**
   * Handles reason text input change
   * @param event - The input change event
   */
  const handleReasonChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setReason(event.target.value);
  };

  /**
   * Captures a screenshot of the specified area and returns it as a data URL
   * @returns Promise that resolves to the screenshot data URL
   */
  const captureScreenshot = async (): Promise<string> => {
    const element = document.getElementById('screenshot-area');
    if (element) {
      return html2canvas(element, {
        logging: true,
        allowTaint: false,
        useCORS: true,
      })
        .then((canvas) => {
          const dataUrl = canvas.toDataURL();
          return dataUrl;
        })
        .catch((error) => {
          throw error;
        });
    }
    // Return a rejected Promise if the element is not found
    return Promise.reject(new Error('Screenshot area element not found'));
  };

  /**
   * Sends the replay file and screenshot to Discord with the specified reason
   */
  const handleSendToDiscord = async (): Promise<void> => {
    if (!selectedReplay) return;

    if (!reason) {
      // Prompt user to enter a reason
      alert('Please enter a reason to upload to Discord.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append(
        'replayfile',
        new Blob([selectedReplay.content]),
        selectedReplay.name,
      );
      formData.append('user', activeUser?.handle || 'Not logged in!');
      formData.append('channelid', game?.channelid || 'No channelid found');
      formData.append('reason', reason);
      const screenshotDataUrl = await captureScreenshot();
      if (screenshotDataUrl) {
        // Convert data URL to blob
        const response = await fetch(screenshotDataUrl);
        const screenshotBlob = await response.blob();
        formData.append('screenshot', screenshotBlob, 'screenshot.png');
      } else {
        alert(t('replay.screenshotError'));
        return;
      }

      await axios.post('http://launcher.evos.live:6660/sendmessage', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      alert(error);
    }
    setOpenReasonDialog(false);
  };

  /**
   * Opens the folder containing the selected replay file
   */
  const handleOpenFolder = (): void => {
    if (selectedReplay) {
      const folderPath = selectedReplay.fullPath.substring(
        0,
        selectedReplay.fullPath.lastIndexOf('\\'),
      );
      withElectron((electron) => electron.ipcRenderer.openFolder(folderPath));
    }
  };

  /**
   * Closes the replay dialog
   */
  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };

  /**
   * Saves the replay file to the game directory
   */
  const handleSaveReplay = async (): Promise<void> => {
    if (selectedReplay) {
      const saved = await withElectron(
        (electron) =>
          electron.ipcRenderer.saveReplay(
            exePath,
            selectedReplay.name,
            selectedReplay.content,
          ),
        null,
      );
      if (saved) {
        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  };

  useEffect(() => {
    const checkfile = async () => {
      if (selectedReplay) {
        const exists = await withElectron(
          (electron) =>
            electron.ipcRenderer.replayExists(exePath, selectedReplay.name),
          null,
        );

        if (exists) {
          setReplayExists(true);
        } else {
          setReplayExists(false);
        }
      }
    };
    const interval = setInterval(async () => {
      checkfile();
    }, 10000);
    if (openDialog) checkfile();
    else clearInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [selectedReplay, exePath, openDialog]);

  return (
    <>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>{selectedReplay.name}</DialogTitle>
        <DialogContent style={{ overflowX: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {t('loading')}
            </div>
          ) : (
            <>
              {/* Display game info */}
              {selectedReplay.gameInfo && game ? (
                <div id="screenshot-area">
                  <Games
                    game={game as Game}
                    t={t}
                    i18n={i18n}
                    navigate={() => {}}
                    // @ts-ignore
                    customPlayers={selectedReplay.TeamPlayerInfo}
                  />
                </div>
              ) : (
                <div>{logError}</div>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {replayExists ? (
            <Button onClick={handleCopyToClipBoardDialog}>
              {t('replay.openCopyDialog')}
            </Button>
          ) : (
            <Button
              onClick={handleSaveReplay}
              color="primary"
              disabled={disabled}
            >
              {t('replay.downloadReplay')}
            </Button>
          )}
          {!fromLogPage && (
            <Button onClick={handleOpenFolder} color="primary">
              {t('replay.openReplayFolder')}
            </Button>
          )}
          <Button onClick={handleOpenReasonDialog} color="primary">
            {t('replay.discord')}
          </Button>
          <Button onClick={handleCloseDialog}>{t('replay.close')}</Button>
        </DialogActions>
      </Dialog>
      {/* Copy To ClipBoard Dialog */}
      <Dialog
        open={openCopyToClipBoardDialog}
        onClose={handleCopyToClipBoardDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('replay.copyTextAndOrLaunch')}</DialogTitle>
        <Typography style={{ padding: '20px' }}>
          <Trans i18nKey="replay.pasteInGameChat" components={{ 1: <br /> }} />
        </Typography>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            type="text"
            fullWidth
            rows={4}
            value={`/playreplay ${selectedReplay.name}`}
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              handleCopyToClibBoard(`/playreplay ${selectedReplay.name}`)
            }
            color="primary"
          >
            {t('replay.copyText')}
          </Button>
          <Button
            onClick={() =>
              handleLaunchGameAndCopyText(`/playreplay ${selectedReplay.name}`)
            }
            color="primary"
          >
            {t('replay.launchGame')}
          </Button>
          <Button onClick={handleCloseCopyToClipBoardDialog} color="primary">
            {t('replay.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Reason Dialog */}
      <Dialog
        open={openReasonDialog}
        onClose={handleCloseReasonDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('replay.specifyReason')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason"
            type="text"
            fullWidth
            rows={4}
            value={reason}
            onChange={handleReasonChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReasonDialog} color="primary">
            {t('replay.cancel')}
          </Button>
          <Button onClick={handleSendToDiscord} color="primary">
            {t('replay.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * Main component for displaying and managing replay files
 * @returns JSX element for the replays page
 */
function ReplaysPage(): React.JSX.Element {
  const { exePath } = EvosStore();
  const [replayData, setReplayData] = useState<ReplayFile[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplayFile | null>(null);
  const [game, setGame] = useState<Game | undefined>();
  const [logError, setLogError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  /**
   * Handles clicking on a replay file to view its details
   * @param log - The replay file that was clicked
   */
  const handleAccordionClick = async (log: ReplayFile): Promise<void> => {
    try {
      setSelectedReplay(log);
      setGame(undefined);
      setLogError('');
      setOpenDialog(true);
      setLoading(true);

      const content = await withElectron(
        (electron) => electron.ipcRenderer.getLogContent(log.fullPath),
        null,
      );
      if (content !== null) {
        log.content = content;

        // Parse log.content to access m_teamInfo_Serialized
        const parsedContent: {
          m_gameInfo_Serialized: string;
          m_teamInfo_Serialized: string;
        } = JSON.parse(log.content);

        // Parse m_gameInfo_Serialized
        const gameInfo: GameInfo = JSON.parse(
          parsedContent.m_gameInfo_Serialized,
        );

        log.gameInfo = gameInfo;

        // Parse m_teamInfo_Serialized string to JSON
        const teamInfo: TeamPlayerInfo[] = JSON.parse(
          parsedContent.m_teamInfo_Serialized,
        ).TeamPlayerInfo;

        // lowercase Handle to handle
        log.TeamPlayerInfo = teamInfo.map((player) => ({
          ...player,
          handle: player.Handle,
          bannerBg: player.BannerID,
          bannerFg: player.EmblemID,
          status: player.TitleID,
          factionData: {
            factions: [player.RibbonID],
            selectedRibbonID: player.RibbonID,
          },
        }));

        const uniqueLogPlayers = new Set(
          log.TeamPlayerInfo.filter((p) => !p.handle.startsWith('replay')).map(
            (p) => p.handle,
          ),
        );

        // Using regular expression to match the date and time part
        const dateRegex = /^\d{2}_\d{2}_\d{4}__\d{2}_\d{2}_\d{2}/;
        const matchedDateTime = log.name.match(dateRegex);

        // Extracting the matched date and time if found
        const formattedDateTime = matchedDateTime ? matchedDateTime[0] : null;

        // Converting the formatted date string to the desired format
        let formattedDate = '';

        if (formattedDateTime) {
          const [datePart] = formattedDateTime.split('__');
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [month, day, year] = datePart.split('_');
          const formattedDatePart = `${year}-${month}`;
          formattedDate = `${formattedDatePart}`;
        }

        // try to use GameServerProcessCode if not try to use hacky way date
        let gameFound = false;
        const strapi = strapiClient.from<Game>('games').select();
        strapi.equalTo('GameServerProcessCode', gameInfo.GameServerProcessCode);
        strapi.populate();
        const { data } = await strapi.get();

        if (data) {
          if (data.length !== 0) {
            data.forEach((g) => {
              const uniqueGamePlayers = new Set(
                g.stats.map((player: PlayerType) => player.user),
              );

              if (uniqueLogPlayers.size === uniqueGamePlayers.size) {
                const difference = new Set(
                  [...uniqueLogPlayers].filter(
                    (x) => !uniqueGamePlayers.has(x),
                  ),
                );
                if (difference.size === 0) {
                  setGame(g);
                  gameFound = true;
                }
              }
            });
          }
        }

        if (!gameFound) {
          const strapi2 = strapiClient.from<Game>('games').select();
          strapi2.startsWith('date', formattedDate);
          strapi2.equalTo('map', t(`maps.${gameInfo.GameConfig.Map}`));
          const server = gameInfo.GameServerProcessCode.split('-');
          strapi2.equalTo('server', `${server[0]}-${server[1]}`);
          strapi2.populate();
          strapi2.paginate(0, 10000);
          strapi2.sortBy([{ field: 'id', order: 'desc' }]);

          const { data: data2 } = await strapi2.get();

          if (data2?.length === 0) {
            setLogError(
              `No game found in the database for ${log.name} Invalid log file name`,
            );
            setGame(undefined);
          } else {
            setLogError('');
          }

          if (data2) {
            // Track if a game is found
            data2.forEach((g) => {
              const uniqueGamePlayers = new Set(
                g.stats.map((player: PlayerType) => player.user),
              );

              if (uniqueLogPlayers.size === uniqueGamePlayers.size) {
                const difference = new Set(
                  [...uniqueLogPlayers].filter(
                    (x) => !uniqueGamePlayers.has(x),
                  ),
                );
                if (difference.size === 0) {
                  setGame(g);
                  gameFound = true;
                }
              }
            });

            if (!gameFound) {
              setLogError(
                `No game found in the database for ${log.name} for date ${formattedDate}`,
              );
            }
          }
        }
      }
      setLoading(false);
    } catch (error) {
      // Handle error
      setLoading(false);
    }
  };

  useEffect(() => {
    /**
     * Fetches replay files from the file system and sorts them by modification date
     */
    const fetchReplays = async (): Promise<void> => {
      try {
        const data = await withElectron(
          (electron) => electron.ipcRenderer.getReplays(exePath),
          null,
        );

        if (data && Array.isArray(data)) {
          // Convert lastModified strings to Date objects
          data.forEach((file: ReplayFile) => {
            file.lastModified = new Date(file.lastModified);
          });

          // Sort files based on lastModified
          data.sort(
            (
              a: { lastModified: { getTime: () => number } },
              b: { lastModified: { getTime: () => number } },
            ) => b.lastModified.getTime() - a.lastModified.getTime(),
          );

          setReplayData(data);
        }
      } catch (error) {
        // console.error(error);
      }
    };

    fetchReplays();
    const intervalId = setInterval(fetchReplays, 10000);

    return () => clearInterval(intervalId);
  }, [exePath]);

  /**
   * Calculates color intensity based on how recently a file was modified
   * @param lastModified - The date when the file was last modified
   * @returns RGBA color string representing the age of the file
   */
  function calculateColorIntensity(lastModified: Date): string {
    const now = new Date();
    const timeDifference = now.getTime() - lastModified.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    const maxIntensity = 60;
    const intensity = Math.min(
      (minutesDifference / 20) * maxIntensity,
      maxIntensity,
    );

    const redValue = Math.floor(255 * (1 - intensity / 100));
    const greenValue = Math.floor(255 * (intensity / 100));
    const color = `rgba(${redValue}, ${greenValue}, 0, 1)`;

    return color;
  }

  /**
   * Enhanced replay file data with additional UI properties
   */
  interface ColoredReplayFile extends ReplayFile {
    /** CSS style for background color based on file age */
    colorStyle: {
      backgroundColor: string;
    };
    /** File size in kilobytes */
    sizeInKB: number;
  }

  const coloredRows: ColoredReplayFile[] = replayData.map((file) => ({
    ...file,
    id: file.fullPath,
    colorStyle: {
      backgroundColor: calculateColorIntensity(file.lastModified),
    },
    sizeInKB: (file.content?.length || 0) / 1024,
  }));

  /**
   * Column definitions for the DataGrid component
   */
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('replay.replayName'),
      flex: 1,
      minWidth: 500,
    },
    {
      field: 'lastModified',
      headerName: t('replay.replayDate'),
      flex: 1,

      valueGetter: (value, row) => {
        const { lastModified } = row as ReplayFile;
        return lastModified ? new Date(lastModified).toLocaleString() : '';
      },
      renderCell: (params) => (
        <div
          style={{ ...params.row.colorStyle, padding: '8px', minWidth: 200 }}
        >
          {params.row.lastModified.toLocaleString()}
        </div>
      ),
    },
    {
      field: 'size',
      headerName: t('replay.replaySize'),
      flex: 1,
      valueGetter: (value, row) => {
        let sizeInKB = row.size / 1024 || 0;
        // round up
        sizeInKB = Math.ceil(sizeInKB);
        return `${sizeInKB}KB`;
      },
    },
    {
      field: 'action',
      headerName: t('replay.replayAction'),
      flex: 1,
      maxWidth: 170,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleAccordionClick(params.row as ReplayFile)}
        >
          {t('replay.replayOpen')}
        </Button>
      ),
    },
  ];

  return (
    <Paper elevation={3} style={{ margin: '1em', width: '95%' }}>
      <DataGrid
        rows={coloredRows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        density="compact"
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight
        slots={{ toolbar: GridToolbar }}
        localeText={{
          noRowsLabel: t('replay.noReplays'),
          paginationRowsPerPage: t('replay.rowsPerPage'),
          paginationDisplayedRows: ({ from, to, count }) => {
            return `${from}-${to} ${t('replay.of')} ${count}`;
          },
        }}
      />
      {selectedReplay && (
        <ReplayDialog
          selectedReplay={selectedReplay}
          game={game}
          loading={loading}
          logError={logError}
          openDialog={openDialog}
          setOpenDialog={setOpenDialog}
          fromLogPage={false}
        />
      )}
    </Paper>
  );
}

/**
 * ReplaysPage component - Main component for managing and viewing game replay files
 * @default
 */
export default ReplaysPage;
