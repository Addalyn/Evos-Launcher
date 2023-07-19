import { Paper, Typography } from '@mui/material';
import { GameData, MapType, PlayerData, ServerData } from '../../lib/Evos';
import Game from './Game';

interface Props {
  info: ServerData;
  // eslint-disable-next-line react/require-default-props
  game?: GameData;
  playerData: Map<number, PlayerData>;
}

export default function Server({ info, game, playerData }: Props) {
  if (game === undefined) {
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
      <Typography variant="h3">{info.name.replace(/-/, ' ')}</Typography>

      {game && <Game info={game} playerData={playerData} expanded={false} />}
    </Paper>
  );
}
