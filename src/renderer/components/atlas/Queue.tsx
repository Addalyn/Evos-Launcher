/**
 * @fileoverview Queue Component for displaying game queues with their associated player groups.
 *
 * This component renders queue information including type, subtype, and all groups of players
 * waiting in the queue. Supports filtering of hidden players and displays empty state handling.
 * Groups are rendered in a flexible layout using the Group component.
 */

import { Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GroupData, PlayerData, QueueData } from '../../lib/Evos';
import Group from './Group';
import { FlexBox } from '../generic/BasicComponents';

/**
 * Props for the Queue component
 */
interface Props {
  /** Queue information including type, subtype, and group IDs */
  queueInfo: QueueData;
  /** Map of group data indexed by group ID */
  groupData: Map<number, GroupData>;
  /** Map of player data indexed by account ID */
  playerData: Map<number, PlayerData>;
  /** Set of player account IDs to hide from display */
  hidePlayers: Set<number> | undefined;
}

/**
 * Queue Component
 *
 * Displays a queue with its type, subtype, and all groups of players waiting in the queue.
 * Groups can be filtered based on hidden players. Returns null if the queue is empty.
 *
 * @param props - Queue component props
 * @returns A Paper containing queue information and player groups, or null if empty
 */
function Queue({
  queueInfo,
  groupData,
  playerData,
  hidePlayers = undefined,
}: Props) {
  const { t } = useTranslation();

  if (queueInfo.groupIds.length === 0) {
    return null;
  }

  // Filter groups to only include those with visible players
  const validGroups = queueInfo.groupIds.filter((groupId) => {
    const info = groupData.get(groupId);
    if (!info) return false;
    const filteredAccountIds = info.accountIds.filter((accId) => {
      if (hidePlayers?.has(accId)) return false;
      const pdata = playerData.get(accId);
      // If PlayerData has a status or gameId property, use that to check if in game
      // Otherwise, fallback to always show
      if (pdata && 'inGame' in pdata) {
        // @ts-ignore
        return !pdata.inGame;
      }
      if (pdata && 'gameId' in pdata) {
        // @ts-ignore
        return !pdata.gameId;
      }
      if (pdata && 'status' in pdata) {
        // @ts-ignore
        return pdata.status !== 'in-game' && pdata.status !== 'playing';
      }
      return true;
    });
    return filteredAccountIds.length > 0;
  });

  // If no valid groups after filtering, don't render
  if (validGroups.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 1, sm: 1 },
        m: { xs: '1em' },
        overflow: 'hidden',
        minWidth: 320,
        mx: 'auto',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: 'main',
          letterSpacing: 1.5,
          textShadow: '0 2px 12px rgba(0,0,0,0.10)',
          mb: 1,
          pl: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
        noWrap
      >
        {t(queueInfo.type)}{' '}
        {queueInfo.subtype ? `- ${t(`gamesubtype.${queueInfo.subtype}`)}` : ''}
      </Typography>
      <FlexBox
        sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}
      >
        {queueInfo.groupIds.map((groupId) => {
          const info = groupData.get(groupId);
          // Filter out players who are in a game
          const filteredAccountIds = info
            ? info.accountIds.filter((accId) => {
                if (hidePlayers?.has(accId)) return false;
                const pdata = playerData.get(accId);
                // If PlayerData has a status or gameId property, use that to check if in game
                // Otherwise, fallback to always show
                if (pdata && 'inGame' in pdata) {
                  // @ts-ignore
                  return !pdata.inGame;
                }
                if (pdata && 'gameId' in pdata) {
                  // @ts-ignore
                  return !pdata.gameId;
                }
                if (pdata && 'status' in pdata) {
                  // @ts-ignore
                  return (
                    pdata.status !== 'in-game' && pdata.status !== 'playing'
                  );
                }
                return true;
              })
            : [];
          if (!info || filteredAccountIds.length === 0) return null;
          // Clone info with filtered accountIds
          const filteredInfo = { ...info, accountIds: filteredAccountIds };
          return (
            <Group
              key={`group_${groupId}`}
              info={filteredInfo}
              playerData={playerData}
            />
          );
        })}
      </FlexBox>
    </Paper>
  );
}

export default Queue;
