import { useState } from 'react';

import {
  Avatar,
  Button,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { logoSmall } from 'renderer/lib/Resources';
import EvosStore from 'renderer/lib/EvosStore';
import { changePassword, logout } from 'renderer/lib/Evos';
import { useNavigate } from 'react-router-dom';

export function truncateDynamicPath(filePath: string, maxChars: number) {
  if (filePath === '') return filePath;
  const parts = filePath.split('\\');
  const fileName = parts.pop() as string;
  const driveLetter = parts.shift() as string;

  let truncatedPath = `${driveLetter}`;
  let currentChars = driveLetter.length + 1 + fileName.length;

  parts.reduce((acc, part) => {
    if (currentChars + part.length + 1 <= maxChars) {
      truncatedPath = `${acc}\\${part}`;
      currentChars += part.length + 1;
    } else if (!truncatedPath.endsWith('\\.....')) {
      truncatedPath += '\\.....';
    }
    return truncatedPath;
  }, driveLetter);

  return `${truncatedPath}\\${fileName}`;
}

export default function SettingsPage() {
  const {
    ip,
    exePath,
    setExePath,
    ticketEnabled,
    setTicketEnabled,
    noLogEnabled,
    setNoLogEnabled,
    activeUser,
    updateAuthenticatedUsers,
    authenticatedUsers,
    setIp,
    showAllChat,
    setShowAllChat,
    enablePatching,
    setEnablePatching,
  } = EvosStore();

  const [password, setPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const signOut = () => {
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

  const handleSelectFileClick = async (config: boolean) => {
    const filePath = await window.electron.ipcRenderer.getSelectedFile(config);
    if (config) {
      updateAuthenticatedUsers(
        activeUser?.user as string,
        activeUser?.token as string,
        activeUser?.handle as string,
        activeUser?.banner as number,
        (filePath as string) || ('' as string)
      );
      return;
    }
    setExePath(filePath || '');
  };

  const handleSearch = async () => {
    const filePath = await window.electron.ipcRenderer.searchForGame();
    if (filePath === null) {
      return;
    }
    setExePath(filePath || '');
  };

  const handleResetClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    window.electron.store.clear();
    setTimeout(() => {
      navigate('/login');
      window.location.reload();
    }, 500);
  };

  const handleDeleteClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    window.electron.store.removeItem('authenticatedUsers');
    setTimeout(() => {
      window.electron.store.removeItem('activeUser');
      navigate('/login');
      window.location.reload();
    }, 500);
  };

  const handlePasswordResetClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (password !== password1) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password.length > 20) {
      setError('Password must be less than 20 characters');
      return;
    }
    if (password.includes(' ')) {
      setError('Password cannot contain spaces');
      return;
    }
    setError('');
    changePassword(activeUser?.token ?? '', password);
    signOut();
  };

  const handleChange = (event: { target: { value: any } }) => {
    const selectedValue = event.target.value;
    setIp(selectedValue);
    signOut();
  };

  const setShowAllChatInternal = (value: string) => {
    setShowAllChat(value);
    window.electron.ipcRenderer.setShowAllChat(value);
  };

  return (
    <>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid
          container
          spacing={2}
          sx={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Grid item xs={4}>
            <TextField
              label="Change Password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a new password"
              margin="normal"
              type="password"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Confirm Password"
              variant="outlined"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              placeholder="Enter a new password"
              margin="normal"
              type="password"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                height: '56px',
                marginTop: '8px',
                backgroundColor: (theme) => theme.palette.primary.light,
              }}
              onClick={handlePasswordResetClick}
            >
              Submit
            </Button>
          </Grid>
          {error !== '' && (
            <Grid item xs={12}>
              <span style={{ color: 'red' }}>{error}</span>
            </Grid>
          )}
        </Grid>
      </Paper>
      {ticketEnabled === 'false' && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={7}>
              <TextField
                placeholder={`Atlas Reactor config file for account ${activeUser?.handle}`}
                value={truncateDynamicPath(
                  activeUser?.configFile === undefined
                    ? ''
                    : activeUser?.configFile,
                  45
                )}
                style={{ flexGrow: 1, marginRight: '1em' }}
                variant="outlined"
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Avatar
                        alt="logo"
                        variant="square"
                        src={logoSmall()}
                        sx={{
                          flexShrink: 1,
                          width: 40,
                          height: 40,
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={5}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSelectFileClick(true)}
                fullWidth
                sx={{
                  height: '56px',
                  backgroundColor: (theme) => theme.palette.primary.light,
                }}
              >
                Select Config File
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <TextField
              placeholder="Atlas Reactor path"
              value={truncateDynamicPath(exePath, 45)}
              style={{ flexGrow: 1, marginRight: '1em' }}
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Avatar
                      alt="logo"
                      variant="square"
                      src={logoSmall()}
                      sx={{
                        flexShrink: 1,
                        width: 40,
                        height: 40,
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSelectFileClick(false)}
              fullWidth
              sx={{
                height: '56px',
                backgroundColor: (theme) => theme.palette.primary.light,
              }}
            >
              Select Atlas Reactor.exe
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title="Only works if you have the game already installed in steam">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSearch()}
                fullWidth
                sx={{
                  height: '56px',
                  backgroundColor: (theme) => theme.palette.primary.light,
                }}
              >
                Search
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth>
              <Select value={ip} onChange={handleChange}>
                <MenuItem value="evos-emu.com">
                  evos-emu.com (No Proxy)
                </MenuItem>
                <MenuItem value="arproxy.addalyn.baby">
                  evos-emu.com (Proxy in Germany)
                </MenuItem>
                <MenuItem value="arproxy2.addalyn.baby">
                  evos-emu.com (Proxy in France)
                </MenuItem>
                <MenuItem value="arproxy3.addalyn.baby">
                  evos-emu.com (Proxy in Finland)
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label="Enable Ticket System (Recommended)"
                checked={ticketEnabled === 'true'}
                onChange={() => {
                  setTicketEnabled(ticketEnabled === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              disabling this requires AtlasReactorConfig.json to be selected and
              created (not recommended)
            </span>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label="Activate All Chat (Recommended) (applies before game launch)"
                checked={showAllChat === 'true'}
                onChange={() => {
                  setShowAllChatInternal(
                    showAllChat === 'true' ? 'false' : 'true'
                  );
                }}
              />{' '}
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              Disabling this feature will prevent you from viewing any in-game
              chat. It is not advisable, as it may cause you to miss important
              messages, such as announcements about remakes made in all chat.
              <br />
              When you disable/enable all chat in game, it will just be reset
              back to whatever this setting is.
            </span>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label="Enable Auto Patching (Recommended)"
                checked={enablePatching === 'true'}
                onChange={() => {
                  setEnablePatching(
                    enablePatching === 'true' ? 'false' : 'true'
                  );
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              Disable this only if you are experiencing issues with patching
              files
              <br />
              You will need to manually patch the game, info can be found in
              discord
            </span>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label="Add -nolog to launch options"
                checked={noLogEnabled === 'true'}
                onChange={() => {
                  setNoLogEnabled(noLogEnabled === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              If you&apos;re experiencing crashes across multiple accounts,
              consider trying this solution. Keep in mind, though, that while it
              might help alleviate the issue, there&apos;s also a chance it
              could potentially exacerbate the problem and lead to further
              crashes, especially if you do not use multiple accounts.
            </span>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleDeleteClick}
              sx={{ height: '56px' }}
            >
              Delete All Accounts (this will log you out)
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleResetClick}
              sx={{ height: '56px' }}
            >
              Reset Application (this will log you out)
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
