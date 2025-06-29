import React from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Theme } from '@mui/material/styles';

/** Constants for layout dimensions */
const LAYOUT_CONSTANTS = {
  /** Width of the sidebar on extra small screens */
  XS_SIDEBAR_WIDTH: '60px',
  /** Width of the sidebar on medium and larger screens */
  MD_SIDEBAR_WIDTH: '240px',
} as const;

/**
 * Wiki page component that displays the EvoS wiki in an embedded iframe.
 * The iframe adjusts its positioning and dimensions based on screen size to accommodate
 * different sidebar widths on mobile vs desktop layouts.
 *
 * @returns A React element containing the wiki iframe with responsive layout
 */
function WikiPage(): React.ReactElement {
  /**
   * Media query hook to determine if the current screen size is below medium breakpoint.
   * Used to adjust layout for mobile vs desktop sidebar widths.
   */
  const isXs: boolean = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md'),
  );

  /**
   * Inline styles for the iframe element.
   * Positions the iframe absolutely to fill the remaining space after accounting
   * for the sidebar width, which varies based on screen size.
   */
  const iframeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: isXs
      ? LAYOUT_CONSTANTS.XS_SIDEBAR_WIDTH
      : LAYOUT_CONSTANTS.MD_SIDEBAR_WIDTH,
    height: '100%',
    width: isXs
      ? `calc(100% - ${LAYOUT_CONSTANTS.XS_SIDEBAR_WIDTH})`
      : `calc(100% - ${LAYOUT_CONSTANTS.MD_SIDEBAR_WIDTH})`,
    border: 'none',
  };

  /**
   * Container styles for the wiki page wrapper.
   * Sets full height and width to ensure the iframe can fill the available space.
   */
  const containerStyle: React.CSSProperties = {
    height: '100%',
    width: '100%',
  };

  return (
    <div style={containerStyle}>
      <iframe
        style={iframeStyle}
        src="https://wiki.evos.live/"
        title="EvoS Wiki - Game documentation and guides"
      />
    </div>
  );
}

export default WikiPage;
