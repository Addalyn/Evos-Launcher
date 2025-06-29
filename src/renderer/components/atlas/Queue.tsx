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

  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      <Typography variant="h3">
        {t(queueInfo.type)}{' '}
        {queueInfo.subtype ? `- ${t(`gamesubtype.${queueInfo.subtype}`)}` : ''}
      </Typography>
      <FlexBox style={{ flexWrap: 'wrap' }}>
        {queueInfo.groupIds.map((groupId) => {
          const info = groupData.get(groupId);
          const hidden =
            info &&
            hidePlayers &&
            !info.accountIds.some((accId) => !hidePlayers.has(accId));
          return (
            info &&
            !hidden && (
              <Group
                key={`group_${groupId}`}
                info={info}
                playerData={playerData}
              />
            )
          );
        })}
      </FlexBox>
    </Paper>
  );
}

export default Queue;
