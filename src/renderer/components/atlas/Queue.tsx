import { Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GroupData, PlayerData, QueueData } from '../../lib/Evos';
import Group from './Group';
import { FlexBox } from '../generic/BasicComponents';

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
