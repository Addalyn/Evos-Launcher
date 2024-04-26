/* eslint-disable import/order */
import { BannerType, playerBanner, trustIcon } from '../../lib/Resources';
import { ButtonBase, Typography, styled, useTheme } from '@mui/material';
import { PlayerData, denydNames, getSpecialNames } from '../../lib/Evos';
/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-no-useless-fragment */
import { useEffect, useState } from 'react';

import { BgImage } from '../generic/BasicComponents';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  info?: PlayerData;
  disableSkew?: boolean;
  characterType?: string;
}

interface SpecialNames {
  TournamentWinners: string[];
  Developers: string[];
  MVP: string[];
  Nitro: string[];
  Special: string[];
}

const ImageTextWrapper = styled('span')(({ theme }) => ({
  position: 'absolute',
  left: '28%',
  color: theme.palette.common.white,
  textAlign: 'left',
  fontStretch: 'condensed',
  width: '100%',
  textShadow:
    '1px 1px 2px black, -1px -1px 2px black, 1px -1px 2px black, -1px 1px 2px black',
}));

function Player({ info, disableSkew, characterType }: Props) {
  const { t } = useTranslation();
  const [specialNames, setSpecialNames] = useState<SpecialNames>();

  let username = t('offline');
  let discriminator;
  if (info) {
    [username, discriminator] = info.handle.split('#', 2);
  }
  const navigate = useNavigate();
  const handleClick = () => {
    if (!info) {
      return;
    }
    if (!denydNames.includes(info.handle)) {
      navigate(`/playerstats?player=${encodeURIComponent(info.handle)}`);
    }
  };

  const theme = useTheme();

  useEffect(() => {
    getSpecialNames()
      .then((response) => {
        setSpecialNames(response);
        return response;
      })
      .catch(() => {
        // noting
      });
  }, [info]);

  let className = '';
  if (specialNames?.TournamentWinners?.find((x) => x === info?.handle)) {
    className += disableSkew
      ? 'glow-on-hover champion'
      : 'glow-on-hover championSkew';
  }
  if (specialNames?.MVP?.find((x) => x === info?.handle)) {
    className += disableSkew ? 'glow-on-hover mvp' : 'glow-on-hover mvpSkew';
  }
  if (specialNames?.Developers?.find((x) => x === info?.handle)) {
    className += disableSkew
      ? 'glow-on-hover developer'
      : 'glow-on-hover developerSkew';
  }
  if (specialNames?.Nitro?.find((x) => x === info?.handle)) {
    className += disableSkew
      ? 'glow-on-hover nitro'
      : 'glow-on-hover nitroSkew';
  }
  if (specialNames?.Special?.find((x) => x === info?.handle)) {
    className += disableSkew
      ? 'glow-on-hover special'
      : 'glow-on-hover specialSkew';
  }
  return (
    <div
      className={className}
      style={{
        width: 240,
        height: 52,
        fontSize: '8px',
        position: 'relative',
        display: 'inline-flex',
        opacity: 1,
      }}
    >
      <ButtonBase
        focusRipple
        key={info?.handle}
        onClick={handleClick}
        style={{
          width: 240,
          height: 52,
          fontSize: '8px',
          // @ts-ignore
          transform: disableSkew ?? theme.transform.skewA,
          overflow: 'hidden',
          border: '2px solid black',
        }}
      >
        <div
          style={{
            // @ts-ignore
            transform: disableSkew ?? theme.transform.skewB,
            width: '106%',
            height: '100%',
            flex: 'none',
          }}
        >
          <BgImage
            style={{
              zIndex: '0',
              backgroundImage:
                info &&
                `url(${playerBanner(BannerType.background, denydNames.includes(info.handle) ? 95 : info.bannerBg)})`,
            }}
          />
        </div>
      </ButtonBase>
      <div
        style={{
          width: 238,
          height: 49,
          overflow: 'hidden',
          position: 'absolute',
          top: 2,
          pointerEvents: 'none',
        }}
      >
        <BgImage
          style={{
            marginTop: '-3%',
            marginLeft: '-4%',
            backgroundImage:
              info &&
              `url(${playerBanner(BannerType.foreground, denydNames.includes(info.handle) ? 65 : info.bannerFg)})`,
            width: '36%',
            zIndex: 0,
          }}
        />
        <ImageTextWrapper
          style={{
            fontSize: '2.5em',
          }}
        >
          <Typography component="span" style={{ fontSize: '1em' }}>
            {username === 'Bot' ? characterType : username}
          </Typography>
          {discriminator && (
            <Typography component="span" style={{ fontSize: '0.8em' }}>
              #{discriminator}
            </Typography>
          )}
        </ImageTextWrapper>
        {info && (
          <ImageTextWrapper
            style={{
              bottom: '8%',
              fontSize: '1.7em',
            }}
          >
            <Typography component="span" style={{ fontSize: '1em' }}>
              {(() => {
                if (denydNames.includes(info.handle)) {
                  return 'Bot';
                }
                if (typeof info?.status === 'number') {
                  // @ts-ignore
                  return t(`titles.${info?.status}`);
                }
                if (info?.status === '') {
                  return t('online');
                }
                if (info?.status === undefined) {
                  return '';
                }
                return t([`${info?.status}`]);
              })()}
            </Typography>
          </ImageTextWrapper>
        )}
        {info?.factionData?.selectedRibbonID !== undefined &&
          info?.factionData?.selectedRibbonID !== -1 &&
          info?.factionData?.selectedRibbonID <= 3 &&
          !denydNames.includes(info.handle) &&
          (() => {
            let bcolor;
            let tcolor;
            let faction = 'evos';

            if (info.factionData.selectedRibbonID === 2) {
              bcolor = '#843bbb';
              tcolor = '#b57ae0';
              faction = 'omni';
            }
            if (info.factionData.selectedRibbonID === 1) {
              bcolor = '#327d7b';
              tcolor = '#4fcfcc';
              faction = 'evos';
            }
            if (info.factionData.selectedRibbonID === 3) {
              bcolor = '#919257';
              tcolor = '#f4f779';
              faction = 'warbotics';
            }

            return (
              <ImageTextWrapper
                style={{
                  bottom: '2%',
                  fontSize: '1.7em',
                  zIndex: 1000,
                  marginLeft: '143px',
                  marginBottom: '-5px',
                }}
              >
                <img
                  style={{
                    width: 25,
                    height: 25,
                    padding: '0px',
                    zIndex: 1000,
                    flex: 'none',
                    backgroundColor: bcolor,
                    // @ts-ignore
                    transform: disableSkew ?? theme.transform.skewA,
                    border: `1px solid ${tcolor}`, // Fix the border property
                  }}
                  alt="Avatar"
                  src={trustIcon(faction)}
                />
              </ImageTextWrapper>
            );
          })()}
      </div>
    </div>
  );
}

export default Player;
