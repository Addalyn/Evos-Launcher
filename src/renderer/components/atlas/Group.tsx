/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-no-useless-fragment */
import { List, ListItem } from '@mui/material';
import { GroupData, PlayerData } from '../../lib/Evos';
import Player from './Player';

interface Props {
  info: GroupData;
  playerData: Map<number, PlayerData>;
  hidePlayers?: Set<number>;
}

function Group({ info, playerData, hidePlayers }: Props) {
  return (
    <List style={{ padding: 4 }}>
      {info.accountIds.map((accountId) => {
        if (playerData.get(accountId)?.status !== 'In Game') {
          return (
            <ListItem disablePadding key={`player_${accountId}`}>
              <Player
                info={playerData.get(accountId)}
                greyOut={hidePlayers && hidePlayers.has(accountId)}
              />
            </ListItem>
          );
        }
        return null;
      })}
    </List>
  );
}

export default Group;
