import { Box, Grid, Tab, Tabs, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PaletteIcon from '@mui/icons-material/Palette';
import PersonIcon from '@mui/icons-material/Person';
import DnsIcon from '@mui/icons-material/Dns';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Branches,
  changePassword,
  getBranches,
  logout,
} from 'renderer/lib/Evos';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { isElectronApp, withElectron } from 'renderer/utils/electronUtils';
import EvosStore from 'renderer/lib/EvosStore';
import { trackEvent } from '@aptabase/electron/renderer';
import useDevStatus from 'renderer/lib/useDevStatus';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppearanceSection from '../settings/AppearanceSection';
import LanguageSection from '../settings/LanguageSection';
import AccountSection from '../settings/AccountSection';
import GamePathSection from '../settings/GamePathSection';
import ConfigFileSection from '../settings/ConfigFileSection';
import ServerSection from '../settings/ServerSection';
import AdvancedSection from '../settings/AdvancedSection';
import BranchSection from '../settings/BranchSection';
import DangerZoneSection from '../settings/DangerZoneSection';
import { logoSmall } from 'renderer/lib/Resources';

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

export default function SettingsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const isIconOnly = useMediaQuery(theme.breakpoints.down('sm'));

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

  const [password, setPassword] = useState('');
  const [password1, setPassword1] = useState('');
  const [error, setError] = useState('');
  const [searchMessage, setSearchMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });
  const { t } = useTranslation();
  const [branchesData, setBranchesData] = useState<Branches>();
  const [selectedArgumentsTemp, setSelectedArgumentsTemp] =
    useState<SelectedArguments>({});
  const [isElectron, setIsElectron] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const getBranchesInfo = async () => {
      const response = await getBranches();
      const { data }: { data: Branches } = response;
      setBranchesData(data as Branches);
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

  useEffect(() => {
    setIsElectron(isElectronApp());
  }, []);

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

  // Build tabbed sections dynamically based on environment and auth state
  const sections = [
    {
      key: 'appearance',
      label: t('settings.appearance', 'Appearance'),
      hidden: false,
      content: (
        <>
          <LanguageSection lngs={lngs} />
          <AppearanceSection
            mode={mode}
            toggleMode={toggleMode}
            colorPrimary={colorPrimary}
            setColorPrimary={handleChangeColorPrimary}
            colorSecondary={colorSecondary}
            setColorSecondary={handleChangeColorSecondary}
            colorBackground={colorBackground}
            setColorBackground={handleChangeColorBackground}
            colorText={colorText}
            setColorText={handleChangeColorText}
            colorScrollBar={colorScrollBar}
            setColorScrollBar={handleChangeColorScrollBar}
            colorPaper={colorPaper}
            setColorPaper={handleChangeColorPaper}
          />
        </>
      ),
    },
    {
      key: 'server',
      label: t('settings.server', 'Server'),
      hidden: false,
      content: <ServerSection ip={ip} onChange={handleChange} />,
    },
    {
      key: 'account',
      label: t('settings.account', 'Account'),
      hidden: activeUser?.token === '',
      content: (
        <AccountSection
          password={password}
          password1={password1}
          error={error}
          setPassword={setPassword}
          setPassword1={setPassword1}
          onSubmit={handlePasswordResetClick}
        />
      ),
    },
    {
      key: 'game',
      label: t('settings.game', 'Game'),
      hidden: !isElectron || activeUser?.token === '',
      content: (
        <>
          <GamePathSection
            exePath={exePath}
            searchMessage={searchMessage}
            onSelect={() => handleSelectFileClick(false)}
            onSearch={handleSearch}
          />
          {ticketEnabled === 'false' &&
            isElectron &&
            activeUser?.token !== '' && (
              <ConfigFileSection
                activeHandle={activeUser?.handle}
                configFile={activeUser?.configFile}
                onSelect={() => handleSelectFileClick(true)}
                hidden={false}
              />
            )}

          <AdvancedSection
            enableDiscordRPC={enableDiscordRPC}
            toggleDiscord={toggleDiscord}
            showAllChat={showAllChat}
            setShowAllChatInternal={setShowAllChatInternal}
            gameExpanded={gameExpanded}
            setGameExpanded={(v) => setGameExpanded(v)}
            ticketEnabled={ticketEnabled}
            setTicketEnabled={(v) => setTicketEnabled(v)}
            noLogEnabled={noLogEnabled}
            setNoLogEnabled={(v) => setNoLogEnabled(v)}
          />
        </>
      ),
    },
    {
      key: 'branch',
      label: t('settings.branch', 'Branch'),
      hidden: !isElectron || activeUser?.token === '',
      content: (
        <BranchSection
          exePath={exePath}
          locked={locked}
          branch={branch}
          isDev={isDev}
          branchesData={branchesData as Branches}
          selectedArguments={selectedArguments}
          onChangeBranch={handleChangeBranch}
          onRefresh={handleRefresh}
          onArgumentChange={handleArgumentChange}
        />
      ),
    },
    {
      key: 'danger',
      label: t('settings.dangerZone', 'Danger Zone'),
      hidden: false,
      content: (
        <DangerZoneSection
          onDeleteAll={handleDeleteClick}
          onResetApp={handleResetClick}
        />
      ),
    },
  ];

  const visibleSections = sections.filter((s) => !s.hidden);

  const tabIconMap: Record<string, React.ReactElement> = {
    appearance: <PaletteIcon fontSize="small" />,
    account: <PersonIcon fontSize="small" />,
    game: (
      <Box
        component="img"
        src={logoSmall()}
        alt="Game"
        sx={{ width: 18, height: 18, display: 'block' }}
      />
    ),
    server: <DnsIcon fontSize="small" />,
    branch: <CallSplitIcon fontSize="small" />,
    danger: <WarningAmberIcon fontSize="small" />,
  };

  useEffect(() => {
    // Clamp tab index when visibility changes
    if (tabIndex >= visibleSections.length) {
      setTabIndex(Math.max(0, visibleSections.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron, activeUser?.token, ticketEnabled]);

  // Responsive sizing (avoid nested ternaries for lint rules)
  const tabsMinHeight = isCompact ? 36 : 42;
  const tabMinHeight = isCompact ? 34 : 42;
  const tabPaddingX = isCompact ? 1 : 1.25;
  const tabFontSize = isCompact ? '0.5rem' : '0.55rem';
  let tabMaxWidth = 200;
  if (isIconOnly) {
    tabMaxWidth = 56;
  } else if (isCompact) {
    tabMaxWidth = 140;
  }

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            scrollButtons="auto"
            allowScrollButtonsMobile
            variant="fullWidth"
            sx={{ minHeight: tabsMinHeight, width: '100%' }}
          >
            {visibleSections.map((s) => (
              <Tab
                key={s.key}
                label={isIconOnly ? '' : s.label}
                icon={tabIconMap[s.key]}
                title={s.label}
                sx={{
                  minHeight: tabMinHeight,
                  minWidth: 0,
                  px: tabPaddingX,
                  maxWidth: tabMaxWidth,
                  textTransform: 'none',
                  '& .MuiTab-iconWrapper': { mr: isIconOnly ? 0 : 0.75 },
                  '& .MuiTab-wrapper': {
                    gap: isIconOnly ? 0 : 0.5,
                    fontSize: tabFontSize,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>
        <Box sx={{ mt: 2 }}>{visibleSections[tabIndex]?.content}</Box>
      </Grid>
    </Grid>
  );
}
