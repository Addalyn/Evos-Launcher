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
      elevation={3}
      style={{ padding: '1em', margin: '1em', overflow: 'hidden' }}
    >
      <Grid container spacing={2}>
        <Grid item xs={4} style={{ textAlign: 'left' }}>
          <Typography variant="h3">
            {info.name.replace(/-/, ' ') === 'Custom game'
              ? t(info.name.replace(/-/, ' '))
              : info.name.replace(/-/, ' ')}
          </Typography>
        </Grid>
        <Grid item xs={8} style={{ textAlign: 'right' }}>
          <Typography variant="h3">
            {game.gameType} -{' '}
            {game.gameSubType ? `${t(`gamesubtype.${game.gameSubType}`)}` : ''}{' '}
            -{' '}
            {countUniqueAccounts(game, 'teamA') === 0
              ? 'Bots'
              : countUniqueAccounts(game, 'teamA')}{' '}
            vs{' '}
            {countUniqueAccounts(game, 'teamB') === 0
              ? 'Bots'
              : countUniqueAccounts(game, 'teamB')}
          </Typography>
        </Grid>
      </Grid>
      {game && (
        <Game info={game} playerData={playerData} gameExpanded={gameExpanded} />
      )}
    </Paper>
  );
}
