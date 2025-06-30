/* eslint-disable react/no-array-index-key */
/**
 * @fileoverview Game Component for displaying complete game information with teams, scores, and interactive elements.
 *
 * This component renders a full game view with collapsible team details, map information,
 * team scores with colored text shadows, and clickable elements for expanding/collapsing
 * detailed team information. Supports both compact and expanded views.
 */
import {
  Box,
  Collapse,
  Slide,
  Stack,
  styled,
  Tooltip,
  Typography,
  useTheme,
  Theme,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { trackEvent } from '@aptabase/electron/renderer';
import {
  CharacterType,
  GameData,
  GamePlayerData,
  PlayerData,
} from '../../lib/Evos';
import { FlexBox } from '../generic/BasicComponents';
import { mapMiniPic } from '../../lib/Resources';
import Player from './Player';
import CharacterIcon from './CharacterIcon';

/**
 * Extended theme interface with custom team palette properties
 */
interface ExtendedTheme extends Theme {
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
 * Styled FlexBox component for team layout with custom spacing and width
 */
export const TeamFlexBox = styled(FlexBox)(() => ({
  paddingLeft: 20,
  paddingRight: 20,
  width: '40%',
  flexWrap: 'wrap',
}));

/**
 * Props for the Team component
 */
interface TeamProps {
  /** Caption to display above the team */
  caption: string;
  /** Array of game player data for the team */
  info: GamePlayerData[];
  /** Whether this is team A (affects styling and layout) */
  isTeamA: boolean;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Current game status */
  status: string;
}

/**
 * Props for the TeamRow component
 */
interface TeamRowProps {
  /** Array of game player data for the team */
  info: GamePlayerData[];
  /** Whether this is team A (affects styling and layout) */
  isTeamA: boolean;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Current game status */
  status: string;
}

/**
 * TeamRow Component
 *
 * Renders a horizontal row of character icons for a team.
 * Used in the collapsed view to show a compact team representation.
 *
 * @param props - Team props containing player info and display settings
 * @param ref - React ref for the component
 * @returns A styled FlexBox containing character icons
 */
const TeamRow = React.forwardRef<HTMLDivElement, TeamRowProps>(
  ({ info, isTeamA, playerData, status }, ref) => {
    return (
      <TeamFlexBox ref={ref} flexGrow={1} flexShrink={1} flexBasis="auto">
        {info.map((player, idx) => (
          <CharacterIcon
            key={`teamrow_${isTeamA ? 'A' : 'B'}_${player.accountId}_${player.characterType}_${idx}`}
            characterType={
              status !== 'Assembling'
                ? player.characterType
                : CharacterType.None
            }
            data={playerData.get(player.accountId)}
            isTeamA={isTeamA}
            rightSkew={false}
            noTooltip={false}
          />
        ))}
      </TeamFlexBox>
    );
  },
);

/**
 * Team Component
 *
 * Renders a detailed team view with player information and character icons.
 * Used in the expanded view to show full team details.
 *
 * @param props - Team props containing player info and display settings
 * @returns A Stack containing team caption and player details
 */
function Team({ caption, info, isTeamA, playerData, status }: TeamProps) {
  return (
    <Stack>
      {caption && <Typography variant="h5">{caption}</Typography>}
      {info.map((p, idx) => (
        <Stack
          key={`teamdetail_${isTeamA ? 'A' : 'B'}_player_${p.accountId}_${p.characterType}_${idx}`}
          direction={isTeamA ? 'row' : 'row-reverse'}
        >
          <Player
            info={playerData.get(p.accountId)}
            disableSkew={false}
            characterType={p.characterType}
            titleOld=""
          />
          <CharacterIcon
            characterType={
              status !== 'Assembling' ? p.characterType : CharacterType.None
            }
            data={playerData.get(p.accountId)}
            isTeamA={isTeamA}
            rightSkew
            noTooltip
          />
        </Stack>
      ))}
    </Stack>
  );
}

/**
 * Generates a localized status string for the game
 *
 * @param info - Game data containing status and turn information
 * @param t - Translation function from react-i18next
 * @returns Formatted status string with turn information when applicable
 */
function statusString(info: GameData, t: TFunction): string {
  if (info.status === 'Started') {
    return `${t('turn')} ${info.turn}`;
  }
  if (info.turn === 0) {
    return t(info.status);
  }
  return `${t(info.status)} (${t('turn')} ${info.turn})`;
}

/**
 * Props for the Game component
 */
interface Props {
  /** Game data containing teams, scores, and game state */
  info: GameData;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Whether the game should start in expanded state */
  gameExpanded: string;
}

/**
 * Game Component
 *
 * Displays a complete game with both teams, scores, map information, and game status.
 * Features collapsible view showing either compact team rows or detailed team information.
 * Includes interactive map area that toggles between expanded and collapsed states.
 *
 * @param props - Game component props
 * @returns A complete game display with teams, map, and scores
 */
export default function Game({
  info,
  playerData,
  gameExpanded = 'false',
}: Props) {
  const { t } = useTranslation();

  // Prepare team data objects
  const A = {
    caption: t('teamA'),
    info: info.teamA,
    playerData,
    isTeamA: true,
    status: info.status,
  };
  const B = {
    caption: t('teamB'),
    info: info.teamB,
    playerData,
    isTeamA: false,
    status: info.status,
  };

  const theme = useTheme() as ExtendedTheme;

  const [collapsed, setCollapsed] = useState<boolean>(gameExpanded !== 'true');

  return (
    <Stack width="100%">
      <FlexBox>
        <Slide in={collapsed} direction="right" mountOnEnter unmountOnExit>
          <TeamRow
            info={A.info}
            isTeamA={A.isTeamA}
            playerData={A.playerData}
            status={A.status}
          />
        </Slide>
        <Tooltip title={`${t(`maps.${info.map}`)} ${info.ts}`} arrow>
          <Box
            flexBasis={120}
            onClick={() => {
              trackEvent('Game Details');
              setCollapsed((x) => !x);
            }}
            style={{
              backgroundImage: `url(${mapMiniPic(info.map)})`,
              backgroundSize: 'cover',
              borderColor: 'white',
              borderWidth: 2,
              borderStyle: 'solid',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column', // Add this line to stack items vertically
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3">
              <span
                style={{ textShadow: `2px 2px ${theme.palette.teamA.main}` }}
              >
                {info.teamAScore}
              </span>
              <span> - </span>
              <span
                style={{ textShadow: `2px 2px ${theme.palette.teamB.dark}` }}
              >
                {info.teamBScore}
              </span>
            </Typography>
            <Typography
              variant="caption"
              component="div"
              style={{
                textShadow:
                  '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
                marginTop: -10,
              }}
            >
              {statusString(info, t)}
            </Typography>
          </Box>
        </Tooltip>
        <Slide in={collapsed} direction="left" mountOnEnter unmountOnExit>
          <TeamRow
            info={B.info}
            isTeamA={B.isTeamA}
            playerData={B.playerData}
            status={B.status}
          />
        </Slide>
      </FlexBox>
      <Collapse in={!collapsed}>
        <FlexBox style={{ justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <Team
            caption={A.caption}
            info={A.info}
            isTeamA={A.isTeamA}
            playerData={A.playerData}
            status={A.status}
          />
          <Team
            caption={B.caption}
            info={B.info}
            isTeamA={B.isTeamA}
            playerData={B.playerData}
            status={B.status}
          />
        </FlexBox>
      </Collapse>
    </Stack>
  );
}
