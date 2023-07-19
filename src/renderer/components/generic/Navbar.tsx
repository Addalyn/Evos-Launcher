import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser, useIsAuthenticated, useSignOut } from 'react-auth-kit';
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
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import EvosStore from 'renderer/lib/EvosStore';
import useWindowDimensions from 'renderer/lib/useWindowDimensions';
import { BannerType, logo, logoSmall, playerBanner } from '../../lib/Resources';

type PaletteMode = 'light' | 'dark';

const pages = [
  { title: 'Status', href: '/', icon: <HomeIcon /> },
  { title: 'Settings', href: '/settings', icon: <SettingsIcon /> },
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

  const { toggleMode, age, exePath, ip, gamePort } = evosStore;

  const { width } = useWindowDimensions();

  const drawerWidth = width !== null && width < 916 ? 60 : 240;

  const [anchorUserMenu, setAnchorUserMenu] = useState<null | HTMLElement>(
    null
  );
  const isAuthenticated = useIsAuthenticated();
  const signOut = useSignOut();
  const auth = useAuthUser();
  const navigate = useNavigate();

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorUserMenu(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorUserMenu(null);
  };

  const handleLogOut = () => {
    handleUserMenuClose();
    signOut();
    navigate('/login');
  };

  const handleLaunchGameClick = () => {
    if (exePath.endsWith('AtlasReactor.exe')) {
      const ticketFile = '';
      window.electron.ipcRenderer.sendMessage('launch-game', {
        exePath,
        launchOptions: ['-s', `${ip}:${gamePort}}`, '-t', ticketFile],
      });
    }
  };

  return (
    <>
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
            {isAuthenticated() && (
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  flexGrow: 1,
                  justifyContent: 'flex-end',
                }}
              >
                <Tooltip
                  title={
                    exePath.endsWith('AtlasReactor.exe')
                      ? 'Launch Atlas Reactor'
                      : 'Select your Atlas Reactor Executable in Settings first'
                  }
                >
                  <span>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: (theme) => theme.palette.primary.light,
                      }}
                      disabled={!exePath.endsWith('AtlasReactor.exe')}
                      onClick={handleLaunchGameClick}
                    >
                      Play Atlas Reactor
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
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={handleUserMenu}
                  >
                    <Typography>{auth()?.handle}</Typography>
                    <Avatar
                      alt="Avatar"
                      src={playerBanner(
                        BannerType.foreground,
                        auth()?.banner ?? 65
                      )}
                      sx={{ width: 64, height: 64 }}
                    />
                  </Stack>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorUserMenu}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorUserMenu)}
                    onClose={handleUserMenuClose}
                  >
                    <MenuItem onClick={handleLogOut}>Log out</MenuItem>
                  </Menu>
                </>
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
          <Box
            sx={{
              overflow: 'hidden',
              Height: '70px',
            }}
          >
            <Paper sx={{ height: '100vh', boxShadow: 'none' }}>
              <List>
                {pages.map((page) => (
                  <>
                    {page.title === 'Settings' ? (
                      <Divider key={`${page.title}-devider`} />
                    ) : null}
                    <ListItem
                      key={page.title}
                      disablePadding
                      sx={{ display: 'block' }}
                      onClick={() => {
                        navigate(page.href);
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
                  </>
                ))}
              </List>
            </Paper>
          </Box>
          {location.pathname === '/' && (
            <Paper
              sx={{
                marginTop: `auto`,
                width: '100%',
                display: { xs: 'none', md: 'flex' },
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
