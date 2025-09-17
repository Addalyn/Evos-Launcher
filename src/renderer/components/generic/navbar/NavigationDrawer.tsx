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
        },
      }}
    >
      <Toolbar sx={{ height: '63px' }} />

      {branchesData && isAuthenticated && (
        <BranchSelector
          branchesData={branchesData}
          branch={branch}
          locked={locked}
          isDev={isDev}
          onBranchChange={onBranchChange}
        />
      )}

      {pages.map((page) => {
        if (!isAuthenticated && page.special && page.href === '/login') {
          return (
            <React.Fragment key={`special-page-top-${page.href}`}>
              {/* Section for special items at the top */}
              <Box
                sx={{
                  padding: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <List>
                  <ListItem
                    key={page.title}
                    disablePadding
                    sx={{
                      display: 'block',
                      marginBottom: pages.length < 1 ? '10px' : '',
                    }}
                    disableGutters={isDownloading}
                    onClick={() => {
                      if (!isDownloading) onNavigate(page.href);
                    }}
                  >
                    <ListItemButton
                      className="glow-on-hover"
                      sx={{
                        width: '97%',
                        left: '4px',
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white' }}>
                        {page.icon}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: '16px' }}
                        primary={page.title}
                        sx={{
                          color: 'white',
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
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <Paper
          sx={{
            flex: 1,
            boxShadow: 'none',
            borderRadius: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <List>
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
                    {page.devider && <Divider key={`${page.title}-divider`} />}
                    <ListItem
                      key={page.title}
                      disablePadding
                      sx={{ display: 'block' }}
                      disableGutters={isDownloading}
                      onClick={() => {
                        if (!isDownloading) onNavigate(page.href);
                      }}
                    >
                      <ListItemButton
                        sx={{
                          width: '100%',
                        }}
                      >
                        <ListItemIcon>{page.icon}</ListItemIcon>
                        <ListItemText
                          primaryTypographyProps={{ fontSize: '16px' }}
                          primary={page.title}
                          sx={{ display: { xs: 'none', md: 'flex' } }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              }
              return null;
            })}
          </List>
        </Paper>
      </Box>

      {/* Fixed bottom section for special items */}
      <Box
        sx={{
          padding: 1,
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <List>
          {pages.map((page) => {
            if (page.special && page.href !== '/login') {
              return (
                <React.Fragment key={`special-page-${page.href}`}>
                  <ListItem
                    key={page.title}
                    disablePadding
                    sx={{
                      display: 'block',
                      marginBottom: pages.length < 1 ? '10px' : '',
                    }}
                    disableGutters={isDownloading}
                    onClick={() => {
                      if (!isDownloading) onNavigate(page.href);
                    }}
                  >
                    <ListItemButton
                      className="glow-on-hover"
                      sx={{
                        width: '97%',
                        left: '4px',
                      }}
                    >
                      <ListItemIcon sx={{ color: 'white' }}>
                        {page.icon}
                      </ListItemIcon>
                      <ListItemText
                        primaryTypographyProps={{ fontSize: '16px' }}
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
