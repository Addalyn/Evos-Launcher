import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Branches,
  changePassword,
  getBranches,
  logout,
} from 'renderer/lib/Evos';
import { isValidExePath, isWarningPath } from 'renderer/lib/Error';

import EvosStore from 'renderer/lib/EvosStore';
import Flag from 'react-flagkit';
import { logoSmall } from 'renderer/lib/Resources';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@aptabase/electron/renderer';

interface Language {
  nativeName: string;
  icon: string;
}

type SelectedArguments = Record<string, string | null>;

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
    mode,
    toggleMode,
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
    enableDiscordRPC,
    toggleDiscordRPC,
    setGameExpanded,
    gameExpanded,
    branch,
    setBranch,
    isDev,
    selectedArguments,
    setSelectedArguments,
    setLocked,
    locked,
  } = EvosStore();

  const [password, setPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [branchesData, setBranchesData] = useState<Branches>();

  // Your state and updater function
  const [selectedArgumentsTemp, setSelectedArgumentsTemp] =
    useState<SelectedArguments>({});

  useEffect(() => {
    const getBranchesInfo = async () => {
      const response = await getBranches();
      const { data }: { data: Branches } = response;
      setBranchesData(data);

      // Set default selected arguments
      const defaultArguments: Record<string, string | null> = {};
      const branchData = data[branch];

      if (branchData) {
        branchData.arguments?.forEach((arg) => {
          if (!arg.showOnlyDev || isDev) {
            defaultArguments[arg.key] =
              selectedArguments[arg.key] || arg.defaultValue || null;
          } else {
            defaultArguments[arg.key] = arg.defaultValue;
          }
        });

        setSelectedArgumentsTemp(defaultArguments);
      }
    };

    getBranchesInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, setBranchesData, setSelectedArguments]);

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

  const handlePasswordResetClick = async (event: {
    preventDefault: () => void;
  }) => {
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
    const checkpasswordchange = await changePassword(
      activeUser?.token ?? '',
      password,
    );

    // Valid password change, log user out
    if (checkpasswordchange.status === 200) {
      signOut();
    } else {
      setError(t('errors.unknownError'));
    }
  };

  const handleChange = (event: { target: { value: any } }) => {
    const selectedValue = event.target.value;
    setIp(selectedValue);
    signOut();
  };

  const handleChangeBranch = (event: { target: { value: any } }) => {
    const selectedValue = event.target.value;
    trackEvent('Branch', {
      branch: selectedValue,
    });
    setBranch(selectedValue);
    setLocked(true);
    if (branchesData) {
      window.electron.ipcRenderer.updateBranch(branchesData[selectedValue]);
    }
  };

  const handleRefresh = () => {
    if (branchesData) {
      setLocked(true);
      window.electron.ipcRenderer.updateBranch(branchesData[branch]);
    }
  };
  const setShowAllChatInternal = (value: string) => {
    setShowAllChat(value);
    window.electron.ipcRenderer.setShowAllChat(value);
  };

  const toggleDiscord = () => {
    if (enableDiscordRPC) {
      window.electron.ipcRenderer.stopDiscord();
    }
    toggleDiscordRPC();
  };

  const handleArgumentChange = (key: string, value: string) => {
    trackEvent('Arguments', {
      [key]: `${activeUser?.handle}: ${value}`,
    });
    setSelectedArgumentsTemp((prevSelected) => ({
      ...prevSelected,
      [key]: value,
    }));
  };

  useEffect(() => {
    setSelectedArguments(selectedArgumentsTemp);
  }, [selectedArgumentsTemp, setSelectedArguments]);

  return (
    <>
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label={t('settings.labelDarkMode')}
                checked={mode === 'dark'}
                onChange={toggleMode}
              />
            </FormGroup>
          </Grid>
          <Grid item xs={4}>
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
          </Grid>
          <Grid item xs={4}>
            <FormGroup>
              <FormControlLabel
                control={<Switch />}
                label={t('settings.labelDiscordRPC')}
                checked={enableDiscordRPC === 'true'}
                onChange={toggleDiscord}
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>
      {branchesData && isValidExePath(exePath) && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Typography variant="caption">
                {t('settings.selectBranchHelper')}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField
                id="branch-select"
                select
                label={t('settings.selectBranch')}
                value={branch}
                onChange={handleChangeBranch}
                variant="outlined"
                disabled={locked}
                fullWidth
              >
                {Object.keys(branchesData).map((key) => {
                  const branchInfo = branchesData[key];
                  if (
                    branchInfo &&
                    (branchInfo.enabled || (isDev && branchInfo.devOnly))
                  ) {
                    return (
                      <MenuItem key={key} value={key}>
                        {key}
                        {branchInfo.version !== ''
                          ? ` (${branchInfo.version})`
                          : ''}
                        {isDev && branchInfo.devOnly ? ' (dev branch)' : ''}
                      </MenuItem>
                    );
                  }
                  return null;
                })}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <Button
                onClick={handleRefresh}
                variant="contained"
                color="primary"
                disabled={locked}
                sx={{
                  width: '100%',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: (theme) => theme.palette.primary.light,
                }}
              >
                {t('settings.refreshBranch')}
              </Button>
            </Grid>
            <Grid item xs={12}>
              {branch &&
                // @ts-ignore
                branchesData &&
                // @ts-ignore
                branchesData[branch] !== undefined &&
                // @ts-ignore
                branchesData[branch]?.arguments !== undefined &&
                // @ts-ignore
                Array.isArray(branchesData[branch]?.arguments) &&
                // @ts-ignore
                branchesData[branch]?.arguments.length > 0 &&
                branchesData[branch].text}
            </Grid>
            <Grid item xs={12}>
              {branch &&
                // @ts-ignore
                branchesData &&
                // @ts-ignore
                branchesData[branch] !== undefined &&
                // @ts-ignore
                branchesData[branch]?.arguments !== undefined &&
                // @ts-ignore
                Array.isArray(branchesData[branch]?.arguments) &&
                // @ts-ignore
                branchesData[branch]?.arguments.length > 0 && (
                  <div>
                    {
                      // @ts-ignore
                      (branchesData[branch]?.arguments.some(
                        (arg) => !arg.showOnlyDev,
                      ) ||
                        isDev) && (
                        <>
                          <span
                            style={{
                              fontSize: '0.8em',
                              marginBottom: '0.5em',
                              display: 'block',
                            }}
                          >
                            {t('settings.arguments')}:
                          </span>
                          {
                            // @ts-ignore
                            branchesData[branch].arguments.map((arg) => {
                              if (arg.showOnlyDev && !isDev) {
                                return null;
                              }
                              return (
                                <TextField
                                  key={arg.key}
                                  select
                                  label={`${arg.key}`}
                                  value={
                                    selectedArguments[arg.key] ??
                                    arg.defaultValue ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    handleArgumentChange(
                                      arg.key,
                                      e.target.value as string,
                                    )
                                  }
                                  helperText={`${arg.description}`}
                                  fullWidth
                                  margin="normal"
                                >
                                  {arg.value.map((value) => (
                                    <MenuItem key={value} value={value}>
                                      {value}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              );
                            })
                          }
                        </>
                      )
                    }
                  </div>
                )}
            </Grid>
            <Grid item xs={12}>
              {branch &&
                // @ts-ignore
                branchesData &&
                // @ts-ignore
                branchesData[branch]?.files && (
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="files-content"
                      id="files-header"
                    >
                      <Typography>{t('Downloaded')}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ul>
                        {// @ts-ignore
                        branchesData[branch]?.files.map((file) => (
                          <li key={file.path}>
                            {file.path}: {file.checksum}
                          </li>
                        ))}
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                )}
            </Grid>
          </Grid>
        </Paper>
      )}
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
                label={t('settings.labelGameExpanded')}
                checked={gameExpanded === 'true'}
                onChange={() => {
                  setGameExpanded(gameExpanded === 'true' ? 'false' : 'true');
                }}
              />
            </FormGroup>
            <span style={{ fontSize: '0.8em' }}>
              {t('settings.GameExpanded')}
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
