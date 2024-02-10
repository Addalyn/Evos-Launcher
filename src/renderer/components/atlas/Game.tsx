/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/require-default-props */
import {
  Box,
  Collapse,
  Slide,
  Stack,
  styled,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';
import {
  CharacterType,
  GameData,
  GamePlayerData,
  PlayerData,
} from '../../lib/Evos';
import { FlexBox } from '../generic/BasicComponents';
import { mapMiniPic } from '../../lib/Resources';
import Player from './Player';
import { CharacterIcon } from './CharacterIcon';
import { useTranslation } from 'react-i18next';

export const TeamFlexBox = styled(FlexBox)(() => ({
  paddingLeft: 20,
  paddingRight: 20,
  width: '40%',
  flexWrap: 'wrap',
}));

interface TeamProps {
  caption?: string;
  info: GamePlayerData[];
  isTeamA: boolean;
  playerData: Map<number, PlayerData>;
  status: string;
}

const TeamRow = React.forwardRef(
  ({ info, isTeamA, playerData, status }: TeamProps, ref) => {
    return (
      <TeamFlexBox ref={ref} flexGrow={1} flexShrink={1} flexBasis="auto">
        {info.map((player, id) => (
          <CharacterIcon
            key={`teamA_${id}`}
            characterType={
              status !== 'Assembling'
                ? player.characterType
                : CharacterType.None
            }
            data={playerData.get(player.accountId)}
            isTeamA={isTeamA}
          />
        ))}
      </TeamFlexBox>
    );
  },
);

function Team({ caption, info, isTeamA, playerData, status }: TeamProps) {
  return (
    <Stack>
      {caption && <Typography variant="h5">{caption}</Typography>}
      {info.map((p, id) => (
        <Stack key={`teamA_${id}`} direction={isTeamA ? 'row' : 'row-reverse'}>
          <Player info={playerData.get(p.accountId)} />
          <CharacterIcon
            characterType={
              status !== 'Assembling' ? p.characterType : CharacterType.None
            }
            data={playerData.get(p.accountId)}
            isTeamA={isTeamA}
            rightSkew
            noTooltip
          />
        </Stack>
      ))}
    </Stack>
  );
}

function statusString(info: GameData, t: any) {
  if (info.status === 'Started') {
    return `${t('turn')} ${info.turn}`;
  }
  if (info.turn === 0) {
    return t(info.status);
  }
  return `${t(info.status)} (${t('turn')} ${info.turn})`;
}

interface Props {
  info: GameData;
  playerData: Map<number, PlayerData>;
  expanded?: boolean;
}

export default function Game({ info, playerData, expanded }: Props) {
  const { t } = useTranslation();

  const A = {
    caption: t('teamA'),
    info: info.teamA,
    playerData,
    isTeamA: true,
    status: info.status,
  };
  const B = {
    caption: t('teamB'),
    info: info.teamB,
    playerData,
    isTeamA: false,
    status: info.status,
  };

  const theme = useTheme();

  const [collapsed, setCollapsed] = useState<boolean>(!expanded);

  return (
    <Stack width="100%">
      <FlexBox>
        <Slide in={collapsed} direction="right" mountOnEnter unmountOnExit>
          <TeamRow {...A} />
        </Slide>
        <Tooltip title={`${t(`maps.${info.map}`)} ${info.ts}`} arrow>
          <Box
            flexBasis={120}
            onClick={() => setCollapsed((x) => !x)}
            style={{
              backgroundImage: `url(${mapMiniPic(info.map)})`,
              backgroundSize: 'cover',
              borderColor: 'white',
              borderWidth: 2,
              borderStyle: 'solid',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column', // Add this line to stack items vertically
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3">
              <span
                // @ts-ignore
                style={{ textShadow: `2px 2px ${theme.palette.teamA.main}` }}
              >
                {info.teamAScore}
              </span>
              <span> - </span>
              <span
                // @ts-ignore
                style={{ textShadow: `2px 2px ${theme.palette.teamB.dark}` }}
              >
                {info.teamBScore}
              </span>
            </Typography>
            <Typography
              variant="caption"
              component="div"
              style={{
                textShadow:
                  '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
                marginTop: -10,
              }}
            >
              {statusString(info, t)}
            </Typography>
          </Box>
        </Tooltip>
        <Slide in={collapsed} direction="left" mountOnEnter unmountOnExit>
          <TeamRow {...B} />
        </Slide>
      </FlexBox>
      <Collapse in={!collapsed}>
        <FlexBox style={{ justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <Team {...A} />
          <Team {...B} />
        </FlexBox>
      </Collapse>
    </Stack>
  );
}
