/**
 * @fileoverview Group Component for displaying a collection of players in a game group.
 *
 * This component renders a list of players that belong to the same group, filtering out
 * players who are currently in-game. Each player is displayed using the Player component
 * within a Material-UI List structure.
 */
import { List, ListItem } from '@mui/material';
import { GroupData, PlayerData } from '../../lib/Evos';
import Player from './Player';

/**
 * Props for the Group component
 */
interface Props {
  /** Group data containing member account IDs */
  info: GroupData;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Map of account ID to the asymmetric subtype to show as the player's status */
  playerAsymmetricSubtypes: Map<number, string> | undefined;
}

/**
 * Group Component
 *
 * Displays a list of players in a group, filtering out players currently in game.
 * Each player is rendered using the Player component within a list item.
 *
 * @param props - Group component props
 * @returns A List containing player components for group members not in game
 */
function Group({
  info,
  playerData,
  playerAsymmetricSubtypes = undefined,
}: Props) {
  return (
    <List style={{ padding: 0 }}>
      {info.accountIds.map((accountId) => {
        const player = playerData.get(accountId);
        if (player?.status !== 'In Game') {
          const asymmetricSubtype = playerAsymmetricSubtypes?.get(accountId);
          return (
            <ListItem disablePadding key={`player_${accountId}`}>
              <Player
                info={
                  player && asymmetricSubtype
                    ? { ...player, status: asymmetricSubtype }
                    : player
                }
                disableSkew={false}
                characterType={undefined}
                titleOld=""
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
