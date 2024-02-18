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
  Alert,
} from '@mui/material';
import { logoSmall } from 'renderer/lib/Resources';
import EvosStore from 'renderer/lib/EvosStore';
import { changePassword, logout } from 'renderer/lib/Evos';
import { useNavigate } from 'react-router-dom';
import { isValidExePath, isWarningPath } from 'renderer/lib/Error';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const signOut = () => {
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

  const handleSelectFileClick = async (config: boolean) => {
    const filePath = await window.electron.ipcRenderer.getSelectedFile(config);
    if (config) {
      updateAuthenticatedUsers(
        activeUser?.user as string,
        activeUser?.token as string,
        activeUser?.handle as string,
        activeUser?.banner as number,
        (filePath as string) || ('' as string),
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
      setError(t('errors.errorPassMatch'));
      return;
    }
    if (password.length < 5) {
      setError(t('errors.errorPass'));
      return;
    }
    if (password.length > 20) {
      setError(t('errors.errorPass2'));
      return;
    }
    if (password.includes(' ')) {
      setError(t('errors.errorPassSpace'));
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
              label={t('changePassword')}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enterNewPass')}
              margin="normal"
              type="password"
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label={t('confirmPassword')}
              variant="outlined"
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              placeholder={t('enterNewPass')}
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
              {t('submit')}
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
                placeholder={`${t('settings.configFilePlaceHolder')} ${activeUser?.handle}`}
                value={truncateDynamicPath(
                  activeUser?.configFile === undefined
                    ? ''
                    : activeUser?.configFile,
                  45,
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
                {t('settings.selectConfigFile')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          {!isValidExePath(exePath) && (
            <Grid item xs={12}>
              <Alert
                severity="error"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <span>
                  {t('errors.invalidPath')}
                  <br />
                  {t('errors.invalidPath1')}
                  <ul>
                    <li>{t('errors.invalidPath2')}</li>
                    <li>
                      {t('errors.invalidPath3')}
                      <br />
                      {t('errors.invalidPath4')}
                    </li>
                    <li>{t('errors.invalidPath5')}</li>
                  </ul>
                </span>
              </Alert>
            </Grid>
          )}
          {isWarningPath(exePath) && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <span>
                  {t('warning')}
                  <br />
                  {t('errors.invalidPath1')}
                  <ul>
                    <li>
                      {t('errors.invalidPath6')}
                      <br />
                      {t('errors.invalidPath7')}
                    </li>
                  </ul>
                </span>
              </Alert>
            </Grid>
          )}
          <Grid item xs={6}>
            <TextField
              placeholder={t('settings.atlasPath')}
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
              {t('settings.selectAtllasExe')}
            </Button>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={t('settings.tooltipTitleSteam')}>
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
                {t('search')}
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
                <MenuItem value="evos-emu.com">{t('ips.noProxy')}</MenuItem>
                <MenuItem value="de.evos.live">{t('ips.proxy1')}</MenuItem>
                <MenuItem value="fr.evos.live">{t('ips.proxy2')}</MenuItem>
                <MenuItem value="fi.evos.live">{t('ips.proxy3')}</MenuItem>
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
                label={t('settings.labelTicket')}
                checked={ticketEnabled === 'true'}
                onChange={() => {
                  setTicketEnabled(ticketEnabled === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              {t('settings.labelTicketDisabled')}
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
                label={t('settings.allChatLabel')}
                checked={showAllChat === 'true'}
                onChange={() => {
                  setShowAllChatInternal(
                    showAllChat === 'true' ? 'false' : 'true',
                  );
                }}
              />{' '}
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              {t('settings.allChatLabelDisabled')}
              <br />
              {t('settings.allChatLabelDisabled2')}
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
                label={t('settings.autoPatchingLabel')}
                checked={false} // {enablePatching === 'true'}
                disabled // Only for christmas we need it next year!
                onChange={() => {
                  setEnablePatching(
                    enablePatching === 'true' ? 'false' : 'true',
                  );
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              {t('settings.autoPatchingLabelDisabled')}
              <br />
              {t('settings.autoPatchingLabelDisabled2')}
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
                label={t('settings.noLogLaunchOptionsLabel')}
                checked={noLogEnabled === 'true'}
                onChange={() => {
                  setNoLogEnabled(noLogEnabled === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              {t('settings.noLogLaunchOptionsDisabled')}
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
              {t('settings.deleteAllAccounts')}
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
              {t('settings.resetApp')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
