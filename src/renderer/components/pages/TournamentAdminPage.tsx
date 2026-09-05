/**
 * @fileoverview TournamentAdminPage component for the Evos Launcher
 * Developer-only admin console for managing tournaments live, including
 * dynamic maxPlayers configuration, custom player roster management,
 * round and match creation, live score tracking, and Strapi database synchronization.
 *
 * @author Evos Launcher Team
 * @since 3.3.5
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  AdminPanelSettings,
  AutoFixHigh,
  ContentCopy,
  Delete,
  EmojiEvents,
  FiberManualRecord,
  Lock,
  Refresh,
  Save,
  SportsEsports,
  Upload,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EvosStore from 'renderer/lib/EvosStore';
import { getSpecialNames } from 'renderer/lib/Evos';
import { strapiClient } from 'renderer/lib/strapi';
import TournamentBracket, {
  SAMPLE_TOURNAMENT_4,
  SAMPLE_TOURNAMENT_8,
  TournamentData,
  TournamentMatch,
  TournamentPlayer,
} from '../generic/TournamentBracket';

/**
 * Props for the CustomTabPanel component
 */
interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps): React.ReactElement {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 2.5 }}>{children}</Box>}
    </div>
  );
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
 * Convert an ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
 */
function toDatetimeLocal(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) {
      return isoString.length >= 16 ? isoString.slice(0, 16) : isoString;
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Developer-only Tournament Admin Page
 */
export default function TournamentAdminPage(): React.ReactElement {
  const navigate = useNavigate();
  const { activeUser, stats } = EvosStore();

  // Developer authorization state
  const [isAuthorizedDev, setIsAuthorizedDev] = useState<boolean | null>(null);

  // Tournament data state
  const [tournamentsList, setTournamentsList] = useState<TournamentData[]>([]);
  const [tournament, setTournament] =
    useState<TournamentData>(SAMPLE_TOURNAMENT_8);
  const [existingId, setExistingId] = useState<number | null>(
    SAMPLE_TOURNAMENT_8.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Dialog states
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] =
    useState<boolean>(false);
  const [importDialogOpen, setImportDialogOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');

  // New Player Form state
  const [newPlayerHandle, setNewPlayerHandle] = useState<string>('');
  const [newPlayerSeed, setNewPlayerSeed] = useState<number>(1);
  const [newPlayerChar, setNewPlayerChar] = useState<string>('');

  /**
   * Verify developer permissions on mount
   */
  useEffect(() => {
    let isMounted = true;

    async function checkAuthorization() {
      if (!activeUser?.handle) {
        if (isMounted) setIsAuthorizedDev(false);
        return;
      }
      try {
        const specialNames = await getSpecialNames();
        const isDev =
          specialNames?.Developers?.includes(activeUser.handle) || false;
        if (isMounted) setIsAuthorizedDev(isDev);
      } catch {
        if (isMounted) setIsAuthorizedDev(false);
      }
    }

    checkAuthorization();

    return () => {
      isMounted = false;
    };
  }, [activeUser]);

  /**
   * Fetch all tournaments from Strapi to populate admin console
   */
  const loadFromStrapi = useCallback(async () => {
    try {
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
        const activeTourney =
          parsedList.find((item) => item.status === 'live') || parsedList[0];
        setTournament(activeTourney);
        if (activeTourney.id) setExistingId(activeTourney.id);
        setSnackbarMessage(
          `Loaded ${parsedList.length} tournament(s) from Strapi.`,
        );
        return;
      }

      // REST fallback
      const apiUrl = `${stats || 'https://stats-production.evos.live/'}api/tournaments?populate=*`;
      const res = await axios.get(apiUrl, { timeout: 3000 });
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
        const activeTourney =
          parsedList.find((item) => item.status === 'live') || parsedList[0];
        setTournament(activeTourney);
        if (activeTourney.id) setExistingId(activeTourney.id);
        setSnackbarMessage(
          `Loaded ${parsedList.length} tournament(s) from Strapi.`,
        );
        return;
      }

      // Local fallback
      setTournamentsList([SAMPLE_TOURNAMENT_8, SAMPLE_TOURNAMENT_4]);
      setTournament(SAMPLE_TOURNAMENT_8);
      setExistingId(SAMPLE_TOURNAMENT_8.id ?? null);
    } catch {
      // Keep current draft
    }
  }, [stats]);

  useEffect(() => {
    if (isAuthorizedDev) {
      loadFromStrapi();
    }
  }, [isAuthorizedDev, loadFromStrapi]);

  /**
   * Switch active tournament being edited
   */
  const handleSelectTournament = (selectedId: number | string) => {
    const target = tournamentsList.find(
      (t) => String(t.id) === String(selectedId) || t.slug === selectedId,
    );
    if (target) {
      setTournament(target);
      setExistingId(target.id ?? null);
      setSnackbarMessage(`Switched to "${target.title}".`);
    }
  };

  /**
   * Create a new tournament entry
   */
  const handleCreateNewTournament = (playerCount: 4 | 8 = 8) => {
    const template =
      playerCount === 4 ? SAMPLE_TOURNAMENT_4 : SAMPLE_TOURNAMENT_8;
    const newTournament: TournamentData = {
      ...template,
      id: undefined,
      title: `EvoS Tournament ${tournamentsList.length + 1}`,
      slug: `evos-tournament-${Date.now()}`,
      status: 'upcoming',
      currentRound: 'Round 1',
    };
    setTournament(newTournament);
    setExistingId(null);
    setSnackbarMessage(
      'Created new tournament draft. Set details and click "Save & Publish to Strapi".',
    );
  };

  /**
   * Delete selected tournament from Strapi and local list
   */
  const handleDeleteTournament = async () => {
    if (!existingId) {
      setTournamentsList((prev) => prev.filter((t) => t.id !== undefined));
      handleCreateNewTournament(8);
      setSnackbarMessage('Cleared unsaved draft.');
      return;
    }

    setSaving(true);
    const apiUrl = `${stats || 'https://stats-production.evos.live/'}api/tournaments/${existingId}`;
    try {
      await axios.delete(apiUrl);
      const remaining = tournamentsList.filter((t) => t.id !== existingId);
      setTournamentsList(remaining);
      if (remaining.length > 0) {
        setTournament(remaining[0]);
        setExistingId(remaining[0].id ?? null);
      } else {
        handleCreateNewTournament(8);
      }
      setSnackbarMessage('Tournament successfully deleted from Strapi.');
    } catch {
      const remaining = tournamentsList.filter((t) => t.id !== existingId);
      setTournamentsList(remaining);
      if (remaining.length > 0) {
        setTournament(remaining[0]);
        setExistingId(remaining[0].id ?? null);
      } else {
        handleCreateNewTournament(8);
      }
      setSnackbarMessage('Removed tournament locally.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle updating general tournament fields
   */
  const handleFieldChange = (field: keyof TournamentData, value: any) => {
    setTournament((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Save tournament data to Strapi database
   */
  const handleSaveToStrapi = async () => {
    setSaving(true);
    const apiUrl = `${stats || 'https://stats-production.evos.live/'}api/tournaments`;

    try {
      if (existingId) {
        // Update existing record
        await axios.put(`${apiUrl}/${existingId}`, { data: tournament });
        setTournamentsList((prev) =>
          prev.map((t) =>
            t.id === existingId ? { ...tournament, id: existingId } : t,
          ),
        );
      } else {
        // Create new record
        const res = await axios.post(apiUrl, { data: tournament });
        const newId = res.data?.data?.id ?? Date.now();
        setExistingId(newId);
        const saved = { ...tournament, id: newId };
        setTournament(saved);
        setTournamentsList((prev) => [...prev, saved]);
      }
      setSnackbarMessage(
        'Successfully published tournament to Strapi database!',
      );
    } catch (err: any) {
      // Save draft locally so work is never lost
      localStorage.setItem('evos_tournament_draft', JSON.stringify(tournament));
      setSnackbarMessage(
        'Strapi API connection error. Draft saved locally! Use "Export JSON" to copy data.',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Generate bracket template for 4, 8, or 16 players
   */
  const handleGenerateTemplate = (playerCount: 4 | 8) => {
    if (playerCount === 4) {
      setTournament(SAMPLE_TOURNAMENT_4);
    } else {
      setTournament(SAMPLE_TOURNAMENT_8);
    }
    setSnackbarMessage(`Loaded ${playerCount}-player bracket template.`);
  };

  /**
   * Add a new player to the roster
   */
  const handleAddPlayer = () => {
    if (!newPlayerHandle.trim()) return;

    const newPlayer: TournamentPlayer = {
      id: Date.now(),
      handle: newPlayerHandle.trim(),
      seed: Number(newPlayerSeed) || tournament.players.length + 1,
      character: newPlayerChar.trim() || undefined,
    };

    setTournament((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
    }));

    setNewPlayerHandle('');
    setNewPlayerSeed(tournament.players.length + 2);
    setNewPlayerChar('');
    setAddPlayerDialogOpen(false);
  };

  /**
   * Delete player from roster
   */
  const handleDeletePlayer = (playerId: string | number) => {
    setTournament((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== playerId),
    }));
  };

  /**
   * Update match score and status
   */
  const handleUpdateMatch = (
    matchId: string | number,
    updates: Partial<TournamentMatch>,
  ) => {
    setTournament((prev) => {
      let nextCurrentRound = prev.currentRound;
      let baseMatches = prev.matches;
      if (
        matchId === 'champion' &&
        !prev.matches.some((m) => m.id === 'champion')
      ) {
        baseMatches = [
          ...prev.matches,
          {
            id: 'champion',
            round: 0,
            roundName: 'Champion',
            matchNumber: 0,
            player1: null,
            player2: null,
            score1: 0,
            score2: 0,
            status: 'scheduled',
          },
        ];
      }
      const updatedMatches = baseMatches.map((m) => {
        if (m.id === matchId) {
          const updated = { ...m, ...updates };

          // Automatically sync currentRound when a match is made live
          if (updates.status === 'live' && updated.roundName) {
            nextCurrentRound = updated.roundName;
          }

          // Automatically assign winner if status is set to completed and scores differ
          if (updated.status === 'completed' && !updated.winnerHandle) {
            if (
              (updated.score1 ?? 0) > (updated.score2 ?? 0) &&
              updated.player1
            ) {
              updated.winnerHandle = updated.player1.handle;
            } else if (
              (updated.score2 ?? 0) > (updated.score1 ?? 0) &&
              updated.player2
            ) {
              updated.winnerHandle = updated.player2.handle;
            }
          }

          return updated;
        }
        return m;
      });

      return {
        ...prev,
        currentRound: nextCurrentRound,
        matches: updatedMatches,
      };
    });
  };

  /**
   * Delete a match
   */
  const handleDeleteMatch = (matchId: string | number) => {
    setTournament((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
    }));
  };

  /**
   * Add a new match to a round
   */
  const handleAddMatch = (roundNum: number, roundName: string) => {
    const newMatch: TournamentMatch = {
      id: `m-${Date.now()}`,
      round: roundNum,
      roundName,
      matchNumber: tournament.matches.length + 1,
      player1: null,
      player2: null,
      score1: 0,
      score2: 0,
      status: 'scheduled',
    };

    setTournament((prev) => ({
      ...prev,
      matches: [...prev.matches, newMatch],
    }));
  };

  /**
   * Add a new round
   */
  const handleAddRound = () => {
    const nextRoundNum =
      tournament.matches.length > 0
        ? Math.max(...tournament.matches.map((m) => m.round)) + 1
        : 1;

    handleAddMatch(nextRoundNum, `Round ${nextRoundNum}`);
  };

  /**
   * Export JSON to clipboard
   */
  const handleExportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(tournament, null, 2));
    setSnackbarMessage('Tournament JSON copied to clipboard!');
  };

  /**
   * Import JSON
   */
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.title && Array.isArray(parsed.matches)) {
        setTournament(parsed);
        setImportDialogOpen(false);
        setImportJsonText('');
        setSnackbarMessage('Imported tournament JSON successfully.');
      } else {
        setSnackbarMessage(
          'Invalid JSON format: missing title or matches array.',
        );
      }
    } catch {
      setSnackbarMessage('JSON parse error: check your syntax.');
    }
  };

  // Group matches by round for UI organization
  const matchesByRound = useMemo(() => {
    const map = new Map<number, TournamentMatch[]>();
    const seenChampion = new Set<string>();

    // Deduplicate any duplicate champion match from tournament.matches
    const cleanMatches = tournament.matches.filter((m) => {
      if (
        m.id === 'champion' ||
        m.round === 0 ||
        m.roundName?.trim().toLowerCase() === 'champion'
      ) {
        if (seenChampion.has('champion')) return false;
        seenChampion.add('champion');
      }
      return true;
    });

    // Add champion round if not present
    const allMatches = seenChampion.has('champion')
      ? cleanMatches
      : [
          ...cleanMatches,
          {
            id: 'champion',
            round: 0,
            roundName: 'Champion',
            matchNumber: 0,
            player1: null,
            player2: null,
            score1: 0,
            score2: 0,
            status: 'scheduled' as const,
          },
        ];

    allMatches.forEach((m) => {
      const list = map.get(m.round) || [];
      list.push(m);
      map.set(m.round, list);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [tournament.matches]);

  // Distinct round names for quick-select active round
  const availableRoundNames = useMemo(() => {
    const list: string[] = [];
    matchesByRound.forEach(([roundNum, matches]) => {
      const name = matches[0]?.roundName || `Round ${roundNum}`;
      if (!list.includes(name)) list.push(name);
    });
    if (list.length === 0) {
      return ['Round 1', 'Round 2', 'Semifinals', 'Finals', 'Champion'];
    }
    if (!list.includes('Champion')) list.push('Champion');
    return list;
  }, [matchesByRound]);

  // If unauthorized developer
  if (isAuthorizedDev === false) {
    return (
      <Container sx={{ py: 6, minHeight: '80vh' }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: '16px',
            background: 'rgba(18, 18, 18, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            maxWidth: 550,
            mx: 'auto',
          }}
        >
          <Lock sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: '#ef4444', mb: 1 }}
          >
            Access Restricted
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This Tournament Admin management console is restricted to authorized
            developers only.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate('/tournament')}
            sx={{
              color: '#ef4444',
              borderColor: '#ef4444',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Return to Tournament Page
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 3, minHeight: '100vh', maxWidth: '100% !important' }}>
      {/* Admin Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          p: { xs: 2, md: 2.5 },
          mb: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettings sx={{ fontSize: 36, color: '#f59e0b' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: '#fff' }}
                >
                  Tournament Admin Console
                </Typography>
                <Chip
                  size="small"
                  label="DEVELOPER ACCESS"
                  sx={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Configure live brackets, manage custom players & rounds, update
                live scores, and sync to Strapi.
              </Typography>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => navigate('/tournament')}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                textTransform: 'none',
              }}
            >
              Public Bracket
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopy />}
              onClick={handleExportJson}
              sx={{
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                textTransform: 'none',
              }}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Upload />}
              onClick={() => setImportDialogOpen(true)}
              sx={{
                color: '#a855f7',
                borderColor: 'rgba(168, 85, 247, 0.4)',
                textTransform: 'none',
              }}
            >
              Import JSON
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={saving}
              startIcon={<Save />}
              onClick={handleSaveToStrapi}
              sx={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#d97706' },
              }}
            >
              {saving ? 'Publishing...' : 'Save & Publish to Strapi'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Multi-Tournament Management Bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          borderRadius: '16px',
          background: 'rgba(18, 18, 18, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 1,
            minWidth: 280,
          }}
        >
          <SportsEsports sx={{ color: '#f59e0b', fontSize: 32 }} />
          <Box sx={{ flexGrow: 1, maxWidth: 500 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                display: 'block',
                mb: 0.5,
              }}
            >
              Select Tournament / Database Entry ({tournamentsList.length}{' '}
              Total):
            </Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={
                  existingId !== null ? existingId : tournament.slug || 'new'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'new') {
                    handleCreateNewTournament(8);
                  } else {
                    handleSelectTournament(val);
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
                <MenuItem
                  value="new"
                  sx={{ color: '#f59e0b', fontWeight: 700 }}
                >
                  + Create New Tournament Draft
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={() => loadFromStrapi()}
            sx={{
              color: 'text.secondary',
              borderColor: 'rgba(255,255,255,0.15)',
              textTransform: 'none',
            }}
          >
            Reload DB
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => handleCreateNewTournament(8)}
            sx={{
              color: '#f59e0b',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            New Tournament
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteTournament}
            sx={{
              textTransform: 'none',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          >
            Delete
          </Button>
        </Stack>
      </Paper>

      {/* Admin Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          background: 'rgba(18, 18, 18, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          p: { xs: 1.5, md: 2.5 },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&.Mui-selected': { color: '#f59e0b' },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#f59e0b', height: 3 },
          }}
        >
          <Tab label="1. Tournament Settings" id="tab-0" />
          <Tab
            label={`2. Players Roster (${tournament.players.length})`}
            id="tab-1"
          />
          <Tab
            label={`3. Rounds & Matches (${tournament.matches.length})`}
            id="tab-2"
          />
          <Tab label="4. Champion & Results" id="tab-3" />
          <Tab
            icon={<Visibility />}
            iconPosition="start"
            label="5. Live Preview"
            id="tab-4"
          />
        </Tabs>

        {/* Tab 0: Tournament Settings */}
        <CustomTabPanel value={activeTab} index={0}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                General Tournament Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set game discipline, dynamic max players, status, start times,
                and live stream channels.
              </Typography>
            </Box>

            {/* Template Generation */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHigh />}
                onClick={() => handleGenerateTemplate(8)}
                sx={{
                  textTransform: 'none',
                  color: '#f59e0b',
                  borderColor: '#f59e0b',
                }}
              >
                Template (8 Players)
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AutoFixHigh />}
                onClick={() => handleGenerateTemplate(4)}
                sx={{
                  textTransform: 'none',
                  color: '#38bdf8',
                  borderColor: '#38bdf8',
                }}
              >
                Template (4 Players)
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="Tournament Title"
                value={tournament.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Game / Discipline"
                placeholder="Atlas Reactor"
                helperText="Game title (e.g. Atlas Reactor, EvoS)"
                value={tournament.game || ''}
                onChange={(e) => handleFieldChange('game', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="URL Slug"
                value={tournament.slug || ''}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Tournament Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Tournament Status"
                  value={tournament.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                >
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="live">Live (Active)</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Max Players (Dynamic)"
                helperText="Controls bracket size (e.g. 4, 8, 16, 32)"
                value={tournament.maxPlayers}
                onChange={(e) =>
                  handleFieldChange('maxPlayers', Number(e.target.value))
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Current Round"
                value={tournament.currentRound || ''}
                onChange={(e) =>
                  handleFieldChange('currentRound', e.target.value)
                }
              />
              {availableRoundNames.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 0.8,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
                    Quick Select Active Round:
                  </Typography>
                  {availableRoundNames.map((rName) => {
                    const isSelected =
                      tournament.currentRound?.trim().toLowerCase() ===
                      rName.trim().toLowerCase();
                    return (
                      <Chip
                        key={rName}
                        size="small"
                        clickable
                        label={rName}
                        onClick={() => handleFieldChange('currentRound', rName)}
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: isSelected ? 800 : 500,
                          backgroundColor: isSelected
                            ? '#f59e0b'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: isSelected ? '#000' : 'text.primary',
                          border: isSelected
                            ? '1px solid #f59e0b'
                            : '1px solid rgba(255, 255, 255, 0.12)',
                          '&:hover': {
                            backgroundColor: isSelected
                              ? '#d97706'
                              : 'rgba(255, 255, 255, 0.12)',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Start Date & Time"
                value={toDatetimeLocal(tournament.startDate)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    handleFieldChange('startDate', '');
                    return;
                  }
                  const dateObj = new Date(val);
                  handleFieldChange(
                    'startDate',
                    Number.isNaN(dateObj.getTime())
                      ? val
                      : dateObj.toISOString(),
                  );
                }}
                onClick={(e) => {
                  const inputEl = e.currentTarget.querySelector('input');
                  if (inputEl && typeof inputEl.showPicker === 'function') {
                    try {
                      inputEl.showPicker();
                    } catch {
                      // Ignore if already open
                    }
                  }
                }}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                helperText={
                  tournament.startDate
                    ? `Scheduled: ${new Date(tournament.startDate).toLocaleString()}`
                    : 'Click to open date & time picker'
                }
                sx={{
                  colorScheme: 'dark',
                  '& input::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer',
                    opacity: 0.85,
                    '&:hover': {
                      opacity: 1,
                    },
                  },
                }}
              />
              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 0.8,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                  Quick Presets:
                </Typography>
                {[
                  {
                    label: 'Now',
                    getDate: () => new Date(),
                  },
                  {
                    label: 'Tomorrow 18:00',
                    getDate: () => {
                      const targetDate = new Date();
                      targetDate.setDate(targetDate.getDate() + 1);
                      targetDate.setHours(18, 0, 0, 0);
                      return targetDate;
                    },
                  },
                  {
                    label: 'Saturday 18:00',
                    getDate: () => {
                      const targetDate = new Date();
                      const currentDay = targetDate.getDay();
                      const diff = (6 - currentDay + 7) % 7 || 7;
                      targetDate.setDate(targetDate.getDate() + diff);
                      targetDate.setHours(18, 0, 0, 0);
                      return targetDate;
                    },
                  },
                  {
                    label: 'Sunday 18:00',
                    getDate: () => {
                      const targetDate = new Date();
                      const currentDay = targetDate.getDay();
                      const diff = (7 - currentDay + 7) % 7 || 7;
                      targetDate.setDate(targetDate.getDate() + diff);
                      targetDate.setHours(18, 0, 0, 0);
                      return targetDate;
                    },
                  },
                ].map((preset) => (
                  <Chip
                    key={preset.label}
                    size="small"
                    clickable
                    label={preset.label}
                    onClick={() =>
                      handleFieldChange(
                        'startDate',
                        preset.getDate().toISOString(),
                      )
                    }
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'text.primary',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      },
                    }}
                  />
                ))}
                {tournament.startDate && (
                  <Chip
                    size="small"
                    clickable
                    label="Clear"
                    onClick={() => handleFieldChange('startDate', '')}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      },
                    }}
                  />
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Live Stream URL"
                placeholder="https://twitch.tv/BabyAddalyn"
                value={tournament.streamUrl || ''}
                onChange={(e) => handleFieldChange('streamUrl', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description & Rules"
                value={tournament.description || ''}
                onChange={(e) =>
                  handleFieldChange('description', e.target.value)
                }
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Tab 1: Players Roster */}
        <CustomTabPanel value={activeTab} index={1}>
          <Box
            sx={{
              mb: 2.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tournament Players Roster
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add, edit, or re-seed registered players participating in this
                bracket.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddPlayerDialogOpen(true)}
              sx={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#d97706' },
              }}
            >
              Add Player
            </Button>
          </Box>

          <Grid container spacing={2}>
            {tournament.players.map((player) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    p: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Chip
                        size="small"
                        label={`#${player.seed || 1}`}
                        sx={{
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          fontWeight: 700,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {player.handle}
                        </Typography>
                        {player.character && (
                          <Typography variant="caption" color="text.secondary">
                            Character: {player.character}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePlayer(player.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CustomTabPanel>

        {/* Tab 2: Rounds & Live Matches */}
        <CustomTabPanel value={activeTab} index={2}>
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Live Rounds & Matches (&quot;Player VS Player&quot;)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adjust scores live, toggle status to LIVE, assign winners, and
                advance players.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddRound}
              sx={{
                color: '#f59e0b',
                borderColor: '#f59e0b',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Add New Round
            </Button>
          </Box>

          <Stack spacing={4}>
            {matchesByRound
              .filter(
                ([roundNum, matches]) =>
                  roundNum !== 0 &&
                  matches[0]?.roundName?.trim().toLowerCase() !== 'champion',
              )
              .map(([roundNum, matches]) => (
                <Paper
                  key={`round-admin-${roundNum}`}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      mb: 2,
                      pb: 1,
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: '#f59e0b' }}
                      >
                        {matches[0]?.roundName || `Round ${roundNum}`} (
                        {matches.length} Matches)
                      </Typography>

                      {tournament.currentRound &&
                      tournament.currentRound.trim().toLowerCase() ===
                        (matches[0]?.roundName || `Round ${roundNum}`)
                          .trim()
                          .toLowerCase() ? (
                        <Chip
                          size="small"
                          label="ACTIVE ROUND"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            backgroundColor: '#f59e0b',
                            color: '#000',
                          }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleFieldChange(
                              'currentRound',
                              matches[0]?.roundName || `Round ${roundNum}`,
                            )
                          }
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            py: 0,
                            px: 1,
                            textTransform: 'none',
                            color: 'text.secondary',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            '&:hover': {
                              borderColor: '#f59e0b',
                              color: '#f59e0b',
                            },
                          }}
                        >
                          Set as Active Round
                        </Button>
                      )}
                    </Box>

                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() =>
                        handleAddMatch(
                          roundNum,
                          matches[0]?.roundName || `Round ${roundNum}`,
                        )
                      }
                      sx={{ textTransform: 'none' }}
                    >
                      Add Match
                    </Button>
                  </Box>

                  <Grid container spacing={2.5}>
                    {matches.map((m) => (
                      <Grid size={{ xs: 12, md: 6 }} key={m.id}>
                        <Card
                          sx={{
                            p: 2,
                            borderRadius: '10px',
                            background:
                              m.status === 'live'
                                ? 'rgba(239, 68, 68, 0.08)'
                                : 'rgba(255, 255, 255, 0.03)',
                            border:
                              m.status === 'live'
                                ? '1px solid rgba(239, 68, 68, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, color: 'text.secondary' }}
                            >
                              Match #{m.matchNumber} ({m.roundName})
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteMatch(m.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Player 1 Row */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              mb: 1.5,
                            }}
                          >
                            <FormControl fullWidth size="small">
                              <InputLabel>Player 1</InputLabel>
                              <Select
                                label="Player 1"
                                value={m.player1?.handle || ''}
                                onChange={(e) => {
                                  const selected = tournament.players.find(
                                    (p) => p.handle === e.target.value,
                                  );
                                  handleUpdateMatch(m.id, {
                                    player1: selected
                                      ? {
                                          id: selected.id,
                                          handle: selected.handle,
                                          seed: selected.seed,
                                        }
                                      : null,
                                  });
                                }}
                              >
                                <MenuItem value="">TBD</MenuItem>
                                {tournament.players.map((p) => (
                                  <MenuItem key={p.handle} value={p.handle}>
                                    #{p.seed} {p.handle}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <TextField
                              size="small"
                              type="number"
                              label="Score"
                              sx={{ width: 80 }}
                              value={m.score1 ?? 0}
                              onChange={(e) =>
                                handleUpdateMatch(m.id, {
                                  score1: Number(e.target.value),
                                })
                              }
                            />
                          </Box>

                          {/* Player 2 Row */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              mb: 1.5,
                            }}
                          >
                            <FormControl fullWidth size="small">
                              <InputLabel>Player 2</InputLabel>
                              <Select
                                label="Player 2"
                                value={m.player2?.handle || ''}
                                onChange={(e) => {
                                  const selected = tournament.players.find(
                                    (p) => p.handle === e.target.value,
                                  );
                                  handleUpdateMatch(m.id, {
                                    player2: selected
                                      ? {
                                          id: selected.id,
                                          handle: selected.handle,
                                          seed: selected.seed,
                                        }
                                      : null,
                                  });
                                }}
                              >
                                <MenuItem value="">TBD</MenuItem>
                                {tournament.players.map((p) => (
                                  <MenuItem key={p.handle} value={p.handle}>
                                    #{p.seed} {p.handle}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>

                            <TextField
                              size="small"
                              type="number"
                              label="Score"
                              sx={{ width: 80 }}
                              value={m.score2 ?? 0}
                              onChange={(e) =>
                                handleUpdateMatch(m.id, {
                                  score2: Number(e.target.value),
                                })
                              }
                            />
                          </Box>

                          {/* Match Status & Winner Control */}
                          <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Status</InputLabel>
                              <Select
                                label="Status"
                                value={m.status}
                                onChange={(e) =>
                                  handleUpdateMatch(m.id, {
                                    status: e.target.value as
                                      | 'scheduled'
                                      | 'live'
                                      | 'completed',
                                  })
                                }
                              >
                                <MenuItem value="scheduled">Scheduled</MenuItem>
                                <MenuItem value="live">
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <FiberManualRecord
                                      sx={{ fontSize: 10, color: '#ef4444' }}
                                    />
                                    LIVE NOW
                                  </Box>
                                </MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                              </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                              <InputLabel>Winner</InputLabel>
                              <Select
                                label="Winner"
                                value={m.winnerHandle || ''}
                                onChange={(e) =>
                                  handleUpdateMatch(m.id, {
                                    winnerHandle: e.target.value || null,
                                  })
                                }
                              >
                                <MenuItem value="">None / Pending</MenuItem>
                                {m.player1 && (
                                  <MenuItem value={m.player1.handle}>
                                    {m.player1.handle}
                                  </MenuItem>
                                )}
                                {m.player2 && (
                                  <MenuItem value={m.player2.handle}>
                                    {m.player2.handle}
                                  </MenuItem>
                                )}
                              </Select>
                            </FormControl>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ))}
          </Stack>
        </CustomTabPanel>

        {/* Tab 3: Champion & Results */}
        <CustomTabPanel value={activeTab} index={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              maxWidth: 600,
            }}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}
            >
              <EmojiEvents sx={{ fontSize: 36, color: '#f59e0b' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Crown Tournament Champion
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select the final winner to be celebrated on the public bracket
              podium.
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Champion</InputLabel>
              <Select
                label="Select Champion"
                value={
                  typeof tournament.champion === 'string'
                    ? tournament.champion
                    : tournament.champion?.handle || ''
                }
                onChange={(e) => handleFieldChange('champion', e.target.value)}
              >
                <MenuItem value="">None / Undecided</MenuItem>
                {tournament.players.map((p) => (
                  <MenuItem key={p.handle} value={p.handle}>
                    #{p.seed} {p.handle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </CustomTabPanel>

        {/* Tab 4: Live Preview */}
        <CustomTabPanel value={activeTab} index={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Live Bracket Visual Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is how your tournament bracket currently appears to players
              in the launcher.
            </Typography>
          </Box>

          <TournamentBracket
            overrideTournaments={
              tournamentsList.length > 0 ? tournamentsList : [tournament]
            }
            overrideData={tournament}
            onRoundChange={(roundName) =>
              handleFieldChange('currentRound', roundName)
            }
            onTournamentChange={(selectedT) =>
              handleSelectTournament(selectedT.id ?? selectedT.slug ?? '')
            }
          />
        </CustomTabPanel>
      </Paper>

      {/* Add Player Dialog */}
      <Dialog
        open={addPlayerDialogOpen}
        onClose={() => setAddPlayerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Tournament Player
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Player Handle"
              placeholder="e.g. Player#123"
              value={newPlayerHandle}
              onChange={(e) => setNewPlayerHandle(e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Seed Number"
              value={newPlayerSeed}
              onChange={(e) => setNewPlayerSeed(Number(e.target.value))}
            />
            <TextField
              fullWidth
              label="Preferred Character (Optional)"
              placeholder="e.g. Lockwood"
              value={newPlayerChar}
              onChange={(e) => setNewPlayerChar(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setAddPlayerDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPlayer}
            sx={{
              backgroundColor: '#f59e0b',
              color: '#000',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import JSON Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(24, 24, 27, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Import Tournament JSON
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Paste valid Tournament JSON with `title`, `players`, and `matches`:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            placeholder="Paste JSON here..."
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setImportDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImportJson}
            sx={{
              backgroundColor: '#a855f7',
              color: '#fff',
              fontWeight: 700,
              '&:hover': { backgroundColor: '#9333ea' },
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
      />
    </Container>
  );
}
