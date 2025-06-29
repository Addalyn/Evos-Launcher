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
  SelectChangeEvent,
  Skeleton,
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
import { useEffect, useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@aptabase/electron/renderer';
import { MuiColorInput } from 'mui-color-input';
import { withElectron } from 'renderer/utils/electronUtils';

/**
 * Interface for language configuration
 */
interface Language {
  /** Native name of the language */
  nativeName: string;
  /** Country code icon for the language */
  icon: string;
}

/**
 * Type for selected command line arguments
 */
type SelectedArguments = Record<string, string | null>;

/**
 * Language configuration mapping country codes to language information
 */
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

/**
 * SettingsPage component provides a comprehensive settings interface for the EVOS Launcher
 * including theme customization, game configuration, server selection, and account management
 * @returns React functional component for the settings page
 */
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

  /** Password input for password change */
  const [password, setPassword] = useState('');
  /** Password confirmation input for password change */
  const [password1, setPassword1] = useState('');
  /** Error message state for form validation */
  const [error, setError] = useState('');
  /** Search result message state */
  const [searchMessage, setSearchMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });
  /** React Router navigation hook */
  const navigate = useNavigate();
  /** i18n translation hook */
  const { t, i18n } = useTranslation();
  /** Available branches data from the API */
  const [branchesData, setBranchesData] = useState<Branches>();

  /** Temporary state for selected arguments before applying changes */
  const [selectedArgumentsTemp, setSelectedArgumentsTemp] =
    useState<SelectedArguments>({});

  /**
   * Effect hook to fetch branches data and set default arguments when component mounts or branch changes
   */
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

  /**
   * Signs out the current user and navigates to login page
   */
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

  /**
   * Handles file selection for game executable or config file
   * @param config - Whether this is for config file (true) or game executable (false)
   */
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

  /**
   * Searches for the game installation automatically (typically via Steam)
   */
  const handleSearch = async () => {
    // Clear previous search messages
    setSearchMessage({ type: null, text: '' });

    try {
      const filePath = await withElectron(
        (electron) => electron.ipcRenderer.searchForGame(),
        null,
      );

      if (filePath === null) {
        // Search completed but no game found
        setSearchMessage({
          type: 'error',
          text: t(
            'settings.gameNotFound',
            'Game not found. Please select manually or ensure Atlas Reactor is installed via Steam.',
          ),
        });
        return;
      }

      // Game found successfully - path validation will automatically clear any errors
      setExePath(filePath || '');
      setSearchMessage({
        type: 'success',
        text: t('settings.gameFoundSuccess', 'Game found successfully!'),
      });

      // Auto-hide success message after 3 seconds
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
    } catch (searchError) {
      // Error handling for search operation
      setSearchMessage({
        type: 'error',
        text: t(
          'settings.searchError',
          'An error occurred while searching for the game.',
        ),
      });
    }
  };

  /**
   * Resets the entire application by clearing all stored data and logging out all users
   */
  const handleResetClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    withElectron((electron) => electron.store.clear());
    setTimeout(() => {
      navigate('/login');
      window.location.reload();
    }, 500);
  };

  /**
   * Deletes all user accounts from storage
   */
  const handleDeleteClick = () => {
    authenticatedUsers.forEach(async (user) => {
      await logout(user.token);
    });
    withElectron((electron) => electron.store.removeItem('authenticatedUsers'));
    setTimeout(() => {
      withElectron((electron) => electron.store.removeItem('activeUser'));
      navigate('/login');
      window.location.reload();
    }, 500);
  };

  /**
   * Handles password reset form submission with validation
   * @param event - Form submit event
   */
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

  /**
   * Handles server IP selection change
   * @param event - Select change event
   */
  const handleChange = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    setIp(selectedValue);
    signOut();
  };

  /**
   * Handles branch selection change
   * @param event - TextField change event for select variant
   */
  const handleChangeBranch = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const selectedValue = event.target.value;
    trackEvent('Branch', {
      branch: selectedValue,
    });
    setBranch(selectedValue);
    setLocked(true);
    if (branchesData) {
      withElectron((electron) =>
        electron.ipcRenderer.updateBranch(branchesData[selectedValue]),
      );
    }
  };

  /**
   * Refreshes the current branch data and updates the branch files
   */
  const handleRefresh = () => {
    if (branchesData) {
      setLocked(true);
      withElectron((electron) =>
        electron.ipcRenderer.updateBranch(branchesData[branch]),
      );
    }
  };

  /**
   * Sets the show all chat option and communicates with the main process
   * @param value - String value ('true' or 'false')
   */
  const setShowAllChatInternal = (value: string) => {
    setShowAllChat(value);
    withElectron((electron) => electron.ipcRenderer.setShowAllChat(value));
  };

  /**
   * Toggles Discord Rich Presence functionality
   */
  const toggleDiscord = () => {
    if (enableDiscordRPC) {
      withElectron((electron) => electron.ipcRenderer.stopDiscord());
    }
    toggleDiscordRPC();
  };

  /**
   * Handles command line argument changes for the selected branch
   * @param key - The argument key
   * @param value - The argument value
   */
  const handleArgumentChange = (key: string, value: string) => {
    trackEvent('Arguments', {
      [key]: `${activeUser?.handle}: ${value}`,
    });
    setSelectedArgumentsTemp((prevSelected) => ({
      ...prevSelected,
      [key]: value,
    }));
  };

  /**
   * Effect hook to sync temporary selected arguments with the global state
   */
  useEffect(() => {
    setSelectedArguments(selectedArgumentsTemp);
  }, [selectedArgumentsTemp, setSelectedArguments]);

  /**
   * Handles primary color change
   * @param sitecolor - The new primary color value
   */
  const handleChangeColorPrimary = (sitecolor: string) => {
    setColorPrimary(sitecolor);
  };
  /**
   * Handles secondary color change
   * @param sitecolor - The new secondary color value
   */
  const handleChangeColorSecondary = (sitecolor: string) => {
    setColorSecondary(sitecolor);
  };
  /**
   * Handles background color change
   * @param sitecolor - The new background color value
   */
  const handleChangeColorBackground = (sitecolor: string) => {
    setColorBackground(sitecolor);
  };
  /**
   * Handles text color change
   * @param sitecolor - The new text color value
   */
  const handleChangeColorText = (sitecolor: string) => {
    setColorText(sitecolor);
  };
  /**
   * Handles scrollbar color change
   * @param sitecolor - The new scrollbar color value
   */
  const handleChangeColorScrollBar = (sitecolor: string) => {
    setColorScrollBar(sitecolor);
  };

  /**
   * Handles paper color change
   * @param sitecolor - The new paper color value
   */
  const handleChangeColorPaper = (sitecolor: string) => {
    setColorPaper(sitecolor);
  };

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
          <Grid item xs={4}>
            <MuiColorInput
              value={colorPrimary}
              onChange={handleChangeColorPrimary}
              fallbackValue="#9cb8ba"
              format="hex"
              label={t('settings.labelPrimaryColor')}
            />
          </Grid>
          <Grid item xs={4}>
            <MuiColorInput
              value={colorSecondary}
              onChange={handleChangeColorSecondary}
              fallbackValue="#000000"
              format="hex"
              label={t('settings.labelSecondaryColor')}
            />
          </Grid>
          <Grid item xs={4}>
            <MuiColorInput
              value={colorPaper}
              onChange={handleChangeColorPaper}
              fallbackValue="#ffffff"
              format="hex"
              label={t('settings.labelPaperColor')}
            />
          </Grid>
          <Grid item xs={4}>
            <MuiColorInput
              value={colorBackground}
              onChange={handleChangeColorBackground}
              fallbackValue="#000000fc"
              format="hex8"
              label={t('settings.labelBackgroundColor')}
            />
          </Grid>
          <Grid item xs={4}>
            <MuiColorInput
              value={colorText}
              onChange={handleChangeColorText}
              fallbackValue="#fffffffc"
              format="hex8"
              label={t('settings.labelTextColor')}
            />
          </Grid>
          <Grid item xs={4}>
            <MuiColorInput
              value={colorScrollBar}
              onChange={handleChangeColorScrollBar}
              fallbackValue="#ffffff"
              format="hex"
              label={t('settings.labelScrollbarColor')}
            />
          </Grid>
        </Grid>
      </Paper>
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
          {searchMessage.type && (
            <Grid item xs={12}>
              <Alert
                severity={searchMessage.type}
                sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
              >
                {searchMessage.text}
              </Alert>
            </Grid>
          )}
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
      {!branchesData && isValidExePath(exePath) && (
        <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Skeleton variant="rectangular" width="100%" height={350} />
            </Grid>
          </Grid>
        </Paper>
      )}
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
                branchesData &&
                branchesData[branch] !== undefined &&
                branchesData[branch]?.arguments !== undefined &&
                Array.isArray(branchesData[branch]?.arguments) &&
                (branchesData[branch]?.arguments?.length ?? 0) > 0 &&
                branchesData[branch]?.text}
            </Grid>
            <Grid item xs={12}>
              {branch &&
                branchesData &&
                branchesData[branch] !== undefined &&
                branchesData[branch]?.arguments !== undefined &&
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
                        })}
                      </>
                    )}
                  </div>
                )}
            </Grid>
            <Grid item xs={12}>
              {branch && branchesData && branchesData[branch]?.files && (
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
        </Paper>
      )}
      <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth>
              <Select value={ip} onChange={handleChange}>
                <MenuItem value="evos-emu.com">{t('ips.noProxy')}</MenuItem>
                <MenuItem value="de.evos.live">{t('ips.proxy1')}</MenuItem>
                <MenuItem value="fr.evos.live">{t('ips.proxy2')}</MenuItem>
                <MenuItem value="fi.evos.live">{t('ips.proxy3')}</MenuItem>
                <MenuItem value="ru.ar.zheneq.net">{t('ips.proxy4')}</MenuItem>
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
