/* eslint-disable react/require-default-props */
import { ButtonBase, Tooltip, useTheme } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { CharacterType, PlayerData, denydNames } from '../../lib/Evos';
import { BgImage } from '../generic/BasicComponents';
import { characterIcon } from '../../lib/Resources';

interface CharacterIconProps {
  characterType: CharacterType;
  data?: PlayerData;
  isTeamA: boolean;
  rightSkew?: boolean;
  noTooltip?: boolean;
}

// eslint-disable-next-line import/prefer-default-export
export function CharacterIcon({
  characterType,
  data,
  isTeamA,
  rightSkew,
  noTooltip,
}: CharacterIconProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const handleClick = () => {
    if (!data) {
      return;
    }
    if (!denydNames.includes(data.handle)) {
      navigate(`/playerstats?player=${encodeURIComponent(data.handle)}`);
    }
  };
  let transformOuter;
  let transformInner;
  if (isTeamA || rightSkew) {
    // @ts-ignore
    transformOuter = theme.transform.skewA;
    // @ts-ignore
    transformInner = theme.transform.skewB;
  } else {
    // @ts-ignore
    transformOuter = theme.transform.skewB;
    // @ts-ignore
    transformInner = theme.transform.skewA;
  }
  const borderColor = isTeamA
    ? // @ts-ignore
      theme.palette.teamA.main
    : // @ts-ignore
      theme.palette.teamB.main;
  const handle = data?.handle ?? 'UNKNOWN';

  const content = (
    <ButtonBase
      onClick={handleClick}
      focusRipple
      style={{
        width: 80,
        height: 50,
        transform: transformOuter,
        overflow: 'hidden',
        borderColor,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 4,
        backgroundColor: '#333',
        margin: 2,
      }}
    >
      <div
        style={{
          transform: transformInner,
          width: '115%',
          height: '100%',
          flex: 'none',
        }}
      >
        <BgImage
          style={{
            backgroundImage: `url(${characterIcon(characterType)})`,
          }}
        />
      </div>
    </ButtonBase>
  );

  if (noTooltip) {
    return content;
  }

  return (
    <Tooltip title={handle} arrow>
      {content}
    </Tooltip>
  );
}
