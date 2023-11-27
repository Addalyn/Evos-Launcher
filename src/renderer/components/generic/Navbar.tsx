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
import EvosStore from 'renderer/lib/EvosStore';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import { getMotd, getTicket, logout } from 'renderer/lib/Evos';
import { EvosError, processError } from 'renderer/lib/Error';
import axios from 'axios';
import { BannerType, logo, playerBanner } from '../../lib/Resources';
import ErrorDialog from './ErrorDialog';

type PaletteMode = 'light' | 'dark';

const pages = [
  { title: 'Status', href: '/', icon: <HomeIcon /> },
  { title: 'Global Stats', href: '/stats', icon: <BarChartIcon /> },
  { title: 'Personal Stats', href: '/playerstats', icon: <BarChartIcon /> },
  { title: 'Previous Games', href: '/previousgames', icon: <HistoryIcon /> },
  {
    title: 'Join Discord',
    href: 'https://discord.gg/evos-atlasreactor',
    icon: <ForumIcon />,
    exsternal: true,
  },
  { title: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  { title: 'Download', href: '/download', icon: <DownloadIcon /> },
  { title: 'About', href: '/about', icon: <InfoIcon /> },
  { title: 'Changelog', href: '/changelog', icon: <GitHubIcon /> },
];

function RoundToNearest5(x: number) {
  return Math.round(x / 5) * 5;
}

function FormatAge(ageMs: number) {
  if (ageMs < 5000) {
    return 'just now';
  }
  if (ageMs < 60000) {
    return `${RoundToNearest5(ageMs / 1000)} seconds ago`;
  }
  if (ageMs < 90000) {
    return `A minute ago`;
  }
  return `${Math.round(ageMs / 60000)} minutes ago`;
}

export default function NavBar() {
  const evosStore = EvosStore();
  const mode = evosStore.mode as PaletteMode;
  const location = useLocation();

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
  const { width } = useWindowDimensions();
  const [motd, setMotd] = useState<string>('');
  const [isPatching, setIsPatching] = useState(false);

  useEffect(() => {
    async function get() {
      getMotd()
        // eslint-disable-next-line promise/always-return
        .then((resp) => {
          setMotd(resp.data.text);
        })
        .catch(async () => {
          try {
            const resp = await axios.get(
              'https://misc.addalyn.baby/motd.json',
              { headers: { accept: 'application/json' } }
            );
            setMotd(resp.data.text);
          } catch (e) {
            setMotd('Error Loading Motd');
          }
        });
    }
    get();
  }, []);

  const [activeGames, setActiveGames] = useState<{
    [username: string]: boolean;
  }>({});
  const drawerWidth = width !== null && width < 916 ? 60 : 240;

  const navigate = useNavigate();

  const handleLogOut = () => {
    logout(activeUser?.token ?? '');
    updateAuthenticatedUsers(
      activeUser?.user as string,
      '',
      activeUser?.handle as string,
      activeUser?.banner as number,
      activeUser?.configFile as string
    );
    navigate('/login');
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
            .catch((e) => processError(e, setError, navigate, handleLogOut));
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
        activeUser?.user as string
      );
    }
  };
  let tooltipTitle = '';
  if (exePath.endsWith('AtlasReactor.exe')) {
    if (activeGames[activeUser?.user as string]) {
      tooltipTitle = `Kill Atlas Reactor for ${activeUser?.handle}`;
    } else {
      tooltipTitle = `Play Atlas Reactor as ${activeUser?.handle}`;
    }
  } else {
    tooltipTitle = 'Select your Atlas Reactor Executable in Settings first';
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
                        isPatching
                      }
                      onClick={handleLaunchGameClick}
                    >
                      {activeGames[activeUser?.user as string]
                        ? `Kill Atlas Reactor for ${activeUser?.user}`
                        : `Play Atlas Reactor as ${activeUser?.user}`}
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
                    sx={{ width: '100%', maxHeight: '36.5px' }}
                  >
                    <ListSubheader>Accounts</ListSubheader>
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
                            maxHeight: '36.5px',
                          }}
                        >
                          {user?.handle}
                          <Avatar
                            alt="Avatar"
                            src={playerBanner(
                              BannerType.foreground,
                              user.banner ?? 65
                            )}
                            sx={{ width: 64, height: 64, marginRight: '16px' }}
                          />
                        </div>
                      </MenuItem>
                    ))}
                    <ListSubheader>Actions</ListSubheader>
                    <MenuItem onClick={handleAddUser}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          minHeight: '36.5px',
                        }}
                      >
                        Add Account
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
                        Logout
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
                  <Typography>Log in</Typography>
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
            elevation={2}
            sx={{
              marginTop: `auto`,
              width: '100%',
              borderRadius: 0,
              display: { xs: 'none', md: 'flex' },
            }}
          >
            {' '}
            <Box component="section" sx={{ p: 2 }}>
              <small>{motd}</small>
            </Box>
          </Paper>
          <Box
            sx={{
              overflow: 'hidden',
              Height: '70px',
            }}
          >
            <Paper sx={{ height: '100vh', boxShadow: 'none', borderRadius: 0 }}>
              <List>
                {pages.map((page, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <React.Fragment key={index}>
                    {page.title === 'Settings' ? (
                      <Divider key={`${page.title}-divider`} />
                    ) : null}
                    <ListItem
                      key={page.title}
                      disablePadding
                      sx={{ display: 'block' }}
                      disabled={isDownloading}
                      onClick={() => {
                        if (page.exsternal) {
                          window.electron.ipcRenderer.sendMessage(
                            'openUrl',
                            page.href
                          );
                          return;
                        }
                        if (!isDownloading) navigate(page.href);
                      }}
                    >
                      <ListItemButton>
                        <ListItemIcon>{page.icon}</ListItemIcon>
                        <ListItemText
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
                      ? 'Loading...'
                      : `Updated ${FormatAge(age)}`}
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
