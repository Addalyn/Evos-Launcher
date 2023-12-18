/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-no-useless-fragment */
import { List, ListItem } from '@mui/material';
import { GroupData, PlayerData } from '../../lib/Evos';
import Player from './Player';

interface Props {
  info: GroupData;
  playerData: Map<number, PlayerData>;
}

function Group({ info, playerData }: Props) {
  return (
    <List style={{ padding: 4 }}>
      {info.accountIds.map((accountId) => {
        if (playerData.get(accountId)?.status !== 'In Game') {
          return (
            <ListItem disablePadding key={`player_${accountId}`}>
              <Player info={playerData.get(accountId)} />
            </ListItem>
          );
        }
        return null;
      })}
    </List>
  );
}

export default Group;
