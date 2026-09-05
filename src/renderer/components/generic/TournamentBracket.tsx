/**
 * @fileoverview TournamentBracket component for the Evos Launcher
 * Displays an interactive live bracket tree that dynamically adapts to maxPlayers
 * configured in Strapi, visualizes player vs player matches across rounds,
 * and polls live score and winner updates from the database.
 *
 * @author Evos Launcher Team
 * @since 3.3.5
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  AccountTree,
  AdminPanelSettings,
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  EmojiEvents,
  FiberManualRecord,
  MilitaryTech,
  Refresh,
  SportsEsports,
  Tv,
  ViewAgenda,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import EvosStore from 'renderer/lib/EvosStore';
import { getSpecialNames } from 'renderer/lib/Evos';
import { strapiClient } from 'renderer/lib/strapi';

/**
 * Interface representing a player entry in the tournament bracket
 */
export interface TournamentPlayer {
  id: string | number;
  handle: string;
  name?: string;
  seed?: number;
  score?: number;
  avatar?: string;
  character?: string;
}

/**
 * Interface representing a head-to-head match in the bracket
 */
export interface TournamentMatch {
  id: string | number;
  round: number;
  roundName: string;
  matchNumber: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  score1?: number;
  score2?: number;
  winnerHandle?: string | null;
  status: 'scheduled' | 'live' | 'completed';
  scheduledTime?: string;
  streamUrl?: string;
  roomCode?: string;
  nextMatchId?: string | number | null;
}

/**
 * Interface representing a tournament object stored in Strapi
 */
export interface TournamentData {
  id?: number;
  title: string;
  game?: string;
  slug?: string;
  status: 'upcoming' | 'live' | 'completed';
  maxPlayers: number;
  currentRound?: string;
  startDate?: string;
  description?: string;
  streamUrl?: string;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  champion?: string | TournamentPlayer;
}

/**
 * Default sample tournament dataset (8 players) used for fallback preview and Strapi population
 */
export const SAMPLE_TOURNAMENT_8: TournamentData = {
  id: 1,
  title: 'EvoS Summer Championship 2026',
  game: 'Draft',
  slug: 'evos-summer-championship-2026',
  status: 'upcoming',
  maxPlayers: 8,
  currentRound: 'Round 1',
  startDate: '2026-09-12T18:00:00.000Z',
  description:
    'Official EvoS 4v4 Competitive Tournament with live bracket progression.',
  streamUrl: '',
  champion: '',
  players: [],
  matches: [],
};

/**
 * Sample 4-Player dataset
 */
export const SAMPLE_TOURNAMENT_4: TournamentData = {
  id: 2,
  title: 'EvoS Blitz Cup (4 Players)',
  game: 'Fourlancer',
  slug: 'evos-blitz-cup-4',
  status: 'upcoming',
  maxPlayers: 4,
  currentRound: 'Round 1',
  startDate: '2026-09-20T19:00:00.000Z',
  players: [],
  matches: [],
};

/**
 * Props for BracketMatchCard
 */
interface BracketMatchCardProps {
  match: TournamentMatch;
  fullWidth?: boolean;
  isFinalRound?: boolean;
}

/**
 * Single Match Card component in the bracket
 */
function BracketMatchCard({
  match,
  fullWidth = false,
  isFinalRound = false,
}: BracketMatchCardProps): React.ReactElement {
  const { t } = useTranslation();
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  let cardWidth: string | number = 250;
  let cardMaxWidth: string | number = 250;
  let cardMarginX: string | undefined;

  if (fullWidth) {
    cardWidth = '100%';
    cardMaxWidth = '100%';
    cardMarginX = undefined;
  }

  let advancementText = '';
  let advancementIcon: React.ReactNode = null;

  if (fullWidth) {
    if (match.nextMatchId) {
      advancementText = t(
        'tournament.advancesTo',
        'Winner advances to Match #{{matchNumber}}',
        { matchNumber: match.nextMatchId },
      );
      advancementIcon = (
        <ChevronRight sx={{ fontSize: 16, color: 'text.disabled' }} />
      );
    } else if (isFinalRound) {
      advancementText = t(
        'tournament.advancesToChampion',
        'Winner crowned Champion',
      );
      advancementIcon = <EmojiEvents sx={{ fontSize: 16, color: '#f59e0b' }} />;
    } else {
      advancementText = t(
        'tournament.advancesToNextRound',
        'Winner advances to Next Round',
      );
      advancementIcon = (
        <ChevronRight sx={{ fontSize: 16, color: '#f59e0b' }} />
      );
    }
  }

  return (
    <Card
      elevation={0}
      sx={{
        width: cardWidth,
        maxWidth: cardMaxWidth,
        mx: cardMarginX,
        boxSizing: 'border-box',
        borderRadius: '12px',
        background: isLive
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(18, 18, 18, 0.9) 100%)'
          : 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
        border: isLive
          ? '1.5px solid rgba(239, 68, 68, 0.7)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isLive
          ? '0 0 20px rgba(239, 68, 68, 0.3)'
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: isLive ? '#ef4444' : 'rgba(245, 158, 11, 0.5)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        },
      }}
    >
      {/* Header bar: Match Number & Status */}
      <Box
        sx={{
          px: 1.5,
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          Match #{match.matchNumber}{' '}
          {match.scheduledTime ? `• ${match.scheduledTime}` : ''}
        </Typography>

        {isLive && (
          <Chip
            size="small"
            icon={
              <FiberManualRecord
                sx={{ fontSize: '10px !important', color: '#ef4444' }}
              />
            }
            label="LIVE"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 800,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        )}
        {isCompleted && (
          <Chip
            size="small"
            label="FINAL"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 700,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        )}
        {!isLive && !isCompleted && (
          <Chip
            size="small"
            label="UPCOMING"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'text.secondary',
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        )}
      </Box>

      {/* Match Competitors: Player 1 VS Player 2 */}
      <CardContent sx={{ p: 1.2, '&:last-child': { pb: 1.2 } }}>
        {/* Player 1 Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0.8,
            borderRadius: '6px',
            backgroundColor:
              match.winnerHandle && match.player1?.handle === match.winnerHandle
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(255, 255, 255, 0.03)',
            border:
              match.winnerHandle && match.player1?.handle === match.winnerHandle
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid transparent',
            mb: 0.5,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
          >
            {match.player1?.seed && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  minWidth: 16,
                }}
              >
                #{match.player1.seed}
              </Typography>
            )}
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight:
                  match.winnerHandle &&
                  match.player1?.handle === match.winnerHandle
                    ? 700
                    : 500,
                color: match.player1 ? 'text.primary' : 'text.disabled',
              }}
            >
              {match.player1
                ? match.player1.handle
                : t('tournament.tbd', 'TBD')}
            </Typography>
            {match.winnerHandle &&
              match.player1?.handle === match.winnerHandle && (
                <MilitaryTech
                  sx={{ fontSize: 16, color: '#f59e0b', ml: 0.5 }}
                />
              )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color:
                match.winnerHandle &&
                match.player1?.handle === match.winnerHandle
                  ? '#f59e0b'
                  : 'text.secondary',
              px: 1,
            }}
          >
            {match.score1 ?? 0}
          </Typography>
        </Box>

        {/* Divider / VS */}
        <Box sx={{ textAlign: 'center', my: -0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '1px',
              color: 'text.disabled',
            }}
          >
            VS
          </Typography>
        </Box>

        {/* Player 2 Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0.8,
            borderRadius: '6px',
            backgroundColor:
              match.winnerHandle && match.player2?.handle === match.winnerHandle
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(255, 255, 255, 0.03)',
            border:
              match.winnerHandle && match.player2?.handle === match.winnerHandle
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid transparent',
            mt: 0.5,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
          >
            {match.player2?.seed && (
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  minWidth: 16,
                }}
              >
                #{match.player2.seed}
              </Typography>
            )}
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight:
                  match.winnerHandle &&
                  match.player2?.handle === match.winnerHandle
                    ? 700
                    : 500,
                color: match.player2 ? 'text.primary' : 'text.disabled',
              }}
            >
              {match.player2
                ? match.player2.handle
                : t('tournament.tbd', 'TBD')}
            </Typography>
            {match.winnerHandle &&
              match.player2?.handle === match.winnerHandle && (
                <MilitaryTech
                  sx={{ fontSize: 16, color: '#f59e0b', ml: 0.5 }}
                />
              )}
          </Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color:
                match.winnerHandle &&
                match.player2?.handle === match.winnerHandle
                  ? '#f59e0b'
                  : 'text.secondary',
              px: 1,
            }}
          >
            {match.score2 ?? 0}
          </Typography>
        </Box>
      </CardContent>

      {fullWidth && (
        <Box
          sx={{
            px: 1.5,
            py: 0.8,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: match.nextMatchId ? 'text.secondary' : '#f59e0b',
              fontSize: '0.72rem',
              fontWeight: match.nextMatchId ? 500 : 700,
            }}
          >
            {advancementText}
          </Typography>
          {advancementIcon}
        </Box>
      )}
    </Card>
  );
}

BracketMatchCard.defaultProps = {
  fullWidth: false,
  isFinalRound: false,
};

/**
 * Props for the TournamentBracket component
 */
export interface TournamentBracketProps {
  overrideData?: TournamentData | null;
  overrideTournaments?: TournamentData[] | null;
  initialTournamentId?: number | string;
  onRoundChange?: (roundName: string, roundIndex: number) => void;
  onTournamentChange?: (tournament: TournamentData) => void;
}

/**
 * Interface representing an SVG connector line between matches in the bracket tree
 */
interface BracketLine {
  id: string;
  path: string;
  status: 'scheduled' | 'live' | 'completed';
  isWinner: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Generates an SVG path string linking a source match card to a target match card
 * with rounded orthogonal corners or a straight horizontal line.
 */
function createBracketPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius = 8,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const xmid = x1 + dx * 0.5;

  if (Math.abs(dy) < 2) {
    return `M ${x1} ${y1} H ${x2}`;
  }

  const r = Math.min(radius, Math.abs(dy) / 2, dx / 4);

  if (dy > 0) {
    return `M ${x1} ${y1} H ${xmid - r} Q ${xmid} ${y1}, ${xmid} ${y1 + r} V ${y2 - r} Q ${xmid} ${y2}, ${xmid + r} ${y2} H ${x2}`;
  }

  return `M ${x1} ${y1} H ${xmid - r} Q ${xmid} ${y1}, ${xmid} ${y1 - r} V ${y2 + r} Q ${xmid} ${y2}, ${xmid + r} ${y2} H ${x2}`;
}

/**
 * Returns color style for status chips
 */
function getStatusBadgeStyle(status: string): { bg: string; color: string } {
  if (status === 'live') {
    return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
  }
  if (status === 'completed') {
    return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };
  }
  return { bg: 'rgba(255, 255, 255, 0.1)', color: 'text.secondary' };
}

/**
 * Main TournamentBracket component
 */
export default function TournamentBracket({
  overrideData,
  overrideTournaments,
  initialTournamentId,
  onRoundChange,
  onTournamentChange,
}: TournamentBracketProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, activeUser, isDev } = EvosStore();

  // DOM refs for calculating line positions
  const containerRef = useRef<HTMLDivElement | null>(null);
  const matchRefs = useRef<Map<string | number, HTMLElement>>(new Map());
  const podiumRef = useRef<HTMLDivElement | null>(null);

  const [lines, setLines] = useState<BracketLine[]>([]);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [rawTournaments, setTournamentsList] = useState<TournamentData[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    number | string | null
  >(initialTournamentId ?? null);
  const [loading, setLoading] = useState<boolean>(
    overrideData === undefined && !overrideTournaments,
  );
  const [isLivePolling, setIsLivePolling] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isCustomStrapi, setIsCustomStrapi] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState<4 | 8 | 16>(8);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDevUser, setIsDevUser] = useState<boolean>(Boolean(isDev));

  const [viewMode, setViewMode] = useState<'tree' | 'compact'>('compact');
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    if (isDev) {
      setIsDevUser(true);
      return () => {
        isMounted = false;
      };
    }
    if (activeUser?.handle) {
      getSpecialNames()
        .then((special) => {
          if (isMounted && special?.Developers?.includes(activeUser.handle)) {
            setIsDevUser(true);
          }
          return null;
        })
        .catch(() => null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeUser?.handle, isDev]);

  const tournamentsList: TournamentData[] = useMemo(() => {
    if (overrideTournaments && overrideTournaments.length > 0) {
      return overrideTournaments.sort((a, b) => {
        if (a.id && b.id) return b.id - a.id;
        if (a.slug && b.slug) return b.slug.localeCompare(a.slug);
        return 0;
      });
    }
    if (overrideData !== undefined) {
      return overrideData ? [overrideData] : [];
    }
    return rawTournaments.sort((a, b) => {
      if (a.id && b.id) return b.id - a.id;
      if (a.slug && b.slug) return b.slug.localeCompare(a.slug);
      return 0;
    });
  }, [overrideTournaments, overrideData, rawTournaments]);

  const effectiveTournament: TournamentData | null = useMemo(() => {
    if (overrideData !== undefined && !overrideTournaments) {
      return overrideData;
    }
    if (tournamentsList.length === 0) {
      return null;
    }
    if (selectedTournamentId !== null) {
      const found = tournamentsList.find(
        (tItem) =>
          String(tItem.id) === String(selectedTournamentId) ||
          tItem.slug === selectedTournamentId,
      );
      if (found) return found;
    }
    if (overrideData) {
      return overrideData;
    }
    // Default to first live tournament or first tournament
    return (
      tournamentsList.find((tItem) => tItem.status === 'live') ||
      tournamentsList[0] ||
      null
    );
  }, [
    overrideData,
    overrideTournaments,
    tournamentsList,
    selectedTournamentId,
  ]);

  useEffect(() => {
    if (overrideData) {
      setSelectedTournamentId(overrideData.id ?? overrideData.slug ?? null);
    }
  }, [overrideData]);

  /**
   * Fetch tournaments from Strapi or fallback to preview data
   */
  const fetchTournamentData = useCallback(
    async (showLoading = true): Promise<void> => {
      if (showLoading) setLoading(true);
      setIsLivePolling(true);

      try {
        // Attempt 1: Fetch through strapiClient
        const strapi = strapiClient.from('tournaments').select();
        const { data: strapiData } = await strapi.get();

        if (Array.isArray(strapiData) && strapiData.length > 0) {
          const parsedList: TournamentData[] = strapiData.map(
            (item: any, idx: number) => {
              const parsed = item.attributes
                ? { id: item.id ?? idx + 1, ...item.attributes }
                : item;
              if (!parsed.id) parsed.id = idx + 1;
              return parsed;
            },
          );
          setTournamentsList(parsedList);
          setIsCustomStrapi(true);
          setLastUpdated(new Date());
          setLoading(false);
          setIsLivePolling(false);
          return;
        }

        // Attempt 2: Direct REST fetch to Strapi backend if strapiClient returned empty
        const apiUrl = `${stats || 'https://stats-production.evos.live/'}api/tournaments?populate=*`;
        const res = await axios.get(apiUrl, { timeout: 4000 });

        if (
          res.data &&
          res.data.data &&
          Array.isArray(res.data.data) &&
          res.data.data.length > 0
        ) {
          const parsedList: TournamentData[] = res.data.data.map(
            (rawItem: any, idx: number) => {
              const parsed = rawItem.attributes
                ? { id: rawItem.id ?? idx + 1, ...rawItem.attributes }
                : rawItem;
              if (!parsed.id) parsed.id = idx + 1;
              return parsed;
            },
          );
          setTournamentsList(parsedList);
          setIsCustomStrapi(true);
          setLastUpdated(new Date());
          setLoading(false);
          setIsLivePolling(false);
          return;
        }

        // Fallback: If Strapi has no entries yet, show dynamic bracket previews
        // setTournamentsList([SAMPLE_TOURNAMENT_8, SAMPLE_TOURNAMENT_4]);
        setIsCustomStrapi(false);
        setLastUpdated(new Date());
      } catch (error) {
        // Safe fallback to sample bracket on network error or initial setup
        // setTournamentsList([SAMPLE_TOURNAMENT_8, SAMPLE_TOURNAMENT_4]);
        setIsCustomStrapi(false);
      } finally {
        setLoading(false);
        setIsLivePolling(false);
      }
    },
    [stats],
  );

  /**
   * Initial fetch on mount (only when not in override mode)
   */
  useEffect(() => {
    if (overrideData !== undefined && !overrideTournaments) {
      setLoading(false);
      return;
    }
    fetchTournamentData();
  }, [fetchTournamentData, overrideData, overrideTournaments]);

  /**
   * Periodic live poll every 30 seconds to fetch real-time updates when Strapi entries change
   */
  useEffect(() => {
    if (overrideData !== undefined && !overrideTournaments) {
      return () => {};
    }
    const timer = setInterval(() => {
      fetchTournamentData(false);
    }, 30000);

    return () => clearInterval(timer);
  }, [fetchTournamentData, overrideData, overrideTournaments]);

  /**
   * Group matches by round number for responsive bracket columns
   */
  const roundsGrouped = useMemo(() => {
    if (!effectiveTournament?.matches) return [];

    const map = new Map<number, TournamentMatch[]>();
    effectiveTournament.matches.forEach((m) => {
      // Hide round if roundNum matches 0
      if (m.round === 0) return;
      const list = map.get(m.round) || [];
      list.push(m);
      map.set(m.round, list);
    });

    return Array.from(map.entries())
      .filter(([roundNum]) => roundNum !== 0)
      .sort(([a], [b]) => a - b)
      .map(([roundNum, matches]) => ({
        roundNum,
        roundName: matches[0]?.roundName || `Round ${roundNum}`,
        matches: matches.sort((a, b) => a.matchNumber - b.matchNumber),
      }));
  }, [effectiveTournament]);

  /**
   * Automatically select the active or upcoming round when tournament data loads
   */
  useEffect(() => {
    if (!roundsGrouped || roundsGrouped.length === 0) return;

    // 1. Prioritize effectiveTournament.currentRound so that round button is selected!
    if (effectiveTournament?.currentRound) {
      const cr = String(effectiveTournament.currentRound).trim().toLowerCase();

      if (cr === 'champion' || cr === 'winner') {
        setActiveRoundIndex(roundsGrouped.length);
        return;
      }

      const matchedIdx = roundsGrouped.findIndex(
        (r) =>
          String(r.roundNum) === cr ||
          r.roundName.toLowerCase() === cr ||
          `round ${r.roundNum}` === cr ||
          cr.replace(/[^0-9]/g, '') === String(r.roundNum) ||
          r.roundName.toLowerCase().includes(cr) ||
          cr.includes(r.roundName.toLowerCase()),
      );

      if (matchedIdx !== -1) {
        setActiveRoundIndex(matchedIdx);
        return;
      }
    }

    // 2. Find first round with an ongoing live match
    const liveRoundIdx = roundsGrouped.findIndex((round) =>
      round.matches.some((m) => m.status === 'live'),
    );
    if (liveRoundIdx !== -1) {
      setActiveRoundIndex(liveRoundIdx);
      return;
    }

    // 3. Next find first round with upcoming scheduled matches
    const scheduledRoundIdx = roundsGrouped.findIndex((round) =>
      round.matches.some((m) => m.status === 'scheduled'),
    );
    if (scheduledRoundIdx !== -1) {
      setActiveRoundIndex(scheduledRoundIdx);
      return;
    }

    // 4. If all completed, select the final round
    setActiveRoundIndex(Math.max(0, roundsGrouped.length - 1));
  }, [roundsGrouped, effectiveTournament?.currentRound]);

  /**
   * Champion player handle
   */
  const championName = useMemo(() => {
    if (!effectiveTournament?.champion) return 'TBD (Finals)';
    if (typeof effectiveTournament.champion === 'string') {
      return effectiveTournament.champion;
    }
    return effectiveTournament.champion.handle || 'TBD (Finals)';
  }, [effectiveTournament?.champion]);

  /**
   * Runner-up player handle calculated from the final match
   */
  const runnerUpName = useMemo(() => {
    if (!roundsGrouped || roundsGrouped.length === 0) return null;
    const finalRound = roundsGrouped[roundsGrouped.length - 1];
    if (!finalRound || finalRound.matches.length === 0) return null;
    const finalMatch = finalRound.matches[0];
    if (!finalMatch || !finalMatch.winnerHandle) return null;

    if (finalMatch.player1?.handle === finalMatch.winnerHandle) {
      return finalMatch.player2?.handle || null;
    }
    if (finalMatch.player2?.handle === finalMatch.winnerHandle) {
      return finalMatch.player1?.handle || null;
    }
    return null;
  }, [roundsGrouped]);

  /**
   * Recalculate SVG connector lines connecting match cards to next rounds and the podium
   */
  const updateLines = useCallback(() => {
    const container = containerRef.current;
    if (!container || !effectiveTournament?.matches) return;

    const containerRect = container.getBoundingClientRect();
    const { scrollLeft, scrollTop } = container;

    const newLines: BracketLine[] = [];

    roundsGrouped.forEach((round, roundIdx) => {
      const isLastRound = roundIdx === roundsGrouped.length - 1;
      const nextRound = !isLastRound ? roundsGrouped[roundIdx + 1] : null;

      round.matches.forEach((match, matchIdx) => {
        const matchEl = matchRefs.current.get(match.id);
        if (!matchEl) return;

        const elRect = matchEl.getBoundingClientRect();
        const x1 = elRect.right - containerRect.left + scrollLeft;
        const y1 =
          elRect.top + elRect.height / 2 - containerRect.top + scrollTop;

        let targetEl: HTMLElement | null = null;

        if (isLastRound) {
          targetEl = podiumRef.current;
        } else if (match.nextMatchId) {
          targetEl = matchRefs.current.get(match.nextMatchId) || null;
        } else if (nextRound) {
          const targetMatchIdx = Math.floor(matchIdx / 2);
          const targetMatch = nextRound.matches[targetMatchIdx];
          if (targetMatch) {
            targetEl = matchRefs.current.get(targetMatch.id) || null;
          }
        }

        if (targetEl) {
          const targetRect = targetEl.getBoundingClientRect();
          const x2 = targetRect.left - containerRect.left + scrollLeft;
          const y2 =
            targetRect.top +
            targetRect.height / 2 -
            containerRect.top +
            scrollTop;

          const path = createBracketPath(x1, y1, x2, y2);
          newLines.push({
            id: `line-${match.id}`,
            path,
            status: match.status,
            isWinner: Boolean(match.winnerHandle),
            x1,
            y1,
            x2,
            y2,
          });
        }
      });
    });

    setLines(newLines);
    setSvgSize({
      width: Math.max(container.scrollWidth, container.clientWidth),
      height: Math.max(container.scrollHeight, container.clientHeight),
    });
  }, [effectiveTournament, roundsGrouped]);

  /**
   * Recalculate bracket lines on round changes, viewMode changes, or mount
   */
  useEffect(() => {
    if (viewMode === 'tree') {
      updateLines();
      const rafId = requestAnimationFrame(() => {
        updateLines();
      });
      const timer = setTimeout(updateLines, 100);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer);
      };
    }
    return () => {};
  }, [updateLines, roundsGrouped, viewMode]);

  /**
   * Recalculate lines on window or container resize
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return () => {};
    }

    const observer = new ResizeObserver(() => {
      updateLines();
    });

    observer.observe(container);
    window.addEventListener('resize', updateLines);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLines);
    };
  }, [updateLines]);

  /**
   * JSON payload to show in the Strapi Setup Dialog based on selected maxPlayers (4, 8, 16)
   */
  const jsonForDialog = useMemo(() => {
    if (selectedSchemaType === 4) return SAMPLE_TOURNAMENT_4;
    return SAMPLE_TOURNAMENT_8;
  }, [selectedSchemaType]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonForDialog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  let syncStatusText = 'No active tournament found • Auto-sync every 30s';
  if (overrideData !== undefined) {
    syncStatusText = 'Admin Draft Preview Mode';
  } else if (isCustomStrapi) {
    syncStatusText = `Tournament start at ${effectiveTournament?.startDate ? new Date(effectiveTournament.startDate).toDateString() : 'Unknown'} • Last checked: ${lastUpdated.toLocaleTimeString()}`;
  }

  return (
    <Box>
      {/* Multi-Tournament / Game Switcher when tournaments are available */}
      {tournamentsList.length > 1 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: '#f59e0b', fontSize: 22 }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: 'text.secondary' }}
            >
              Select Tournament / Game ({tournamentsList.length} Total):
            </Typography>
          </Box>

          <FormControl
            size="small"
            sx={{ minWidth: 280, maxWidth: 500, flexGrow: 1 }}
          >
            <Select
              value={
                effectiveTournament
                  ? (effectiveTournament.id ?? effectiveTournament.slug ?? '')
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTournamentId(val);
                const found = tournamentsList.find(
                  (tourney) =>
                    tourney.id === val ||
                    String(tourney.id) === String(val) ||
                    tourney.slug === val,
                );
                if (found && onTournamentChange) {
                  onTournamentChange(found);
                }
              }}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.88rem',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                },
              }}
            >
              {tournamentsList.map((tItem, tIdx) => {
                const itemVal = tItem.id ?? tItem.slug ?? tIdx;
                const badgeStyle = getStatusBadgeStyle(tItem.status);
                return (
                  <MenuItem key={itemVal} value={itemVal}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {tItem.game ? `[${tItem.game}] ` : ''}
                        {tItem.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={tItem.status.toUpperCase()}
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          backgroundColor: badgeStyle.bg,
                          color: badgeStyle.color,
                        }}
                      />
                      {tItem.id && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.disabled', ml: 'auto' }}
                        >
                          ID: {tItem.id}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Paper>
      )}

      {/* Top Controls: Tournament info, live badge, maxPlayers, refresh button & Strapi modal trigger */}
      {effectiveTournament?.title && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SportsEsports sx={{ color: '#f59e0b', fontSize: 28 }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {effectiveTournament?.game
                    ? `[${effectiveTournament.game}] `
                    : ''}
                  {effectiveTournament?.title || 'EvoS Tournament'}
                </Typography>
                <Chip
                  size="small"
                  label={`${effectiveTournament?.maxPlayers || 8} Players Max`}
                  sx={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    fontWeight: 600,
                  }}
                />
                {effectiveTournament?.status !== 'live' && (
                  <Chip
                    size="small"
                    label={`${effectiveTournament?.status || 'open'}`}
                    sx={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: '#8884c7ff',
                      fontWeight: 600,
                    }}
                  />
                )}
                {effectiveTournament?.status === 'live' && (
                  <Chip
                    size="small"
                    icon={
                      <FiberManualRecord
                        sx={{ fontSize: '10px !important', color: '#ef4444' }}
                      />
                    }
                    label="LIVE BRACKET"
                    sx={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                      fontWeight: 700,
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  />
                )}
              </Box>
              {effectiveTournament?.description && (
                <Typography variant="caption" color="text.secondary">
                  {effectiveTournament?.description}
                  <br />
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {effectiveTournament?.status !== 'completed'
                  ? syncStatusText
                  : 'Tournament completed'}
              </Typography>
            </Box>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            flexWrap="wrap"
            sx={{ gap: 1 }}
          >
            {/* View Mode Toggle: Tree (Desktop SVG) vs Rounds (Google Style Mobile) */}
            <ButtonGroup
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '8px',
                '& .MuiButtonGroup-grouped': {
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              <Button
                startIcon={<ViewAgenda fontSize="small" />}
                onClick={() => setViewMode('compact')}
                variant={viewMode === 'compact' ? 'contained' : 'outlined'}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor:
                    viewMode === 'compact'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'transparent',
                  color: viewMode === 'compact' ? '#f59e0b' : 'text.secondary',
                  borderColor:
                    viewMode === 'compact'
                      ? 'rgba(245, 158, 11, 0.5)'
                      : 'rgba(255, 255, 255, 0.12)',
                  '&:hover': {
                    backgroundColor:
                      viewMode === 'compact'
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                {t('tournament.roundsView', 'Google Style / Rounds')}
              </Button>
              <Button
                startIcon={<AccountTree fontSize="small" />}
                onClick={() => setViewMode('tree')}
                variant={viewMode === 'tree' ? 'contained' : 'outlined'}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor:
                    viewMode === 'tree'
                      ? 'rgba(245, 158, 11, 0.25)'
                      : 'transparent',
                  color: viewMode === 'tree' ? '#f59e0b' : 'text.secondary',
                  borderColor:
                    viewMode === 'tree'
                      ? 'rgba(245, 158, 11, 0.5)'
                      : 'rgba(255, 255, 255, 0.12)',
                  '&:hover': {
                    backgroundColor:
                      viewMode === 'tree'
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                {t('tournament.treeView', 'Tree View')}
              </Button>
            </ButtonGroup>

            {effectiveTournament?.streamUrl && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Tv />}
                href={effectiveTournament.streamUrl}
                target="_blank"
                sx={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  '&:hover': {
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {t('tournament.watchLive', 'Watch Live')}
              </Button>
            )}

            <Button
              variant="contained"
              size="small"
              startIcon={
                isLivePolling ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  <Refresh />
                )
              }
              onClick={() => fetchTournamentData(true)}
              sx={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#d97706' },
              }}
            >
              {t('tournament.refresh', 'Refresh')}
            </Button>
          </Stack>
        </Paper>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#f59e0b' }} />
        </Box>
      )}

      {!loading &&
        (!effectiveTournament ||
          !effectiveTournament.matches ||
          effectiveTournament.matches.length === 0) && (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 280,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <SportsEsports sx={{ fontSize: 32, color: '#f59e0b' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t(
                'tournament.noActiveTournament',
                'No Active Tournament Scheduled',
              )}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 500, mb: 3 }}
            >
              {t(
                'tournament.noActiveTournamentDesc',
                'There is currently no live or upcoming tournament bracket loaded from the database. When an administrator publishes a tournament, it will appear here in real time.',
              )}
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              justifyContent="center"
            >
              {isDevUser && (
                <Button
                  variant="contained"
                  startIcon={<AdminPanelSettings />}
                  onClick={() => navigate('/tournament-admin')}
                  sx={{
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#d97706' },
                  }}
                >
                  {t('tournament.adminPanel', 'Tournament Admin')}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => fetchTournamentData(true)}
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {t('tournament.refresh', 'Refresh')}
              </Button>
            </Stack>
          </Paper>
        )}

      {!loading &&
        effectiveTournament &&
        effectiveTournament.matches &&
        effectiveTournament.matches.length > 0 &&
        viewMode === 'compact' && (
          <Box sx={{ width: '100%', maxWidth: 680, mx: 'auto', pb: 4 }}>
            {/* Google Style Round Navigation Bar */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2.5,
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Carousel Header: Prev arrow, scrollable pills, Next arrow */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <IconButton
                  size="small"
                  disabled={activeRoundIndex <= 0}
                  onClick={() => {
                    const newIdx = Math.max(0, activeRoundIndex - 1);
                    setActiveRoundIndex(newIdx);
                    const targetRound = roundsGrouped[newIdx];
                    if (targetRound) {
                      onRoundChange?.(targetRound.roundName, newIdx);
                    }
                  }}
                  sx={{
                    color: activeRoundIndex <= 0 ? 'text.disabled' : '#f59e0b',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                  }}
                >
                  <ChevronLeft />
                </IconButton>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    overflowX: 'auto',
                    py: 0.5,
                    px: 0.5,
                    flexGrow: 1,
                    justifyContent: 'center',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {roundsGrouped
                    .filter((round) => round.roundNum !== 0)
                    .map((round, idx) => {
                      const isSelected = activeRoundIndex === idx;
                      const roundHasLive = round.matches.some(
                        (m) => m.status === 'live',
                      );

                      let chipBg = 'rgba(255, 255, 255, 0.06)';
                      let chipColor = 'text.primary';
                      let chipBorder = '1px solid rgba(255, 255, 255, 0.1)';
                      if (isSelected) {
                        chipBg = '#f59e0b';
                        chipColor = '#000';
                        chipBorder = '1px solid #f59e0b';
                      }

                      return (
                        <Chip
                          key={`tab-round-${round.roundNum}`}
                          clickable
                          onClick={() => {
                            setActiveRoundIndex(idx);
                            onRoundChange?.(round.roundName, idx);
                          }}
                          label={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                              }}
                            >
                              {roundHasLive && (
                                <FiberManualRecord
                                  sx={{
                                    fontSize: 8,
                                    color: isSelected ? '#000' : '#ef4444',
                                    animation: 'liveLinePulse 1.5s infinite',
                                  }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: isSelected ? 800 : 600,
                                  fontSize: '0.78rem',
                                }}
                              >
                                {round.roundName}
                              </Typography>
                            </Box>
                          }
                          sx={{
                            height: 32,
                            px: 0.5,
                            backgroundColor: chipBg,
                            color: chipColor,
                            border: chipBorder,
                            boxShadow: isSelected
                              ? '0 2px 12px rgba(245, 158, 11, 0.4)'
                              : 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: isSelected
                                ? '#d97706'
                                : 'rgba(255, 255, 255, 0.12)',
                            },
                          }}
                        />
                      );
                    })}

                  {/* Champion Podium Tab */}
                  <Chip
                    clickable
                    onClick={() => {
                      setActiveRoundIndex(roundsGrouped.length);
                      onRoundChange?.('Champion', roundsGrouped.length);
                    }}
                    icon={
                      <EmojiEvents
                        sx={{
                          fontSize: '14px !important',
                          color:
                            activeRoundIndex === roundsGrouped.length
                              ? '#000 !important'
                              : '#f59e0b !important',
                        }}
                      />
                    }
                    label="Champion"
                    sx={{
                      height: 32,
                      px: 0.5,
                      backgroundColor:
                        activeRoundIndex === roundsGrouped.length
                          ? '#f59e0b'
                          : 'rgba(245, 158, 11, 0.1)',
                      color:
                        activeRoundIndex === roundsGrouped.length
                          ? '#000'
                          : '#f59e0b',
                      border:
                        activeRoundIndex === roundsGrouped.length
                          ? '1px solid #f59e0b'
                          : '1px solid rgba(245, 158, 11, 0.3)',
                      fontWeight:
                        activeRoundIndex === roundsGrouped.length ? 800 : 600,
                      boxShadow:
                        activeRoundIndex === roundsGrouped.length
                          ? '0 2px 12px rgba(245, 158, 11, 0.4)'
                          : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor:
                          activeRoundIndex === roundsGrouped.length
                            ? '#d97706'
                            : 'rgba(245, 158, 11, 0.2)',
                      },
                    }}
                  />
                </Box>

                <IconButton
                  size="small"
                  disabled={activeRoundIndex >= roundsGrouped.length}
                  onClick={() => {
                    const newIdx = Math.min(
                      roundsGrouped.length,
                      activeRoundIndex + 1,
                    );
                    setActiveRoundIndex(newIdx);
                    if (newIdx === roundsGrouped.length) {
                      onRoundChange?.('Champion', newIdx);
                    } else {
                      const targetRound = roundsGrouped[newIdx];
                      if (targetRound) {
                        onRoundChange?.(targetRound.roundName, newIdx);
                      }
                    }
                  }}
                  sx={{
                    color:
                      activeRoundIndex >= roundsGrouped.length
                        ? 'text.disabled'
                        : '#f59e0b',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>

              {/* Round Subtitle Indicator */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 1.5,
                  pt: 1,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  px: 0.5,
                }}
              >
                {activeRoundIndex < roundsGrouped.length ? (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      {t(
                        'tournament.roundOf',
                        'Round {{current}} of {{total}}',
                        {
                          current: activeRoundIndex + 1,
                          total: roundsGrouped.length,
                        },
                      )}{' '}
                      • {roundsGrouped[activeRoundIndex]?.roundName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      {roundsGrouped[activeRoundIndex]?.matches.length}{' '}
                      {roundsGrouped[activeRoundIndex]?.matches.length === 1
                        ? 'Match'
                        : 'Matches'}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ color: '#f59e0b', fontWeight: 700 }}
                    >
                      🏆 Tournament Champion
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary' }}
                    >
                      Grand Finals Outcome
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>

            {/* Active Round Match Cards or Champion Showcase */}
            {activeRoundIndex < roundsGrouped.length ? (
              <Stack spacing={2.5} sx={{ width: '100%' }}>
                {roundsGrouped[activeRoundIndex]?.matches.map((match) => (
                  <BracketMatchCard
                    key={`compact-match-${match.id}`}
                    match={match}
                    fullWidth
                    isFinalRound={activeRoundIndex === roundsGrouped.length - 1}
                  />
                ))}
              </Stack>
            ) : (
              /* Google Mobile Champion Card */
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: '20px',
                  background:
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 18, 18, 0.95) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: '0 12px 40px rgba(245, 158, 11, 0.25)',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 6px 28px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 44, color: '#fff' }} />
                </Box>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '1.5px',
                    color: '#f59e0b',
                  }}
                >
                  Tournament Champion
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#fff',
                    mt: 0.5,
                    mb: 1.5,
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {championName}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  sx={{ mb: 3 }}
                >
                  <Chip
                    size="small"
                    icon={<MilitaryTech />}
                    label="Champion"
                    sx={{
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      fontWeight: 700,
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  />
                  {runnerUpName && (
                    <Chip
                      size="small"
                      label={`${t('tournament.runnerUp', 'Runner-Up')}: ${runnerUpName}`}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: 'text.secondary',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    />
                  )}
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary', maxWidth: 420, mx: 'auto' }}
                >
                  {effectiveTournament?.title || 'EvoS Tournament'}
                  {' • '}
                  {effectiveTournament?.matches?.length || 0} Total Matches
                </Typography>
              </Paper>
            )}
          </Box>
        )}

      {!loading &&
        effectiveTournament &&
        effectiveTournament.matches &&
        effectiveTournament.matches.length > 0 &&
        viewMode === 'tree' && (
          /* Visual Bracket Tree: Horizontal scrollable container with columns for each round */
          <Box
            ref={containerRef}
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              gap: 5,
              overflowX: 'auto',
              pb: 3,
              pt: 1,
              px: 1,
              minHeight: 480,
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 4,
              },
            }}
          >
            {/* SVG Bracket Connectors Overlay */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: svgSize.width || '100%',
                height: svgSize.height || '100%',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            >
              <defs>
                <style>
                  {`
                    @keyframes liveLinePulse {
                      0% { stroke-dashoffset: 20; }
                      100% { stroke-dashoffset: 0; }
                    }
                  `}
                </style>
              </defs>
              {lines.map((line) => {
                let strokeColor = 'rgba(255, 255, 255, 0.2)';
                let strokeWidth = 2;
                let filter = 'none';
                const isLive = line.status === 'live';

                if (line.isWinner) {
                  strokeColor = '#f59e0b';
                  strokeWidth = 2.5;
                  filter = 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))';
                } else if (isLive) {
                  strokeColor = '#ef4444';
                  strokeWidth = 2.5;
                  filter = 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.7))';
                }

                return (
                  <g key={line.id}>
                    {/* Shadow / dark background track for contrast */}
                    <path
                      d={line.path}
                      fill="none"
                      stroke={
                        line.isWinner
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(0, 0, 0, 0.5)'
                      }
                      strokeWidth={strokeWidth + 3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main connector line */}
                    <path
                      d={line.path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={isLive ? '6 4' : 'none'}
                      style={{
                        filter,
                        animation: isLive
                          ? 'liveLinePulse 1.5s linear infinite'
                          : 'none',
                        transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                      }}
                    />
                    {/* Origin node dot */}
                    <circle
                      cx={line.x1}
                      cy={line.y1}
                      r={line.isWinner || isLive ? 3.5 : 2.5}
                      fill={strokeColor}
                    />
                    {/* Destination node dot */}
                    <circle
                      cx={line.x2}
                      cy={line.y2}
                      r={line.isWinner || isLive ? 3.5 : 2.5}
                      fill={strokeColor}
                    />
                  </g>
                );
              })}
            </svg>

            {roundsGrouped
              .filter((round) => round.roundNum !== 0)
              .map((round) => (
                <Box
                  key={`round-${round.roundNum}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 260,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Round Header */}
                  <Paper
                    elevation={0}
                    sx={{
                      py: 1,
                      px: 1.5,
                      mb: 2,
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: '#f59e0b',
                      }}
                    >
                      {round.roundName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {round.matches.length}{' '}
                      {round.matches.length === 1 ? 'Match' : 'Matches'}
                    </Typography>
                  </Paper>

                  {/* Matches in Round with vertical spacing */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      justifyContent: 'space-around',
                      flexGrow: 1,
                    }}
                  >
                    {round.matches.map((match) => (
                      <Box
                        key={`match-${match.id}`}
                        ref={(el: HTMLDivElement | null) => {
                          if (el) {
                            matchRefs.current.set(match.id, el);
                          } else {
                            matchRefs.current.delete(match.id);
                          }
                        }}
                        sx={{ position: 'relative' }}
                      >
                        <BracketMatchCard match={match} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}

            {/* Champion Trophy Podium Showcase */}
            <Box
              ref={podiumRef}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 230,
                px: 2,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background:
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.5)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1.5,
                    boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <EmojiEvents sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '1px',
                    color: '#f59e0b',
                    textTransform: 'uppercase',
                  }}
                >
                  Champion
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mt: 0.5,
                    color: '#fff',
                  }}
                >
                  {championName}
                </Typography>
                <Chip
                  size="small"
                  icon={<MilitaryTech />}
                  label="Tournament Winner"
                  sx={{
                    mt: 1.5,
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    fontWeight: 700,
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                  }}
                />
              </Paper>
            </Box>
          </Box>
        )}

      {/* Strapi Setup & Data Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(24, 24, 27, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}
        >
          <EmojiEvents sx={{ color: '#f59e0b' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Strapi Database Field Setup & Values
          </Typography>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <Typography variant="body2" color="text.secondary" paragraph>
            To manage this bracket live in Strapi, create a collection named{' '}
            <strong>`tournaments`</strong> in Strapi Content-Type Builder. Set
            the <strong>`maxPlayers`</strong> integer field dynamically (e.g. 4,
            8, 16) to control bracket size!
          </Typography>

          {/* Quick Tabs for 4 vs 8 players */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant={selectedSchemaType === 8 ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSelectedSchemaType(8)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              8 Players Bracket (Default)
            </Button>
            <Button
              variant={selectedSchemaType === 4 ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setSelectedSchemaType(4)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              4 Players Bracket
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: 340,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
            }}
          >
            <pre style={{ margin: 0, color: '#38bdf8' }}>
              {JSON.stringify(jsonForDialog, null, 2)}
            </pre>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={handleCopyJson}
            sx={{
              backgroundColor: '#f59e0b',
              color: '#000',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy JSON to Clipboard'}
          </Button>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

TournamentBracket.defaultProps = {
  overrideData: undefined,
  overrideTournaments: undefined,
  initialTournamentId: undefined,
  onRoundChange: undefined,
  onTournamentChange: undefined,
};
