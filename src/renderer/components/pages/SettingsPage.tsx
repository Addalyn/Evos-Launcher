import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  Branches,
  changePassword,
  getBranches,
  logout,
} from 'renderer/lib/Evos';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { isElectronApp, withElectron } from 'renderer/utils/electronUtils';
import { isValidExePath, isWarningPath } from 'renderer/lib/Error';

import EvosStore from 'renderer/lib/EvosStore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Flag from 'react-flagkit';
import { MuiColorInput } from 'mui-color-input';
import { logoSmall } from 'renderer/lib/Resources';
import { trackEvent } from '@aptabase/electron/renderer';
import useDevStatus from 'renderer/lib/useDevStatus';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Modern, clean, and modular redesign of the Settings Page for Evos Launcher.
 * This is a skeleton for you to fill in with your logic and state hooks.
 */
const lngs: { [key: string]: { nativeName: string; icon: string } } = {
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

type SelectedArguments = Record<string, string | null>;
/**
 * Truncates a file path to fit within a specified character limit while preserving
 * the drive letter, filename, and maintaining readability with ellipsis for middle sections
 * @param filePath - The full file path to truncate (can be null, undefined, or empty)
 * @param maxChars - Maximum number of characters allowed
 * @returns Truncated file path string
 */
export function truncateDynamicPath(
  filePath: string | null | undefined,
  maxChars: number,
): string {
  if (!filePath || filePath === '' || typeof filePath !== 'string') return '';

  try {
    const parts = filePath.split('\\');
    const fileName = parts.pop();
    const driveLetter = parts.shift();
    // Additional safety checks
    if (!fileName || !driveLetter) return filePath;

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
  } catch (error) {
    // If any error occurs during path processing, return empty string
    return '';
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();

  // Sync dev status to global store
  useDevStatus();
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
    colorPrimary,
    setColorPrimary,
    colorSecondary,
    setColorSecondary,
    colorBackground,
    setColorBackground,
    colorText,
    setColorText,
    colorScrollBar,
    setColorScrollBar,
    colorPaper,
    setColorPaper,
  } = EvosStore();

  const isElectron = isElectronApp();

  // Debug isDev value
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('SettingsPage isDev:', isDev);
  }, [isDev]);

  const [password, setPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [error, setError] = useState('');
  const [searchMessage, setSearchMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });
  const { t, i18n } = useTranslation();
  const [branchesData, setBranchesData] = useState<Branches>();
  const [selectedArgumentsTemp, setSelectedArgumentsTemp] =
    useState<SelectedArguments>({});

  useEffect(() => {
    const getBranchesInfo = async () => {
      const response = await getBranches();
      const { data }: { data: Branches } = response;
      setBranchesData(data);
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
    const filePath = await withElectron(
      (electron) => electron.ipcRenderer.getSelectedFile(config),
      null,
    );
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
    if (branchesData && filePath) {
      setLocked(true);
      setTimeout(() => {
        withElectron((electron) =>
          electron.ipcRenderer.updateBranch(branchesData[branch]),
        );
      }, 1000);
    }
  };

  const handleSearch = async () => {
    setSearchMessage({ type: null, text: '' });
    try {
      const filePath = await withElectron(
        (electron) => electron.ipcRenderer.searchForGame(),
        null,
      );
      if (filePath === null) {
        setSearchMessage({
          type: 'error',
          text: t(
            'settings.gameNotFound',
            'Game not found. Please select manually or ensure Atlas Reactor is installed via Steam.',
          ),
        });
        return;
      }
      setExePath(filePath || '');
      setSearchMessage({
        type: 'success',
        text: t('settings.gameFoundSuccess', 'Game found successfully!'),
      });
      setTimeout(() => {
        setSearchMessage({ type: null, text: '' });
      }, 3000);
      if (branchesData && filePath) {
        setLocked(true);
        setTimeout(() => {
          withElectron((electron) =>
            electron.ipcRenderer.updateBranch(branchesData[branch]),
          );
        }, 1000);
      }
    } catch {
      setSearchMessage({
        type: 'error',
        text: t(
          'settings.searchError',
          'An error occurred while searching for the game.',
        ),
      });
    }
  };

  const handleResetClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    withElectron((electron) => electron.store.clear());
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };

  const handleDeleteClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    withElectron((electron) => electron.store.removeItem('authenticatedUsers'));
    setTimeout(() => {
      withElectron((electron) => electron.store.removeItem('activeUser'));
      navigate('/login');
    }, 500);
  };

  const handlePasswordResetClick = async (event: React.FormEvent) => {
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
    if (checkpasswordchange.status === 200) {
      signOut();
    } else {
      setError(t('errors.unknownError'));
    }
  };

  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    signOut();
    setIp(selectedValue);
  };

  const handleChangeBranch = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const selectedValue = event.target.value;
    trackEvent('Branch', { branch: selectedValue });
    setBranch(selectedValue);
    setLocked(true);
    if (branchesData) {
      withElectron((electron) =>
        electron.ipcRenderer.updateBranch(branchesData[selectedValue]),
      );
    }
  };

  const handleRefresh = () => {
    if (branchesData) {
      setLocked(true);
      withElectron((electron) =>
        electron.ipcRenderer.updateBranch(branchesData[branch]),
      );
    }
  };

  const setShowAllChatInternal = (value: string) => {
    setShowAllChat(value);
    withElectron((electron) => electron.ipcRenderer.setShowAllChat(value));
  };

  const toggleDiscord = () => {
    if (enableDiscordRPC) {
      withElectron((electron) => electron.ipcRenderer.stopDiscord());
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

  const handleChangeColorPrimary = (sitecolor: string) =>
    setColorPrimary(sitecolor);
  const handleChangeColorSecondary = (sitecolor: string) =>
    setColorSecondary(sitecolor);
  const handleChangeColorBackground = (sitecolor: string) =>
    setColorBackground(sitecolor);
  const handleChangeColorText = (sitecolor: string) => setColorText(sitecolor);
  const handleChangeColorScrollBar = (sitecolor: string) =>
    setColorScrollBar(sitecolor);
  const handleChangeColorPaper = (sitecolor: string) =>
    setColorPaper(sitecolor);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            m: { xs: '1em' },
            overflow: 'hidden',
            minWidth: 320,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('settings.appearance', 'Appearance')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormGroup>
            <FormControlLabel
              control={<Switch />}
              label={t('settings.labelDarkMode')}
              checked={mode === 'dark'}
              onChange={toggleMode}
            />
          </FormGroup>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelPrimaryColor')}
                  value={colorPrimary}
                  onChange={handleChangeColorPrimary}
                  fallbackValue="#9cb8ba"
                  format="hex"
                />
              </Grid>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelSecondaryColor')}
                  value={colorSecondary}
                  onChange={handleChangeColorSecondary}
                  fallbackValue="#000000"
                  format="hex"
                />
              </Grid>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelBackgroundColor')}
                  value={colorBackground}
                  onChange={handleChangeColorBackground}
                  fallbackValue="#000000fc"
                  format="hex8"
                />
              </Grid>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelTextColor')}
                  value={colorText}
                  onChange={handleChangeColorText}
                  fallbackValue="#fffffffc"
                  format="hex8"
                />
              </Grid>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelPaperColor')}
                  value={colorPaper}
                  onChange={handleChangeColorPaper}
                  fallbackValue="#ffffff"
                  format="hex"
                />
              </Grid>
              <Grid item xs={6}>
                <MuiColorInput
                  label={t('settings.labelScrollbarColor')}
                  value={colorScrollBar}
                  onChange={handleChangeColorScrollBar}
                  fallbackValue="#ffffff"
                  format="hex"
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            m: { xs: '1em' },
            overflow: 'hidden',
            minWidth: 320,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('settings.language', 'Language')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Select
            fullWidth
            value={i18n.language ? i18n.language : lngs.en.nativeName}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            {Object.keys(lngs).map((lng) => (
              <MenuItem value={lng} key={lng}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Flag country={lngs[lng].icon} size={20} />
                  <span style={{ marginLeft: 8 }}>{lngs[lng].nativeName}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </Paper>
        {isElectron && (
          <>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                m: { xs: '1em' },
                overflow: 'hidden',
                minWidth: 320,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.account', 'Account')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <form onSubmit={handlePasswordResetClick}>
                <TextField
                  label={t('changePassword')}
                  type="password"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterNewPass')}
                />
                <TextField
                  label={t('confirmPassword')}
                  type="password"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={password1}
                  onChange={(e) => setPassword1(e.target.value)}
                  placeholder={t('enterNewPass')}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  {t('submit')}
                </Button>
                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </form>
            </Paper>

            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                m: { xs: '1em' },
                overflow: 'hidden',
                minWidth: 320,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.gamePath', 'Game Path')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {searchMessage.type && (
                <Alert severity={searchMessage.type} sx={{ mb: 2 }}>
                  {searchMessage.text}
                </Alert>
              )}
              {!isValidExePath(exePath) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {t('errors.invalidPath')}
                </Alert>
              )}
              {isWarningPath(exePath) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {t('warning')}
                </Alert>
              )}
              <TextField
                label={t('settings.atlasPath')}
                fullWidth
                sx={{ mb: 2 }}
                disabled
                value={truncateDynamicPath(exePath, 45)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Avatar
                        alt="logo"
                        variant="square"
                        src={logoSmall()}
                        sx={{ width: 40, height: 40 }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleSelectFileClick(false)}
                  >
                    {t('settings.selectAtllasExe')}
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="contained" fullWidth onClick={handleSearch}>
                    {t('search')}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
        {ticketEnabled === 'false' && isElectron && (
          <Paper
            elevation={6}
            sx={{
              p: { xs: 3, sm: 4 },
              m: { xs: '1em' },
              overflow: 'hidden',
              minWidth: 320,
              mx: 'auto',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {t('settings.configFile', 'Config File')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TextField
              placeholder={`${t('settings.configFilePlaceHolder')} ${activeUser?.handle}`}
              value={truncateDynamicPath(
                activeUser?.configFile === undefined
                  ? ''
                  : activeUser?.configFile,
                45,
              )}
              variant="outlined"
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Avatar
                      alt="logo"
                      variant="square"
                      src={logoSmall()}
                      sx={{ width: 40, height: 40 }}
                    />
                  </InputAdornment>
                ),
              }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSelectFileClick(true)}
              fullWidth
            >
              {t('settings.selectConfigFile')}
            </Button>
          </Paper>
        )}
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            m: { xs: '1em' },
            overflow: 'hidden',
            minWidth: 320,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('settings.server', 'Server')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <Select value={ip} onChange={handleChange}>
              <MenuItem value="evos-emu.com">{t('ips.noProxy')}</MenuItem>
              <MenuItem value="de.evos.live">{t('ips.proxy1')}</MenuItem>
              <MenuItem value="fr.evos.live">{t('ips.proxy2')}</MenuItem>
              <MenuItem value="fi.evos.live">{t('ips.proxy3')}</MenuItem>
              <MenuItem value="ru.ar.zheneq.net">{t('ips.proxy4')}</MenuItem>
            </Select>
          </FormControl>
        </Paper>
        {isElectron && (
          <>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                m: { xs: '1em' },
                overflow: 'hidden',
                minWidth: 320,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.advanced', 'Advanced')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormGroup>
                <FormControlLabel
                  control={<Switch />}
                  label={t('settings.labelDiscordRPC')}
                  checked={enableDiscordRPC === 'true'}
                  onChange={toggleDiscord}
                />
                <FormControlLabel
                  control={<Switch />}
                  label={t('settings.allChatLabel')}
                  checked={showAllChat === 'true'}
                  onChange={() =>
                    setShowAllChatInternal(
                      showAllChat === 'true' ? 'false' : 'true',
                    )
                  }
                />
                <FormControlLabel
                  control={<Switch />}
                  label={t('settings.labelGameExpanded')}
                  checked={gameExpanded === 'true'}
                  onChange={() =>
                    setGameExpanded(gameExpanded === 'true' ? 'false' : 'true')
                  }
                />
                <FormControlLabel
                  control={<Switch />}
                  label={t('settings.labelTicket')}
                  checked={ticketEnabled === 'true'}
                  onChange={() =>
                    setTicketEnabled(
                      ticketEnabled === 'true' ? 'false' : 'true',
                    )
                  }
                />
                <FormControlLabel
                  control={<Switch />}
                  label={t('settings.noLogLaunchOptionsLabel')}
                  checked={noLogEnabled === 'true'}
                  onChange={() =>
                    setNoLogEnabled(noLogEnabled === 'true' ? 'false' : 'true')
                  }
                />
              </FormGroup>
            </Paper>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, sm: 4 },
                m: { xs: '1em' },
                overflow: 'hidden',
                minWidth: 320,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('settings.branch', 'Branch')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {!branchesData && isValidExePath(exePath) && (
                <Skeleton variant="rectangular" width="100%" height={350} />
              )}
              {branchesData && isValidExePath(exePath) && (
                <>
                  <Typography variant="caption">
                    {t('settings.selectBranchHelper')}
                  </Typography>
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    sx={{ mt: 1 }}
                  >
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
                            (branchInfo.enabled ||
                              (isDev && branchInfo.devOnly))
                          ) {
                            return (
                              <MenuItem
                                key={key}
                                value={key}
                                disabled={branchInfo.disabled}
                              >
                                {key}
                                {branchInfo.version !== ''
                                  ? ` (${branchInfo.version})`
                                  : ''}
                                {branchInfo.recommended
                                  ? ` (${t('settings.recommended')})`
                                  : ''}
                                {branchInfo.removed
                                  ? ` (${t('settings.removed')})`
                                  : ''}
                                {isDev && branchInfo.devOnly
                                  ? ' (dev branch)'
                                  : ''}
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
                        fullWidth
                      >
                        {t('settings.refreshBranch')}
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      {branch &&
                        branchesData &&
                        branchesData[branch]?.arguments &&
                        Array.isArray(branchesData[branch]?.arguments) &&
                        (branchesData[branch]?.arguments?.length ?? 0) > 0 &&
                        branchesData[branch]?.text}
                    </Grid>
                    <Grid item xs={12}>
                      {branch &&
                        branchesData &&
                        branchesData[branch]?.arguments &&
                        Array.isArray(branchesData[branch]?.arguments) &&
                        (branchesData[branch]?.arguments?.length ?? 0) > 0 && (
                          <div>
                            {(branchesData[branch]?.arguments?.some(
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
                                {branchesData[branch]?.arguments?.map((arg) => {
                                  if (arg.showOnlyDev && !isDev) return null;
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
                                })}
                              </>
                            )}
                          </div>
                        )}
                    </Grid>
                    <Grid item xs={12}>
                      {branch &&
                        branchesData &&
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
                                {branchesData[branch]?.files.map((file) => (
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
                </>
              )}
            </Paper>
          </>
        )}
        <Paper
          elevation={6}
          sx={{
            p: { xs: 3, sm: 4 },
            m: { xs: '1em' },
            overflow: 'hidden',
            minWidth: 320,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {t('settings.dangerZone', 'Danger Zone')}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={handleDeleteClick}
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
              >
                {t('settings.resetApp')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
