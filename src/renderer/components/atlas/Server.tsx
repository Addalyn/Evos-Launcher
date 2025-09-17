/**
 * @fileoverview Server Component for displaying game server information and current game state.
 *
 * This component renders server details including server name, current game type, team composition,
 * and full game information. Handles server state validation and filtering, hiding servers in
 * invalid states. Displays player vs bot counts and game details using the Game component.
 */

import { Grid, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GameData, MapType, PlayerData, ServerData } from '../../lib/Evos';
import Game from './Game';

/**
 * Props for the Server component
 */
interface Props {
  /** Server information including name and configuration */
  info: ServerData;
  /** Game data currently running on the server */
  game: GameData | undefined;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Whether the game should start in expanded state */
  gameExpanded: string;
}

/**
 * Counts the number of unique player accounts in a team, excluding bots
 *
 * @param gameData - Game data containing team information
 * @param team - Which team to count ('teamA' or 'teamB')
 * @returns Number of unique player accounts in the specified team
 */
function countUniqueAccounts(
  gameData: GameData,
  team: 'teamA' | 'teamB',
): number {
  const uniqueAccountIds = new Set<number>();
  gameData[team].forEach((player) => {
    if (player.accountId !== 0) {
      uniqueAccountIds.add(player.accountId);
    }
  });
  return uniqueAccountIds.size;
}

/**
 * Server Component
 *
 * Displays a server with its current game information, including server name,
 * game type, team composition, and the full game details.
 * Filters out servers in invalid states or without active games.
 *
 * @param props - Server component props
 * @returns A Paper containing server and game information, or null if invalid
 */
export default function Server({
  info,
  game = undefined,
  playerData,
  gameExpanded,
}: Props) {
  const { t } = useTranslation();

  // Hide servers that match any of these conditions
  // Since servers can get stuck in a state, we don't want to show them
  if (game === undefined) {
    return null;
  }
  if (game.id === null) {
    return null;
  }
  if (game.status === 'None') {
    return null;
  }

  if (game.status === 'Assembling' || game.status === 'FreelancerSelecting') {
    // Hide the map name for these states
    game.map = MapType.Unknown_Map;
  }

  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 3, sm: 4 },
        m: { xs: '1em' },
        overflow: 'hidden',
        minWidth: 340,
        mx: 'auto',
      }}
    >
      <Grid container alignItems="center" spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: 'main',
              letterSpacing: 1.5,
              textShadow: '0 2px 12px rgba(0,0,0,0.10)',
              mb: { xs: 1, sm: 0 },
              pl: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
            noWrap
          >
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)',
                marginRight: 10,
              }}
            />
            {info.name.replace(/-/, ' ') === 'Custom game'
              ? t(info.name.replace(/-/, ' '))
              : info.name.replace(/-/, ' ')}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Grid
            container
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
          >
            <Grid>
              <Typography
                variant="h6"
                sx={{
                  color: 'main',
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <span style={{ fontWeight: 700 }}>{game.gameType}</span>
                {game.gameSubType && (
                  <span
                    style={{
                      color: 'main',
                      marginLeft: 10,
                      fontStyle: 'italic',
                    }}
                  >
                    {t(`gamesubtype.${game.gameSubType}`)}
                  </span>
                )}
                <span
                  style={{
                    margin: '0 10px',
                    color: 'main.secondary',
                    fontWeight: 400,
                  }}
                >
                  •
                </span>
                <span style={{ fontWeight: 700, color: '#1976d2' }}>
                  {countUniqueAccounts(game, 'teamA') === 0
                    ? 'Bots'
                    : countUniqueAccounts(game, 'teamA')}
                </span>
                <span
                  style={{ color: 'main', margin: '0 6px', fontWeight: 400 }}
                >
                  vs
                </span>
                <span style={{ fontWeight: 700, color: '#d32f2f' }}>
                  {countUniqueAccounts(game, 'teamB') === 0
                    ? 'Bots'
                    : countUniqueAccounts(game, 'teamB')}
                </span>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container>
        <Grid size={12}>
          {game && (
            <Game
              info={game}
              playerData={playerData}
              gameExpanded={gameExpanded}
            />
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
