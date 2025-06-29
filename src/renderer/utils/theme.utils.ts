/**
 * @fileoverview Theme configuration and utilities for the Evos Launcher
 * Provides Material-UI theme creation with custom colors and styles
 * @author Evos Launcher Team
 * @since 1.0.0
 */

import { createTheme, Theme, colors } from '@mui/material';
import { PaletteMode } from '../types/app.types';

/**
 * Interface for the Evos store theme configuration
 * @interface ThemeConfig
 * @property {string} colorPrimary - Primary theme color
 * @property {string} colorSecondary - Secondary theme color
 * @property {string} colorBackground - Background color
 * @property {string} colorPaper - Paper component color
 * @property {string} colorText - Text color
 * @property {string} colorScrollBar - Scrollbar color
 * @property {PaletteMode} mode - Light or dark mode
 */
export interface ThemeConfig {
  colorPrimary: string;
  colorSecondary: string;
  colorBackground: string;
  colorPaper: string;
  colorText: string;
  colorScrollBar: string;
  mode: PaletteMode;
}

/**
 * Creates a custom Material-UI theme with Evos-specific styling
 * @param {ThemeConfig} config - The theme configuration object
 * @returns {Theme} The configured Material-UI theme
 */
export const createEvosTheme = (config: ThemeConfig): Theme => {
  return createTheme({
    // Custom transform properties for skewed elements
    transform: {
      skewA: 'skewX(-15deg)',
      skewB: 'skewX(15deg)',
    },
    palette: {
      primary: {
        main: config.colorPrimary,
      },
      secondary: {
        main: config.colorSecondary,
      },
      background: {
        default: config.colorBackground,
        paper: config.colorPaper,
      },
      text: {
        primary: config.colorText,
      },
      mode: config.mode,
      // Custom team colors for game UI
      teamA: {
        main: colors.blue[500],
        dark: colors.blue[900],
      },
      teamB: {
        main: colors.red[500],
        dark: colors.red[900],
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: 'transparent',
              borderRadius: 0,
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 0,
              backgroundColor: config.colorScrollBar,
              minHeight: 24,
              border: `0px solid ${config.mode === 'dark' ? '#272727' : '#1976d2'}`,
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus':
              {
                backgroundColor: '#959595',
              },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active':
              {
                backgroundColor: '#959595',
              },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover':
              {
                backgroundColor: '#959595',
              },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: '#272727',
            },
          },
        },
      },
    },
  } as any); // TypeScript doesn't recognize custom palette properties
};
