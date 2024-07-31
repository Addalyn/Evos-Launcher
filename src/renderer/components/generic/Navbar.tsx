/* eslint-disable react/no-danger */
/* eslint-disable-next-line react/no-array-index-key */
import {
  AccountData,
  Branches,
  PlayerData,
  getBranches,
  getMotd,
  getPlayerData,
  getPlayerInfo,
  getTicket,
  logout,
} from 'renderer/lib/Evos';
import {
  Alert,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { EvosError, isValidExePath, processError } from 'renderer/lib/Error';
import BaseDialog from './BaseDialog';
import EvosStore, { AuthUser } from 'renderer/lib/EvosStore';
import { NavLink, useNavigate } from 'react-router-dom';
/* eslint-disable no-nested-ternary */
/* eslint-disable promise/always-return */
import React, { useEffect, useMemo, useState } from 'react';
import { logo, logoSmall } from '../../lib/Resources';

import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import BarChartIcon from '@mui/icons-material/BarChart';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorDialog from './ErrorDialog';
import ForumIcon from '@mui/icons-material/Forum';
import GitHubIcon from '@mui/icons-material/GitHub';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import Player from '../atlas/Player';
import { Replay } from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
// import LogoDevIcon from '@mui/icons-material/LogoDev';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import Toolbar from '@mui/material/Toolbar';
import { trackEvent } from '@aptabase/electron/renderer';
import useHasFocus from 'renderer/lib/useHasFocus';
import useInterval from 'renderer/lib/useInterval';
import { useTranslation } from 'react-i18next';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';

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

export default function NavBar() {
  const evosStore = EvosStore();

  const { t, i18n } = useTranslation();
  const [isDev, setIsDev] = useState(false);

  const pages = useMemo(
    () => [
      {
        title: t('menuOptions.status'),
        href: '/',
        icon: <HomeIcon />,
      },
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
        title: t('menuOptions.wiki'),
        href: '/wiki',
        icon: <ArticleIcon />,
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
      {
        title: t('menuOptions.SupportUs'),
        href: '#support',
        icon: <PriceChangeIcon />,
        special: true,
      },
    ],
    [t],
  );

  const {
    exePath,
    ticketEnabled,
    updateAuthenticatedUsers,
    activeUser,
    switchUser,
    authenticatedUsers,
    isDownloading,
    noLogEnabled,
    setDev,
    needPatching,
    branch,
    locked,
    setLocked,
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

  const [supportUs, setSupportUs] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const getInfo = (user: AuthUser) => {
      return getPlayerData(activeUser?.token ?? '', user.handle ?? '')
        .then((data) => {
          const info = data.data as PlayerData;
          info.status = info.titleId as unknown as string;
          if (info.titleId === 26 && activeUser?.handle === user.handle) {
            setIsDev(true);
            setDev(true);
          }
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
    setDev(false);
    setIsDev(false);
    fetchData();
  }, [
    activeUser?.banner,
    activeUser?.configFile,
    activeUser?.handle,
    activeUser?.token,
    activeUser?.user,
    authenticatedUsers,
    navigate,
    setDev,
    updateAuthenticatedUsers,
  ]);

  // Dev stuff not ready for release
  useEffect(() => {
    if (isDev) {
      // pages.push({
      //   title: 'Developer Tools',
      //   href: '/dev',
      //   icon: <LogoDevIcon />,
      //   devider: true,
      // });
    }
  }, [isDev, pages]);

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
      page: `${activeUser?.user}: ${href}`,
    });
    if (href === '#support') {
      setSupportUs(true);
      return;
    }
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
    setActiveGames((prevActiveGames) => {
      const newActiveGames = {
        ...prevActiveGames,
        [event[0]]: event[1],
      };

      // Check if any game is active
      const hasActiveGame = Object.values(newActiveGames).some(
        (isActive) => isActive,
      );

      // Update locked state
      setLocked(hasActiveGame);

      return newActiveGames;
    });
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

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let intervalId: string | number | NodeJS.Timeout | undefined;

    if (branch !== '') {
      const getBranchesInfo = async () => {
        const response = await getBranches();
        const { data }: { data: Branches } = response;
        if (data && !locked) {
          // time out 3seconds
          setTimeout(() => {
            window.electron.ipcRenderer.checkBranch(data[branch]);
          }, 1000);
        }
      };

      getBranchesInfo();

      // check it every 5minutes when not in game
      if (!activeGames[activeUser?.user as string]) {
        intervalId = setInterval(getBranchesInfo, 5 * 60 * 1000);
      } else {
        clearInterval(intervalId);
      }
    }
    return () => clearInterval(intervalId);
  }, [activeGames, activeUser?.user, branch, locked, needPatching, t]);

  const handleLaunchGameClick = async () => {
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
      {supportUs && (
        <BaseDialog
          title={t('supportUs.title')}
          content={
            <div
              dangerouslySetInnerHTML={{
                __html: t('supportUs.text'),
              }}
            />
          }
          dismissText={t('replay.close')}
          onDismiss={() => setSupportUs(!supportUs)}
        />
      )}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Container
          maxWidth="xl"
          sx={{ '-webkit-app-region': 'drag', minWidth: '100%' }}
        >
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
            <Box
              sx={{
                flexGrow: 1,
                justifyContent: 'flex-start',
              }}
            >
              <Avatar
                alt="logo"
                variant="square"
                src={logoSmall()}
                sx={{
                  flexShrink: 1,
                  width: 40,
                  height: 40,
                  display: { xs: 'flex', md: 'none' },
                }}
              />
            </Box>
            {isAuthenticated() &&
              !isDownloading &&
              !isPatching &&
              !needPatching &&
              !account?.locked && (
                <Box
                  sx={{
                    flexGrow: 1,
                    justifyContent: 'center',
                  }}
                >
                  <Tooltip
                    title={tooltipTitle}
                    slotProps={{
                      popper: {
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [0, 14],
                            },
                          },
                        ],
                      },
                    }}
                  >
                    <span>
                      <Button
                        variant="outlined"
                        className={
                          activeGames[activeUser?.user as string]
                            ? 'glow-on-hover active'
                            : 'glow-on-hover '
                        }
                        sx={{
                          color: 'white',
                          '-webkit-app-region': 'no-drag',
                          height: '49.5px',
                          borderRadius: '0px',
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
                        <SportsEsportsIcon
                          sx={{
                            height: '25px',
                            width: '25px',
                            display: { xs: 'flex', md: 'none' },
                          }}
                        />
                        <Typography
                          variant="button"
                          display="block"
                          gutterBottom
                          sx={{ display: { xs: 'none', md: 'flex' } }}
                        >
                          {activeGames[activeUser?.user as string]
                            ? `${t('game.kill')} ${activeUser?.user}`
                            : `${t('game.play')} ${activeUser?.user}`}
                        </Typography>
                      </Button>
                    </span>
                  </Tooltip>
                </Box>
              )}
            <Box
              sx={{
                flexGrow: 0,
                justifyContent: 'flex-end',
                marginTop: '5px',
              }}
            >
              {isAuthenticated() && (
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ cursor: 'pointer', '-webkit-app-region': 'no-drag' }}
                >
                  <Select
                    value={activeUser?.handle}
                    label=""
                    disabled={isDownloading}
                    variant="standard"
                    disableUnderline
                    sx={{
                      width: '92%',
                      height: '50.5px',
                    }}
                    inputProps={{ IconComponent: () => null }}
                  >
                    <ListSubheader>{t('accounts')}</ListSubheader>
                    {authenticatedUsers.map((user) => (
                      <MenuItem
                        value={user.handle}
                        key={user.user}
                        onClick={handleSwitchUser}
                        sx={{
                          width: '100%',
                        }}
                      >
                        <Player info={playerInfoMap[user.handle]} disableSkew />
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
            <Box sx={{ width: '98px' }} />
          </Toolbar>
        </Container>
      </AppBar>
      {isAuthenticated() && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            maxWidth: drawerWidth,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <Toolbar sx={{ height: '70px' }} />

          {/* MOTD - Always visible at the top */}
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: 0,
              display: { xs: 'none', md: 'flex' },
              position: 'sticky',
              top: 0,
            }}
          >
            <Alert
              icon={false}
              variant="filled"
              severity={severity as 'info' | 'error' | 'warning'}
              sx={{
                width: '100%',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '14px' }}>
                {motd}
              </Typography>
            </Alert>
          </Paper>

          {/* Scrollable content area for the first list */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto', // Allow scrolling in this area
            }}
          >
            <Paper
              sx={{
                flex: 1,
                boxShadow: 'none',
                borderRadius: 0,
                overflowY: 'auto', // Scrollable content
                overflowX: 'hidden',
              }}
            >
              <List>
                {pages.map((page, index) => {
                  if (!page.special) {
                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <React.Fragment key={index}>
                        {page.devider && (
                          <Divider key={`${page.title}-divider`} />
                        )}
                        <ListItem
                          key={page.title}
                          disablePadding
                          sx={{ display: 'block' }}
                          disabled={isDownloading}
                          onClick={() => {
                            if (!isDownloading) doNavigate(page.href);
                          }}
                        >
                          <ListItemButton
                            className={page.special ? 'glow-on-hover' : ''}
                            sx={{
                              width: page.special ? '98%' : '100%',
                              left: page.special ? '3px' : '0px',
                              bottom: page.special ? '4px' : '0px',
                            }}
                          >
                            <ListItemIcon>{page.icon}</ListItemIcon>
                            <ListItemText
                              primaryTypographyProps={{ fontSize: '16px' }}
                              primary={page.title}
                              sx={{ display: { xs: 'none', md: 'flex' } }}
                            />
                          </ListItemButton>
                        </ListItem>
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </List>
            </Paper>
          </Box>

          {/* Fixed bottom section for the last list */}
          <Box
            sx={{
              padding: 1,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <List>
              {pages.map((page, index) => {
                if (page.special) {
                  return (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={index}>
                      <ListItem
                        key={page.title}
                        disablePadding
                        sx={{
                          display: 'block',
                          marginBottom: pages.length < 1 ? '10px' : '',
                        }}
                        disabled={isDownloading}
                        onClick={() => {
                          if (!isDownloading) doNavigate(page.href);
                        }}
                      >
                        <ListItemButton
                          className="glow-on-hover"
                          sx={{
                            width: '97%',
                            left: '4px',
                          }}
                        >
                          <ListItemIcon sx={{ color: 'white' }}>
                            {page.icon}
                          </ListItemIcon>
                          <ListItemText
                            primaryTypographyProps={{ fontSize: '16px' }}
                            primary={page.title}
                            sx={{
                              color: 'white',
                              display: { xs: 'none', md: 'flex' },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </List>
          </Box>
        </Drawer>
      )}
    </>
  );
}
