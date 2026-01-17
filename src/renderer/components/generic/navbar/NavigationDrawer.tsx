/**
 * @fileoverview Navigation drawer component for the Navbar
 * Displays the main navigation menu with scrollable and fixed sections.
 *
 * @author Evos Launcher Team
 * @since 2.2.6
 */

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Box,
  Toolbar,
} from '@mui/material';
import type { NavigationPage } from './types';
import BranchSelector from './BranchSelector';
import type { Branches } from 'renderer/lib/Evos';

interface NavigationDrawerProps {
  /** Width of the drawer */
  drawerWidth: number;
  /** Navigation pages configuration */
  pages: NavigationPage[];
  /** Available branches data */
  branchesData: Branches | undefined;
  /** Current selected branch */
  branch: string;
  /** Whether the interface is locked */
  locked: boolean;
  /** Whether user has developer permissions */
  isDev: boolean;
  /** Whether downloads are in progress */
  isDownloading: boolean;
  /** Handler for branch selection change */
  onBranchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handler for navigation */
  onNavigate: (href: string) => void;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Current page path */
  currentPath: string;
}

/**
 * Navigation drawer component that displays the main navigation menu.
 * Features scrollable content area and fixed bottom section for special items.
 *
 * @param {NavigationDrawerProps} props - Component props
 * @returns {React.ReactElement} Navigation drawer component
 */
export default function NavigationDrawer({
  drawerWidth,
  pages,
  branchesData = undefined,
  branch,
  locked,
  isDev,
  isDownloading,
  onBranchChange,
  onNavigate,
  isAuthenticated,
  currentPath,
}: NavigationDrawerProps): React.ReactElement {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        maxWidth: drawerWidth,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          display: 'flex',
          flexDirection: 'column',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.85)'
              : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      <Toolbar sx={{ height: '72px', minHeight: '72px !important' }} />

      {branchesData && isAuthenticated && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <BranchSelector
            branchesData={branchesData}
            branch={branch}
            locked={locked}
            isDev={isDev}
            onBranchChange={onBranchChange}
          />
        </Box>
      )}

      {pages.map((page) => {
        if (!isAuthenticated && page.special && page.href === '/login') {
          return (
            <React.Fragment key={`special-page-top-${page.href}`}>
              {/* Section for special items at the top */}
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottom: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.08)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <List sx={{ p: 0 }}>
                  <ListItem
                    key={page.title}
                    disablePadding
                    sx={{
                      display: 'block',
                      mb: 0.25,
                    }}
                    disableGutters={isDownloading}
                    onClick={() => {
                      if (!isDownloading) onNavigate(page.href);
                    }}
                  >
                    <ListItemButton
                      sx={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(66, 165, 245, 0.15) 100%)',
                        border: '1px solid rgba(25, 118, 210, 0.3)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        py: 1,
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.25) 0%, rgba(66, 165, 245, 0.25) 100%)',
                          border: '1px solid rgba(25, 118, 210, 0.5)',
                          transform: 'translateY(-2px) scale(1.02)',
                          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.3)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: '#42a5f5', minWidth: '36px' }}>
                        {page.icon}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{
                          fontSize: '14px',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                        }}
                        primary={page.title}
                        sx={{
                          color: '#42a5f5',
                          display: { xs: 'none', md: 'flex' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
            </React.Fragment>
          );
        }
        return null;
      })}

      {/* Scrollable content area for regular navigation items */}
      <Box
        className="nav-drawer-scrollbar"
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: 1.5,
          pr: 1, // Reduced right padding to create space from scrollbar
          py: 0.8,
          display: 'flex',
          flexDirection: 'column',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            },
          },
        }}
      >
        <List sx={{ p: 0, '& .MuiListItem-root': { pr: 1.5 } }}>
            {pages.map((page) => {
              // Hide specific items when isAuthenticated is false

              if (
                (page.authentication && !isAuthenticated) ||
                (page.href === '/login' && isAuthenticated)
              ) {
                return null;
              }

              if (!page.special) {
                return (
                  <React.Fragment key={`page-${page.href}`}>
                    {page.devider && (
                      <Divider
                        key={`${page.title}-divider`}
                        sx={{
                          my: 1,
                          borderColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.08)',
                        }}
                      />
                    )}
                    <ListItem
                      key={page.title}
                      disablePadding
                      sx={{ display: 'block', mb: 0.25 }}
                      disableGutters={isDownloading}
                      onClick={() => {
                        if (!isDownloading) onNavigate(page.href);
                      }}
                    >
                      <ListItemButton
                        sx={{
                          borderRadius: '10px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                           py: 0.9,
                          // Active state when current path matches
                          ...(currentPath === page.href && {
                            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(66, 165, 245, 0.2) 100%)',
                            border: '1px solid rgba(25, 118, 210, 0.4)',
                            '& .MuiListItemIcon-root': {
                              color: 'primary.main',
                            },
                            '& .MuiListItemText-primary': {
                              color: 'primary.light',
                              fontWeight: 600,
                            },
                          }),
                          '&:hover': {
                            background: currentPath === page.href
                              ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.25) 0%, rgba(66, 165, 245, 0.25) 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            transform: 'translateX(4px)',
                            '& .MuiListItemIcon-root': {
                              color: 'primary.main',
                              transform: 'scale(1.1)',
                            },
                            '& .MuiListItemText-primary': {
                              color: 'primary.light',
                            },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: '36px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        >
                          {page.icon}
                        </ListItemIcon>
                        <ListItemText
                          primaryTypographyProps={{
                             fontSize: '14px',
                             fontWeight: currentPath === page.href ? 700 : 500,
                             letterSpacing: '0.2px',
                           }}
                          primary={page.title}
                          sx={{
                            display: { xs: 'none', md: 'flex' },
                            '& .MuiListItemText-primary': {
                              transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              }
              return null;
            })}
          </List>
      </Box>

      {/* Fixed bottom section for special items */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          borderTop: (theme) =>
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <List sx={{ p: 0 }}>
          {pages.map((page) => {
            if (page.special && page.href !== '/login') {
              return (
                <React.Fragment key={`special-page-${page.href}`}>
                  <ListItem
                    key={page.title}
                    disablePadding
                    sx={{
                      display: 'block',
                      mb: 0.25,
                    }}
                    disableGutters={isDownloading}
                    onClick={() => {
                      if (!isDownloading) onNavigate(page.href);
                    }}
                  >
                    <ListItemButton
                      className="glow-on-hover"
                      sx={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(186, 104, 200, 0.15) 100%)',
                        border: '1px solid rgba(156, 39, 176, 0.3)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        py: 1,
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.25) 0%, rgba(186, 104, 200, 0.25) 100%)',
                          border: '1px solid rgba(156, 39, 176, 0.5)',
                          transform: 'translateY(-2px) scale(1.02)',
                          boxShadow: '0 8px 16px rgba(156, 39, 176, 0.3)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white' }}>
                        {page.icon}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{
                          fontSize: '15px',
                          fontWeight: 600,
                          letterSpacing: '0.3px',
                        }}
                        primary={page.title}
                        sx={{
                          color: 'white',
                          display: { xs: 'none', md: 'flex' },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              );
            }
            return null;
          })}
        </List>
      </Box>
    </Drawer>
  );
}
