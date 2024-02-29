/* eslint-disable promise/always-return */
import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
  ListSubheader,
  Select,
  Alert,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';
import ForumIcon from '@mui/icons-material/Forum';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import {
  AccountData,
  PlayerData,
  getMotd,
  getPlayerData,
  getPlayerInfo,
  getTicket,
  logout,
} from 'renderer/lib/Evos';
import { EvosError, isValidExePath, processError } from 'renderer/lib/Error';
import Flag from 'react-flagkit';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@aptabase/electron/renderer';
import { Replay } from '@mui/icons-material';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';
import ErrorDialog from './ErrorDialog';
import { logo } from '../../lib/Resources';
import Player from '../atlas/Player';

interface Language {
  nativeName: string;
  icon: string;
}
const lngs: { [key: string]: Language } = {
  en: { nativeName: 'English', icon: 'US' },
  nl: { nativeName: 'Nederlands', icon: 'NL' },
  fr: { nativeName: 'Français', icon: 'FR' },
  ru: { nativeName: 'Русский', icon: 'RU' },
  de: { nativeName: 'Deutsch', icon: 'DE' },
  es: { nativeName: 'Español', icon: 'ES' },
  it: { nativeName: 'Italiano', icon: 'IT' },
  br: { nativeName: 'Português', icon: 'BR' },
  zh: { nativeName: '中文', icon: 'CN' },
  tr: { nativeName: 'Türkçe', icon: 'TR' },
};

type PaletteMode = 'light' | 'dark';

function RoundToNearest5(x: number) {
  return Math.round(x / 5) * 5;
}

export default function NavBar() {
  const evosStore = EvosStore();
  const mode = evosStore.mode as PaletteMode;
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const pages = [
    { title: t('menuOptions.status'), href: '/', icon: <HomeIcon /> },
    {
      title: t('menuOptions.gstats'),
      href: '/stats',
      icon: <BarChartIcon />,
    },
    {
      title: t('menuOptions.pstats'),
      href: '/playerstats',
      icon: <BarChartIcon />,
    },
    {
      title: t('menuOptions.previousGames'),
      href: '/previousgames',
      icon: <HistoryIcon />,
    },
    {
      title: t('menuOptions.gameLogs'),
      href: '/logs',
      icon: <TextSnippetIcon />,
    },
    {
      title: t('menuOptions.replays', 'Replays'),
      href: '/replays',
      icon: <Replay />,
    },
    {
      title: t('menuOptions.download'),
      href: '/download',
      icon: <DownloadIcon />,
    },
    {
      title: t('menuOptions.settings'),
      href: '/settings',
      icon: <SettingsIcon />,
      devider: true,
    },
    {
      title: t('menuOptions.joinDiscord'),
      href: '/discord',
      icon: <ForumIcon />,
    },
    {
      title: t('menuOptions.changelog'),
      href: '/changelog',
      icon: <GitHubIcon />,
    },
    {
      title: t('menuOptions.about'),
      href: '/about',
      icon: <InfoIcon />,
    },
  ];

  function FormatAge(ageMs: number) {
    if (ageMs < 5000) {
      return t('formatAge.justNow');
    }
    if (ageMs < 60000) {
      return `${RoundToNearest5(ageMs / 1000)} ${t('formatAge.secondsAgo')}`;
    }
    if (ageMs < 90000) {
      return t('formatAge.aMinuteAgo');
    }
    return `${Math.round(ageMs / 60000)} ${t('formatAge.minutesAgo')}`;
  }

  const {
    toggleMode,
    age,
    exePath,
    ticketEnabled,
    updateAuthenticatedUsers,
    activeUser,
    switchUser,
    authenticatedUsers,
    isDownloading,
    noLogEnabled,
  } = evosStore;
  const [error, setError] = useState<EvosError>();
  const [severity, setSeverity] = useState<string>('info');
  const { width } = useWindowDimensions();
  const [motd, setMotd] = useState<string>('');
  const [isPatching, setIsPatching] = useState(false);
  const [account, setAccount] = useState<AccountData>();
  const [playerInfoMap, setPlayerInfoMap] = useState<{
    [key: string]: PlayerData;
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const getInfo = (user: AuthUser) => {
      return getPlayerData(activeUser?.token ?? '', user.handle ?? '')
        .then((data) => {
          const info = data.data as PlayerData;
          info.status = info.titleId as unknown as string;
          return info as PlayerData;
        })
        .catch(() => {
          return null;
        });
    };
    const fetchData = async () => {
      const infoMap = Object.fromEntries(
        await Promise.all(
          authenticatedUsers.map(async (user) => [
            user.handle,
            await getInfo(user),
          ]),
        ),
      );
      if (infoMap[0] === null) {
        updateAuthenticatedUsers(
          activeUser?.user as string,
          '',
          activeUser?.handle as string,
          activeUser?.banner as number,
          activeUser?.configFile as string,
        );
        navigate('/login');
        return;
      }
      setPlayerInfoMap(infoMap);
    };

    fetchData();
  }, [
    activeUser?.banner,
    activeUser?.configFile,
    activeUser?.handle,
    activeUser?.token,
    activeUser?.user,
    authenticatedUsers,
    navigate,
    updateAuthenticatedUsers,
  ]);

  const handleLogOut = () => {
    logout(activeUser?.token ?? '');
    updateAuthenticatedUsers(
      activeUser?.user as string,
      '',
      activeUser?.handle as string,
      activeUser?.banner as number,
      activeUser?.configFile as string,
    );
    navigate('/login');
  };

  useEffect(() => {
    async function get() {
      // check if i18n.language is in lngs
      if (!Object.keys(lngs).includes(i18n.language)) {
        i18n.changeLanguage('en');
      }
      getMotd(i18n.language ?? 'en')
        .then((resp) => {
          setMotd(resp.data.text);
          setSeverity(resp.data.severity);
        })
        .catch(async () => {
          setMotd(t('errors.errorMotd'));
        });
    }
    get();
    getPlayerInfo(activeUser?.token ?? '')
      .then((resp) => {
        if (resp !== null) {
          setError(undefined);
          setAccount(resp.data);
          if (resp.data) {
            if (new Date(resp.data.lockedUntil) < new Date()) {
              setAccount((prev) => {
                if (prev) {
                  return { ...prev, locked: false };
                }
                return prev;
              });
            }
          }
        }
      })
      .catch(() => {});
  }, [
    activeUser?.token,
    i18n,
    i18n.language,
    navigate,
    t,
    updateAuthenticatedUsers,
  ]);

  const [activeGames, setActiveGames] = useState<{
    [username: string]: boolean;
  }>({});
  const drawerWidth = width !== null && width < 916 ? 60 : 240;

  const doNavigate = (href: string) => {
    trackEvent('Page', {
      page: `${href}`,
    });
    navigate(href);
  };

  const handleAddUser = () => {
    navigate('/add-account');
  };

  const isAuthenticated = () => {
    return (
      activeUser !== null &&
      Object.keys(activeUser).length !== 0 &&
      activeUser.token !== ''
    );
  };

  const handleSwitchUser = (event: React.MouseEvent<HTMLElement>) => {
    const user = event.currentTarget.innerText.split('#')[0];
    switchUser(user);
    navigate('/');
  };

  const handleSetActiveGame = (event: any) => {
    setActiveGames((prevActiveGames) => ({
      ...prevActiveGames,
      [event[0]]: event[1],
    }));
  };

  const handleIsPatching = (event: any) => {
    setIsPatching(event);
  };

  const UPDATE_PERIOD_MS = 300000;
  const updatePeriodMs =
    useHasFocus() || !account ? UPDATE_PERIOD_MS : undefined;

  useInterval(() => {
    getPlayerInfo(activeUser?.token ?? '')
      .then((resp) => {
        if (resp !== null) {
          setError(undefined);
          setAccount(resp.data);
          if (account) {
            if (new Date(account?.lockedUntil) < new Date()) {
              setAccount((prev) => {
                if (prev) {
                  return { ...prev, locked: false };
                }
                return prev;
              });
            }
          }
        }
      })
      .catch((e) => processError(e, setError, navigate, () => {}, t));
  }, updatePeriodMs);

  window.electron.ipcRenderer.on('setActiveGame', handleSetActiveGame);
  window.electron.ipcRenderer.on('handleIsPatching', handleIsPatching);

  const handleLaunchGameClick = () => {
    if (!activeGames[activeUser?.user as string]) {
      if (exePath.endsWith('AtlasReactor.exe')) {
        const userName = (activeUser?.user as string) ?? '';
        if (ticketEnabled === 'true') {
          // eslint-disable-next-line promise/catch-or-return
          getTicket(activeUser?.token ?? '')
            // eslint-disable-next-line promise/always-return
            .then((resp) => {
              window.electron.ipcRenderer.sendMessage('launch-game', {
                launchOptions: {
                  exePath,
                  ip: evosStore.ip,
                  port: evosStore.gamePort,
                  ticket: resp.data,
                  name: userName,
                  noLogEnabled,
                },
              });
            })
            .catch((e) => processError(e, setError, navigate, handleLogOut, t));
        } else {
          window.electron.ipcRenderer.sendMessage('launch-game', {
            launchOptions: {
              exePath,
              ip: evosStore.ip,
              port: evosStore.gamePort,
              config: activeUser?.configFile,
              name: userName,
              noLogEnabled,
            },
          });
        }
      }
    } else {
      window.electron.ipcRenderer.sendMessage(
        'close-game',
        activeUser?.user as string,
      );
    }
  };
  let tooltipTitle = '';
  if (exePath.endsWith('AtlasReactor.exe')) {
    if (activeGames[activeUser?.user as string]) {
      tooltipTitle = `${t('game.kill')} ${activeUser?.handle}`;
    } else {
      tooltipTitle = `${t('game.play')} ${activeUser?.handle}`;
    }
  } else {
    tooltipTitle = t('errors.errorExe');
  }

  if (!isValidExePath(exePath)) {
    tooltipTitle = t('errors.errorPath');
  }

  return (
    <>
      {error && (
        <ErrorDialog error={error} onDismiss={() => setError(undefined)} />
      )}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '64px' }}>
            <Avatar
              alt="logo"
              variant="square"
              src={logo()}
              sx={{
                flexShrink: 1,
                width: 255,
                height: 40,
                display: { xs: 'none', md: 'flex' },
              }}
            />
            {isAuthenticated() && (
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  flexGrow: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <Tooltip title={tooltipTitle}>
                  <span>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: (theme) =>
                          activeGames[activeUser?.user as string]
                            ? theme.palette.error.dark
                            : theme.palette.primary.light,
                      }}
                      disabled={
                        !exePath.endsWith('AtlasReactor.exe') ||
                        isDownloading ||
                        isPatching ||
                        !isValidExePath(exePath) ||
                        account?.locked
                      }
                      onClick={handleLaunchGameClick}
                    >
                      {activeGames[activeUser?.user as string]
                        ? `${t('game.kill')} ${activeUser?.user}`
                        : `${t('game.play')} ${activeUser?.user}`}
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            )}
            <Stack
              direction="row"
              alignItems="center"
              sx={{
                flexGrow: 1,
                justifyContent: 'flex-end',
              }}
            >
              <IconButton sx={{ ml: 1 }} onClick={toggleMode} color="inherit">
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Stack>
            <Box sx={{ flexGrow: 0, paddingRight: '5px' }}>
              <Select
                value={i18n.language ? i18n.language : lngs.en.nativeName}
                label=""
                variant="standard"
                disableUnderline
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                sx={{ width: '100%', height: '55px' }}
              >
                {Object.keys(lngs).map((lng) => (
                  <MenuItem value={lng} key={lng}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Flag country={lngs[lng].icon} size={20} />
                      <span style={{ marginLeft: '8px' }}>{'  '}</span>
                      <ListItemText primary={lngs[lng].nativeName} />
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              {isAuthenticated() && (
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ cursor: 'pointer' }}
                >
                  <Select
                    value={activeUser?.handle}
                    label=""
                    disabled={isDownloading}
                    variant="standard"
                    disableUnderline
                    sx={{
                      width: '100%',
                      height: '50.5px',
                    }}
                  >
                    <ListSubheader>{t('accounts')}</ListSubheader>
                    {authenticatedUsers.map((user) => (
                      <MenuItem
                        value={user.handle}
                        key={user.user}
                        onClick={handleSwitchUser}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            height: '36.5px',
                          }}
                        >
                          <Player
                            info={playerInfoMap[user.handle]}
                            disableSkew
                          />
                        </div>
                      </MenuItem>
                    ))}
                    <ListSubheader>{t('actions')}</ListSubheader>
                    <MenuItem onClick={handleAddUser}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minHeight: '36.5px',
                        }}
                      >
                        {t('addAccount')}
                      </div>
                    </MenuItem>
                    <MenuItem onClick={handleLogOut}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minHeight: '36.5px',
                        }}
                      >
                        {t('logout')}
                      </div>
                    </MenuItem>
                  </Select>
                </Stack>
              )}
              {!isAuthenticated() && (
                <NavLink
                  to="/login"
                  style={(active) => active && { display: 'none' }}
                >
                  <Typography>{t('login')}</Typography>
                </NavLink>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      {isAuthenticated() && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
            },
          }}
        >
          <Toolbar sx={{ Height: '70px' }} />
          <Paper
            elevation={0}
            sx={{
              marginTop: `auto`,
              width: '100%',
              borderRadius: 0,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            <Alert
              icon={false}
              variant="filled"
              severity={severity as 'info' | 'error' | 'warning'}
              sx={{
                marginTop: `auto`,
                width: '100%',
                borderRadius: 0,
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '14px' }}>
                {motd}
              </Typography>
            </Alert>
          </Paper>
          <Box
            sx={{
              overflow: 'hidden',
              Height: '70px',
            }}
          >
            <Paper
              sx={{
                height: '100vh',
                boxShadow: 'none',
                borderRadius: 0,
              }}
            >
              <List>
                {pages.map((page, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <React.Fragment key={index}>
                    {page.devider && <Divider key={`${page.title}-divider`} />}
                    <ListItem
                      key={page.title}
                      disablePadding
                      sx={{ display: 'block' }}
                      disabled={isDownloading}
                      onClick={() => {
                        if (!isDownloading) doNavigate(page.href);
                      }}
                    >
                      <ListItemButton>
                        <ListItemIcon>{page.icon}</ListItemIcon>
                        <ListItemText
                          primaryTypographyProps={{ fontSize: '13px' }}
                          primary={page.title}
                          sx={{ display: { xs: 'none', md: 'flex' } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Box>

          {location.pathname === '/' && (
            <Paper
              sx={{
                marginTop: `auto`,
                width: '100%',
                display: { xs: 'none', md: 'flex', borderRadius: 0 },
              }}
            >
              <List>
                <ListItem>
                  <ListItemText>
                    {age === undefined
                      ? t('loading')
                      : `${t('updated')} ${FormatAge(age)}`}
                  </ListItemText>
                </ListItem>
              </List>
            </Paper>
          )}
        </Drawer>
      )}
    </>
  );
}
