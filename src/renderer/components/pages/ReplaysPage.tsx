/* eslint-disable no-alert */
/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper, TextField } from '@mui/material';
import EvosStore from 'renderer/lib/EvosStore';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { PlayerData } from 'renderer/lib/Evos';
import { strapiClient } from 'renderer/lib/strapi';
import { Games } from '../stats/PreviousGamesPlayed';

type PlayerType = {
  id: number;
  game_id: number;
  user: string;
  character: string;
  takedowns: number;
  deaths: number;
  deathblows: number;
  damage: number;
  healing: number;
  damage_received: number;
  createdAt: string;
  updatedAt: string;
  team: string;
};

type Game = {
  id: number;
  date: string;
  gameid: number;
  teamwin: string;
  turns: number;
  score: string;
  map: string;
  stats: PlayerType[];
  gametype: string;
  server: string;
  version: string;
  channelid: string;
};

interface CharacterSkin {
  skinIndex: number;
  patternIndex: number;
  colorIndex: number;
}

interface CharacterInfo {
  CharacterType: number;
  CharacterSkin: CharacterSkin;
  CharacterCards: Record<string, number>;
  CharacterMods: Record<string, number>;
  CharacterAbilityVfxSwaps: Record<string, number>;
  CharacterTaunts: Array<Record<string, any>>;
  CharacterLoadouts: Array<Record<string, any>>;
  CharacterMatches: number;
  CharacterLevel: number;
}

export interface TeamPlayerInfo extends PlayerData {
  TeamId: number;
  BannerID: number;
  EmblemID: number;
  RibbonID: number;
  TitleID: string;
  Handle: string;
  CharacterInfo: CharacterInfo;
  CharacterType: number;
  CharacterSkin: CharacterSkin;
  CharacterCards: Record<string, number>;
  CharacterMods: Record<string, number>;
  CharacterAbilityVfxSwaps: Record<string, number>;
  CharacterTaunts: Array<Record<string, any>>;
  CharacterLoadouts: Array<Record<string, any>>;
  CharacterMatches: number;
  CharacterLevel: number;
}

interface GameConfig {
  Map: string;
  GameType: string;
  RoomName: string;
}

interface GameInfo {
  MonitorServerProcessCode: string;
  GameServerProcessCode: string;
  CreateTimestamp: number;
  ActivePlayers: number;
  Map: string;
  TeamAPlayers: number;
  TeamBPlayers: number;
  GameConfig: GameConfig;
}

interface ReplayFile {
  id: string;
  name: string;
  fullPath: string;
  lastModified: Date;
  content: string;
  gameInfo?: GameInfo;
  TeamPlayerInfo: TeamPlayerInfo[];
}

function ReplaysPage() {
  const { activeUser, exePath } = EvosStore();
  const [replayData, setReplayData] = useState<ReplayFile[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplayFile | null>(null);
  const [screenshot, setScreenshot] = useState<BlobPart>();
  const [game, setGame] = useState<Game>();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const [openReasonDialog, setOpenReasonDialog] = useState(false);
  const [reason, setReason] = useState('');

  const handleOpenReasonDialog = () => {
    setOpenReasonDialog(true);
  };

  const handleCloseReasonDialog = () => {
    setOpenReasonDialog(false);
  };

  const handleReasonChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setReason(event.target.value);
  };

  const captureScreenshot = () => {
    const element = document.getElementById('screenshot-area');
    if (element) {
      return html2canvas(element, {
        logging: true,
        allowTaint: false,
        useCORS: true,
      })
        .then((canvas) => {
          const dataUrl = canvas.toDataURL();
          setScreenshot(dataUrl);
          return dataUrl;
        })
        .catch((error) => {
          throw error;
        });
    }
    // Return a rejected Promise if the element is not found
    return Promise.reject(new Error('Screenshot area element not found'));
  };

  const handleSendToDiscord = async () => {
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
      formData.append('reason', reason);
      captureScreenshot();
      if (screenshot) {
        const screenshotBlob = new Blob([screenshot], { type: 'image/png' });
        formData.append('screenshot', screenshotBlob, 'screenshot.png');
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

  const handleAccordionClick = async (log: ReplayFile) => {
    try {
      setSelectedReplay(log);
      setOpenDialog(true);
      setLoading(true);

      const content = await window.electron.ipcRenderer.getLogContent(
        log.fullPath,
      );
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

      // Using regular expression to match the date and time part
      const dateRegex = /^\d{2}_\d{2}_\d{4}__\d{2}_\d{2}_\d{2}/;
      const matchedDateTime = log.name.match(dateRegex);

      // Extracting the matched date and time if found
      const formattedDateTime = matchedDateTime ? matchedDateTime[0] : null;

      // Converting the formatted date string to the desired format
      let formattedDate = '';

      if (formattedDateTime) {
        const [datePart, timePart] = formattedDateTime.split('__');
        const [month, day, year] = datePart.split('_');
        const formattedDatePart = `${year}-${month}-${day}`;
        const [hour, minute] = timePart.split('_');
        const formattedTimePart = `${hour}:${minute}:`;

        // Constructing the formatted date string
        formattedDate = `${formattedDatePart} ${formattedTimePart}`;
      }

      // search strapi for the game info using the formatted date string
      // const strapi = strapiClient.from('games').select(['*']);
      const strapi = strapiClient.from<Game>('games').select();
      strapi.startsWith('date', formattedDate);
      strapi.populate();
      const { data } = await strapi.get();

      // map over data and find the correct game info using existing players log.TeamPlayerInfo[].handle
      if (data) {
        data.forEach((g) => {
          const players = g.stats.map((player: PlayerType) => player.user);
          const playersMatched = players.every((player: string) =>
            log.TeamPlayerInfo.map((p) => p.handle).includes(player),
          );

          if (playersMatched) {
            setGame(g);
          }
        });
      }
      setLoading(false);
    } catch (error) {
      // Handle error
      setLoading(false);
    }
  };

  const handleOpenFolder = () => {
    if (selectedReplay) {
      const folderPath = selectedReplay.fullPath.substring(
        0,
        selectedReplay.fullPath.lastIndexOf('\\'),
      );
      window.electron.ipcRenderer.openFolder(folderPath);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  useEffect(() => {
    const fetchReplays = async () => {
      try {
        const data = await window.electron.ipcRenderer.getReplays(exePath);
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
      } catch (error) {
        // console.error(error);
      }
    };

    fetchReplays();
    const intervalId = setInterval(fetchReplays, 10000);

    return () => clearInterval(intervalId);
  }, [exePath]);

  function calculateColorIntensity(lastModified: Date) {
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

  const coloredRows: ReplayFile[] = replayData.map((file) => ({
    ...file,
    id: file.fullPath,
    colorStyle: {
      backgroundColor: calculateColorIntensity(file.lastModified),
    },
    sizeInKB: (file.content?.length || 0) / 1024,
  }));

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('replay.replayName'),
      flex: 1,
    },
    {
      field: 'lastModified',
      headerName: t('replay.replayDate'),
      flex: 1,
      valueGetter: (params) => {
        const { lastModified } = params.row as ReplayFile;
        return lastModified ? new Date(lastModified).toLocaleString() : '';
      },
      renderCell: (params) => (
        <div style={{ ...params.row.colorStyle, padding: '8px' }}>
          {params.row.lastModified.toLocaleString()}
        </div>
      ),
    },
    {
      field: 'size',
      headerName: t('replay.replaySize'),
      flex: 1,
      valueGetter: (params) => {
        let sizeInKB = params.row.size / 1024 || 0;
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
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        autoHeight
        localeText={{
          noRowsLabel: t('replay.noReplays'),
          MuiTablePagination: {
            labelRowsPerPage: t('replay.rowsPerPage'),
            labelDisplayedRows({ from, to, count }) {
              return `${from}-${to} ${t('replay.of')} ${count}`;
            },
          },
        }}
      />
      {selectedReplay && (
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
                  {selectedReplay.gameInfo && (
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
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleOpenFolder} color="primary">
                {t('replay.openReplayFolder')}
              </Button>
              <Button onClick={handleOpenReasonDialog} color="primary">
                {t('replay.discord')}
              </Button>
              <Button onClick={handleCloseDialog}>{t('replay.close')}</Button>
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
      )}
    </Paper>
  );
}

export default ReplaysPage;
