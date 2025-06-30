/**
 * @fileoverview Player Component for displaying detailed player information with custom styling and banners.
 *
 * This component renders player profiles with custom banners, special role styling (MVP, Developer, etc.),
 * faction ribbons, mentor icons, and dynamic titles. Supports skewed transforms, interactive navigation
 * to player statistics, and rich text formatting for player titles.
 */

import { useEffect, useState } from 'react';
import { ButtonBase, Typography, styled, useTheme, Theme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BannerType,
  mentorIcon,
  playerBanner,
  trustIcon,
} from '../../lib/Resources';
import {
  PlayerData,
  denydNames,
  getBanners,
  getSpecialNames,
} from '../../lib/Evos';
import { BgImage } from '../generic/BasicComponents';
import { strapiClient } from 'renderer/lib/strapi';

/**
 * Extended theme interface with custom transform and team palette properties
 */
interface ExtendedTheme extends Theme {
  transform: {
    skewA: string;
    skewB: string;
  };
  palette: Theme['palette'] & {
    teamA: {
      main: string;
      dark: string;
    };
    teamB: {
      main: string;
      dark: string;
    };
  };
}

/**
 * Props for the Player component
 */
interface Props {
  /** Player data containing handle, status, and game information */
  info: PlayerData | undefined;
  /** Whether to disable skew transformation */
  disableSkew: boolean;
  /** Character type being played */
  characterType: string | undefined;
  /** Legacy title parameter */
  titleOld: string;
}

/**
 * Interface for special player names categorized by type
 */
interface SpecialNames {
  /** Tournament winners */
  TournamentWinners: string[];
  /** Development team members */
  Developers: string[];
  /** MVP players */
  MVP: string[];
  /** Nitro subscribers */
  Nitro: string[];
  /** Special recognition players */
  Special: string[];
  /** Mentor players */
  Mentor: string[];
}

/**
 * Interface for custom banner data from API
 */
interface BannersQuery {
  /** Unique identifier */
  id: number;
  /** Player handle/username */
  handle: string;
  /** Banner image URL */
  banner: string;
}

/**
 * Styled wrapper for text overlays on player banners
 */
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

/**
 * Interface for title data items from the API
 */
interface DataItem {
  /** Unique identifier */
  id: number;
  /** Player handle/username */
  handle: string;
  /** Player title text */
  title: string;
}

/**
 * Cache for storing fetched title data with expiry
 */
const titleCache = new Map<string, { data: DataItem[]; expiry: number }>();

/**
 * Fetches player title data from the API with caching
 *
 * @param playerName - The player's handle to fetch titles for
 * @returns Promise resolving to array of title data items
 */
async function fetchTitle(playerName: string): Promise<DataItem[]> {
  const cacheKey = playerName.toLowerCase(); // Normalize case for consistency
  const cached = titleCache.get(cacheKey);

  if (cached && Date.now() < cached.expiry) {
    return cached.data; // Return cached data if still valid
  }

  try {
    const strapi = strapiClient
      .from<DataItem>(`titles`)
      .select(['title'])
      .contains('handle', playerName);

    strapi.paginate(1, 100000);

    const { data, error } = (await strapi.get()) as {
      data: DataItem[];
      error: unknown;
    };

    if (error) {
      return [];
    }

    // Store in cache with 10-minute expiry
    titleCache.set(cacheKey, {
      data: data ?? [],
      expiry: Date.now() + 10 * 60 * 1000,
    });

    return data ?? [];
  } catch (error) {
    return [];
  }
}

/**
 * Lightens a color for better visibility in UI elements
 *
 * @param color - Color name to lighten
 * @returns RGB color string with lighter variant
 */
function lightenColor(color: string): string {
  const colorMap: Record<string, string> = {
    red: 'rgb(255, 150, 150)',
    orange: 'rgb(255, 180, 130)',
    yellow: 'rgb(255, 255, 180)',
    green: 'rgb(180, 255, 180)',
    blue: 'rgb(180, 220, 255)',
    purple: 'rgb(220, 180, 255)',
  };

  return colorMap[color.toLowerCase()] || color; // Default to original if not in map
}

/**
 * Converts Unity rich text markup to HTML for web display
 *
 * @param unityText - Unity rich text string with markup tags
 * @returns HTML string with equivalent styling
 */
function convertUnityRichTextToHTML(unityText: string): string {
  return unityText
    .replace(/<size=\d+>|<\/size>|<sprite=\d+>/g, '') // Remove size and sprite tags
    .replace(/<color=(.*?)>(.*?)<\/color>/g, (_, color, text) => {
      return `<span style="color:${lightenColor(color)};">${text}</span>`;
    });
}

/**
 * Player Component
 *
 * Displays a player's information including their handle, title, character type,
 * special styling based on player status (MVP, Developer, etc.), and custom banners.
 * Supports navigation to player statistics when clicked.
 *
 * @param props - Player component props
 * @returns A styled player display with banner, text overlays, and interactive elements
 */
function Player({
  info = undefined,
  disableSkew = false,
  characterType = undefined,
  titleOld = '',
}: Props) {
  const { t } = useTranslation();
  const [specialNames, setSpecialNames] = useState<SpecialNames>();
  const [customBanner, setCustomBanner] = useState<BannersQuery[]>();
  const [title, setTitle] = useState<string>(titleOld || '');

  // Parse username and discriminator from handle
  let username = t('offline');
  let discriminator: string | undefined;
  if (info) {
    [username, discriminator] = info.handle.split('#', 2);
  }

  const navigate = useNavigate();

  /**
   * Handles click events on the player component
   * Navigates to player statistics if valid player data exists
   */
  const handleClick = (): void => {
    if (!info) {
      return;
    }
    if (!denydNames.includes(info.handle)) {
      navigate(`/playerstats?player=${encodeURIComponent(info.handle)}`);
    }
  };

  const theme = useTheme() as ExtendedTheme;

  // Load special names and custom banners only when info.handle changes
  useEffect(() => {
    if (!info?.handle) return;
    getSpecialNames()
      .then((response) => {
        setSpecialNames(response || undefined);
        return response;
      })
      .catch(() => {
        // Silent error handling for special names
      });
    getBanners()
      .then((response) => {
        setCustomBanner(response || undefined);
        return response;
      })
      .catch(() => {
        // Silent error handling for banners
      });
  }, [info?.handle]);

  // Only fetch title when username changes
  useEffect(() => {
    if (t('offline') !== username) {
      fetchTitle(username)
        .then((response) => {
          if (response.length > 0) {
            const htmlTitle = convertUnityRichTextToHTML(response[0].title);
            setTitle(htmlTitle);
          }
          return response;
        })
        .catch(() => {
          // noting
        });
    }
  }, [username, t]);

  let className = '';
  let mentor = false;
  let developer = false;
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
    developer = true;
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
  if (specialNames?.Mentor?.find((x) => x === info?.handle)) {
    className += disableSkew
      ? 'glow-on-hover mentor'
      : 'glow-on-hover mentorSkew';
    mentor = true;
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
          transform: disableSkew ? 'none' : theme.transform.skewA,
          overflow: 'hidden',
          border: '2px solid black',
        }}
      >
        <div
          style={{
            transform: disableSkew ? 'none' : theme.transform.skewB,
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
                `url(${customBanner?.find((x) => x.handle === info.handle)?.banner || playerBanner(BannerType.background, denydNames.includes(info.handle) ? 95 : info.bannerBg)})`,
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
              `url(${customBanner?.find((x) => x.handle === info.handle) ? '' : playerBanner(BannerType.foreground, denydNames.includes(info.handle) ? 65 : info.bannerFg)})`,
            width: '36%',
            zIndex: 0,
          }}
        />
        <ImageTextWrapper
          style={{
            fontSize: '2.5em',
          }}
        >
          <Typography
            component="span"
            style={{ fontSize: username.length > 18 ? '0.8em' : '1em' }}
          >
            {mentor ? (
              <img
                style={{
                  width: 28,
                  height: 28,
                  padding: '0px',
                  zIndex: 1000,
                  flex: 'none',
                  margin: '-5px -3px -8px -5px',
                  transform: disableSkew ? 'none' : theme.transform.skewA,
                }}
                src={mentorIcon()}
                alt="Avatar"
              />
            ) : (
              ''
            )}
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
            <Typography
              component="span"
              style={{ fontSize: '1em' }}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  if (denydNames.includes(info.handle)) {
                    return 'Bot';
                  }
                  if (
                    title &&
                    info?.status !== 'Queued' &&
                    info?.status !== 'Character Select' &&
                    info?.status !== 'In Game'
                  ) {
                    return title;
                  }

                  if (typeof info?.status === 'number') {
                    if (mentor && developer) {
                      return t(`titles.mentorDev`);
                    }
                    if (mentor) {
                      return t(`titles.mentor`);
                    }
                    return t(`titles.${String(info.status)}`);
                  }

                  if (info?.status === '') {
                    return t('online');
                  }
                  if (info?.status === undefined) {
                    return '';
                  }

                  let mentorPrefix = '';
                  if (mentor && developer) {
                    mentorPrefix = `${t('titles.mentorDev')}/`;
                  } else if (mentor) {
                    mentorPrefix = `${t('titles.mentor')}/`;
                  }

                  return `${mentorPrefix}${t(`${info?.status}`)}`;
                })(),
              }}
            />
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
                  marginLeft: '146px',
                  marginBottom: '-5px',
                }}
              >
                <img
                  style={{
                    width: 21,
                    height: 21,
                    padding: '0px',
                    zIndex: 1000,
                    flex: 'none',
                    backgroundColor: bcolor,
                    transform: disableSkew ? 'none' : theme.transform.skewA,
                    border: `1px solid ${tcolor}`,
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
