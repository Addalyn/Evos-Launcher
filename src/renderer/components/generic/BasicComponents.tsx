/**
 * @fileoverview Basic styled components for the Evos Launcher application.
 * This module provides a collection of reusable styled Material-UI components
 * that serve as building blocks throughout the application. Includes layout
 * components, cards, and utility components with consistent theming.
 */

import { Box, Card, Stack, styled } from '@mui/material';
import type { Theme } from '@mui/material/styles';

/**
 * Extended theme interface to include custom size properties
 * This addresses the TypeScript errors for theme.size.basicWidth
 */
interface ExtendedTheme extends Theme {
  size?: {
    basicWidth?: string | number;
  };
}

/**
 * Background image component for full-screen background displays.
 *
 * This component creates an absolutely positioned span that covers the entire
 * parent container and displays a background image with cover sizing.
 * The image is positioned behind other content with a negative z-index.
 *
 * @component
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <BgImage style={{ backgroundImage: 'url(/path/to/image.jpg)' }} />
 *   <div>Content appears over the background</div>
 * </div>
 * ```
 */
export const BgImage = styled('span')({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundSize: 'cover',
  backgroundPosition: 'center 40%',
  zIndex: -1000,
});

/**
 * Flexible box container component for horizontal centering.
 *
 * This component extends Material-UI's Box with pre-configured flexbox
 * properties for horizontal layout with center alignment. It creates
 * an inline-flex container that centers its children both horizontally
 * and vertically.
 *
 * @component
 * @example
 * ```tsx
 * <FlexBox>
 *   <Button>Centered Button</Button>
 *   <Typography>Centered Text</Typography>
 * </FlexBox>
 * ```
 */
export const FlexBox = styled(Box)(() => ({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
}));

/**
 * Styled card component with Evos-specific theming.
 *
 * This component extends Material-UI's Card with consistent spacing
 * and maximum width constraints based on the application theme.
 * Provides a standardized card appearance throughout the application.
 *
 * @component
 * @example
 * ```tsx
 * <EvosCard>
 *   <CardContent>
 *     <Typography variant="h6">Card Title</Typography>
 *     <Typography>Card content goes here</Typography>
 *   </CardContent>
 * </EvosCard>
 * ```
 */
export const EvosCard = styled(Card)(({ theme }) => ({
  margin: 4,
  padding: 8,
  maxWidth: (theme as ExtendedTheme).size?.basicWidth || 'auto',
}));

/**
 * Wrapper component for Stack layouts with theme-based constraints.
 *
 * This component extends Material-UI's Stack with automatic centering
 * and maximum width constraints. It provides a consistent layout
 * container for vertically stacked content with responsive sizing.
 *
 * @component
 * @example
 * ```tsx
 * <StackWrapper spacing={2}>
 *   <Typography variant="h4">Title</Typography>
 *   <Typography>Description text</Typography>
 *   <Button variant="contained">Action Button</Button>
 * </StackWrapper>
 * ```
 */
export const StackWrapper = styled(Stack)(({ theme }) => ({
  margin: 'auto',
  maxWidth: (theme as ExtendedTheme).size?.basicWidth || 'auto',
}));
