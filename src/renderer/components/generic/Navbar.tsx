/* eslint-disable react/no-danger */
/**
 * @fileoverview Main navigation bar component for the Evos Launcher application.
 *
 * Refactored into smaller, focused components for better maintainability and performance.
 * This component now serves as a composition layer that orchestrates the various UI elements.
 *
 * @author Evos Launcher Team
 * @since 1.0.0
 * @version 2.2.6
 */

import React from 'react';
import type { ReactElement } from 'react';
import {
  AppBar,
  Container,
  Toolbar,
  Avatar,
  Box,
  Button,
  Typography,
  Tooltip,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

// Import smaller components
import useNavbar from './navbar/useNavbar';
import UserAccountSelector from './navbar/UserAccountSelector';
import NavigationDrawer from './navbar/NavigationDrawer';
import GameLaunchButton from './navbar/GameLaunchButton';
import ErrorDialog from './ErrorDialog';
import BaseDialog from './BaseDialog';
import { isElectronApp } from '../../utils/electronUtils';

// Import resources
import { logo, logoSmall } from '../../lib/Resources';

/**
 * Main navigation bar component - simplified and composed of smaller components.
 *
 * This refactored version focuses on composition and delegates specific functionality
 * to focused sub-components, improving maintainability and performance.
 *
 * @component
 * @returns {ReactElement} The main navigation bar component
 */
export default function NavBar(): ReactElement {
  const { t } = useTranslation();

  // Get all state and handlers from the custom hook
  const {
    // State
    isDev,
    branchesData,
    error,
    setError,
    isPatching,
    account,
    playerInfoMap,
    supportUs,
    setSupportUs,
    activeGames,
    location,
    pages,
    drawerWidth,
    tooltipTitle,
    // Store values
    exePath,
    activeUser,
    authenticatedUsers,
    isDownloading,
    needPatching,
    branch,
    locked,
    // Handlers
    handleChangeBranch,
    handleDirectBranchChange,
    handleLogOut,
    doNavigate,
    handleAddUser,
    isAuthenticated,
    handleSwitchUser,
    handleLaunchGameClick,
    handleCancelDownloadBranch,
    // Computed
    isValidExe,
  } = useNavbar();

  return (
    <>
      {/* Error Dialog */}
      {error && (
        <ErrorDialog error={error} onDismiss={() => setError(undefined)} />
      )}

      {/* Support Dialog */}
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

      {/* Unsupported Branch Dialog */}
      {isElectronApp() &&
        branch === 'Original' &&
        location.pathname !== '/settings' && (
          <BaseDialog
            title={t('unSuportedBranch.title')}
            content={
              <div>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t('unSuportedBranch.text'),
                  }}
                />
                <div style={{ marginTop: '20px' }}>
                  <Button
                    variant="outlined"
                    disabled={
                      !exePath.endsWith('AtlasReactor.exe') ||
                      isDownloading ||
                      isPatching ||
                      !isValidExe ||
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
                  <br />
                  <br />
                  <Button
                    disabled={
                      !exePath.endsWith('AtlasReactor.exe') ||
                      isDownloading ||
                      isPatching ||
                      !isValidExe ||
                      account?.locked
                    }
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px',
                    }}
                    onClick={() => handleDirectBranchChange('Stable')}
                  >
                    Update to Stable
                  </Button>
                  <Button
                    disabled={
                      !exePath.endsWith('AtlasReactor.exe') ||
                      isDownloading ||
                      isPatching ||
                      !isValidExe ||
                      account?.locked
                    }
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleDirectBranchChange('Beta')}
                  >
                    Update to Beta
                  </Button>
                </div>
              </div>
            }
            dismissText="Go to Settings"
            onDismiss={() => doNavigate('/settings')}
          />
        )}

      {/* Main App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(18, 18, 18, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: 'rgba(18, 18, 18, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{ '-webkit-app-region': 'drag', minWidth: '100%' }}
        >
          <Toolbar disableGutters sx={{ minHeight: '72px', px: 2 }}>
            {/* Logo - Desktop */}
            <Avatar
              alt="logo"
              variant="square"
              src={logo()}
              sx={{
                flexShrink: 1,
                width: 255,
                height: 40,
                display: { xs: 'none', md: 'flex' },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                '&:hover': {
                  transform: 'scale(1.02)',
                  filter: 'drop-shadow(0 4px 12px rgba(25, 118, 210, 0.4))',
                },
              }}
            />

            {/* Logo - Mobile */}
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
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                  '&:hover': {
                    transform: 'scale(1.05) rotate(5deg)',
                    filter: 'drop-shadow(0 4px 12px rgba(25, 118, 210, 0.4))',
                  },
                }}
              />
            </Box>

            {/* Game Launch Button */}
            <GameLaunchButton
              isAuthenticated={isAuthenticated()}
              isDownloading={isDownloading}
              isPatching={isPatching}
              needPatching={needPatching}
              accountLocked={account?.locked}
              branch={branch}
              tooltipTitle={tooltipTitle}
              isValidExe={isValidExe}
              activeGames={activeGames}
              activeUser={activeUser}
              onLaunchClick={handleLaunchGameClick}
            />

            {/* Cancel Download Button */}
            {locked && needPatching && (
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
                      className="glow-on-hover"
                      sx={{
                        color: 'white',
                        '-webkit-app-region': 'no-drag',
                        height: '49.5px',
                        borderRadius: '0px',
                      }}
                      onClick={handleCancelDownloadBranch}
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
                        {t('download.cancel')}
                      </Typography>
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            )}

            {/* User Account Section */}
            <Box
              sx={{
                flexGrow: 0,
                justifyContent: 'flex-end',
                marginTop: '5px',
              }}
            >
              {isAuthenticated() && (
                <Box
                  sx={{
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <UserAccountSelector
                    activeUser={activeUser}
                    authenticatedUsers={authenticatedUsers}
                    playerInfoMap={playerInfoMap}
                    isDownloading={isDownloading}
                    onSwitchUser={handleSwitchUser}
                    onAddUser={handleAddUser}
                    onLogout={handleLogOut}
                  />
                </Box>
              )}

              {!isAuthenticated() && (
                <NavLink
                  to="/login"
                  style={(active) => active && { display: 'none' }}
                >
                  <Box
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                      background: 'rgba(25, 118, 210, 0.1)',
                      border: '1px solid rgba(25, 118, 210, 0.3)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        background: 'rgba(25, 118, 210, 0.2)',
                        border: '1px solid rgba(25, 118, 210, 0.5)',
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {t('login')}
                    </Typography>
                  </Box>
                </NavLink>
              )}
            </Box>

            <Box sx={{ width: '98px' }} />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Navigation Drawer */}

      <NavigationDrawer
        drawerWidth={drawerWidth}
        pages={pages}
        branchesData={branchesData}
        branch={branch}
        locked={locked}
        isDev={isDev}
        isDownloading={isDownloading}
        onBranchChange={handleChangeBranch}
        onNavigate={doNavigate}
        isAuthenticated={isAuthenticated()}
        currentPath={location.pathname}
      />
    </>
  );
}
