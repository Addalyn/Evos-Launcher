import { Paper, Typography } from '@mui/material';
import { GroupData, PlayerData, QueueData } from '../../lib/Evos';
import Group from './Group';
import { FlexBox } from '../generic/BasicComponents';
import { useTranslation } from 'react-i18next';

interface Props {
  queueInfo: QueueData;
  groupData: Map<number, GroupData>;
  playerData: Map<number, PlayerData>;
  // eslint-disable-next-line react/require-default-props
  hidePlayers?: Set<number>;
}

function Queue({ queueInfo, groupData, playerData, hidePlayers }: Props) {
  const { t } = useTranslation();

  if (queueInfo.groupIds.length === 0) {
    return null;
  }
  return (
    <Paper elevation={3} style={{ padding: '1em', margin: '1em' }}>
      <Typography variant="h3">{t(queueInfo.type)}</Typography>
      <FlexBox style={{ flexWrap: 'wrap' }}>
        {queueInfo.groupIds.map((groupId) => {
          const info = groupData.get(groupId);
          const hidden =
            info &&
            info.accountIds.length > 1 &&
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
