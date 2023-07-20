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
} from '@mui/material';
import { logoSmall } from 'renderer/lib/Resources';
import EvosStore from 'renderer/lib/EvosStore';

import { useSignOut } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';

function truncateDynamicPath(filePath: string, maxChars: number) {
  if (filePath === '') return filePath;
  const parts = filePath.split('\\');
  const fileName = parts.pop() as string;
  const driveLetter = parts.shift() as string;

  let truncatedPath = `${driveLetter}:`;
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
    gamePort,
    setGamePort,
    exePath,
    setExePath,
    experimental,
    setExperimental,
  } = EvosStore();
  const [password, setPassword] = useState('');
  const signOut = useSignOut();
  const navigate = useNavigate();

  const handleGamePortChange = (event: { target: { value: string } }) => {
    if (event.target.value === '') {
      setGamePort('6050');
      return;
    }
    setGamePort(event.target.value);
  };

  const handleSelectFileClick = async () => {
    const filePath = await window.electron.ipcRenderer.getSelectedFile();
    setExePath(filePath || '');
  };

  const handleResetClick = () => {
    localStorage.clear();
    signOut();
    navigate('/login');
  };

  const handlePasswordResetClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    signOut();
  };

  return (
    <>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid
          container
          spacing={2}
          sx={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Grid item xs={9}>
            <TextField
              label="Change Password (not implemented yet)"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled
              placeholder="Enter a new password"
              margin="normal"
              type="password"
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                height: '56px',
                marginTop: '8px',
                backgroundColor: (theme) => theme.palette.primary.light,
              }}
              disabled
              onClick={handlePasswordResetClick}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={7}>
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
          <Grid item xs={5}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSelectFileClick}
              fullWidth
              sx={{
                height: '56px',
                backgroundColor: (theme) => theme.palette.primary.light,
              }}
            >
              Select Atlas Reactor.exe
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6}>
            <TextField
              label="IP Address (if you wish to reset this, then reset the application)"
              variant="outlined"
              value={ip}
              disabled
              placeholder="Enter IP address"
              margin="normal"
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Game Port (defaults to 6050)"
              variant="outlined"
              value={gamePort}
              onChange={handleGamePortChange}
              type="number"
              placeholder="Enter game port number"
              margin="normal"
              fullWidth
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label="Enable Experimental Ticketing System, disabling this requires AtlasReactorConfig.json to be created"
                checked={experimental === 'true'}
                onChange={() => {
                  setExperimental(experimental === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
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
