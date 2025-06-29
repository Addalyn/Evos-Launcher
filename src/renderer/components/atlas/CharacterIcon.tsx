/**
 * @fileoverview Character Icon Component for displaying game character avatars with team-based styling.
 *
 * This component renders interactive character icons with skewed transforms, team colors,
 * and optional tooltips. Supports navigation to player statistics and handles various
 * display states based on game context.
 */

/**
 * @fileoverview Character Icon Component
 *
 * This module provides a CharacterIcon component that displays character icons
 * with team-based styling, skewed transforms, and optional tooltips. The component
 * supports navigation to player statistics when clicked and includes proper type
 * safety with comprehensive JSDoc documentation.
 */
import { ButtonBase, Tooltip, useTheme, Theme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { CharacterType, PlayerData, denydNames } from '../../lib/Evos';
import { BgImage } from '../generic/BasicComponents';
import { characterIcon } from '../../lib/Resources';

/**
 * Custom theme interface extending MUI's Theme with additional properties
 * for team colors and transform skew values
 */
interface ExtendedTheme extends Theme {
  transform: {
    skewA: string;
    skewB: string;
  };
  palette: Theme['palette'] & {
    teamA: {
      main: string;
      dark: string;
    };
    teamB: {
      main: string;
      dark: string;
    };
  };
}

/**
 * Props for the CharacterIcon component
 */
interface CharacterIconProps {
  /** The type of character to display the icon for */
  characterType: CharacterType;
  /** Player data associated with the character */
  data: PlayerData | undefined;
  /** Whether this character belongs to team A (affects styling and skew direction) */
  isTeamA: boolean;
  /** Whether to apply right skew styling (overrides isTeamA skew direction) */
  rightSkew: boolean;
  /** Whether to disable the tooltip display */
  noTooltip: boolean;
}

/**
 * Character Icon Component
 *
 * Displays a character icon with team-based styling, skewed transforms, and optional tooltip.
 * Supports navigation to player statistics when clicked (if player data is available and valid).
 *
 * @param props - The component props
 * @returns A styled character icon button with optional tooltip
 */
export default function CharacterIcon({
  characterType,
  data = undefined,
  isTeamA,
  rightSkew = false,
  noTooltip = false,
}: CharacterIconProps) {
  const theme = useTheme() as ExtendedTheme;
  const navigate = useNavigate();

  /**
   * Handles click events on the character icon.
   * Navigates to player statistics page if valid player data is provided.
   */
  const handleClick = (): void => {
    if (!data) {
      return;
    }
    if (!denydNames.includes(data.handle)) {
      navigate(`/playerstats?player=${encodeURIComponent(data.handle)}`);
    }
  };

  // Determine transform values based on team affiliation or rightSkew prop
  let transformOuter: string;
  let transformInner: string;

  if (isTeamA || rightSkew) {
    transformOuter = theme.transform.skewA;
    transformInner = theme.transform.skewB;
  } else {
    transformOuter = theme.transform.skewB;
    transformInner = theme.transform.skewA;
  }

  // Determine border color based on team affiliation
  const borderColor = isTeamA
    ? theme.palette.teamA.main
    : theme.palette.teamB.main;

  // Get player handle or default to 'UNKNOWN'
  const handle = data?.handle ?? 'UNKNOWN';

  /**
   * The main content element containing the character icon button
   */
  const content = (
    <ButtonBase
      onClick={handleClick}
      focusRipple
      style={{
        width: 80,
        height: 50,
        transform: transformOuter,
        overflow: 'hidden',
        borderColor,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 4,
        backgroundColor: '#333',
        margin: 2,
      }}
    >
      <div
        style={{
          transform: transformInner,
          width: '115%',
          height: '100%',
          flex: 'none',
        }}
      >
        <BgImage
          style={{
            backgroundImage: `url(${characterIcon(characterType)})`,
          }}
        />
      </div>
    </ButtonBase>
  );

  // Return content without tooltip if noTooltip is true
  if (noTooltip) {
    return content;
  }

  // Return content wrapped in tooltip
  return (
    <Tooltip title={handle} arrow>
      {content}
    </Tooltip>
  );
}
