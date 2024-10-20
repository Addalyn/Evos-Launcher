import { Grid, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GameData, MapType, PlayerData, ServerData } from '../../lib/Evos';
import Game from './Game';

interface Props {
  info: ServerData;
  // eslint-disable-next-line react/require-default-props
  game?: GameData;
  playerData: Map<number, PlayerData>;
  gameExpanded: string;
}

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

export default function Server({
  info,
  game,
  playerData,
  gameExpanded,
}: Props) {
  const { t } = useTranslation();
  // Hide servers that matches any of these conditions
  // Sinse servers can get stuck in a state, we don't want to show them
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
