/**
 * @fileoverview TournamentPage component for the Evos Launcher
 * Displays tournament information, champion hall of fame, tournament match history,
 * competitive rules and formats, and community tournament event coordination.
 *
 * @author Evos Launcher Team
 * @since 3.3.5
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  AccountTree,
  AdminPanelSettings,
  Article,
  EmojiEvents,
  Forum,
  Gavel,
  History,
  Info,
  MilitaryTech,
  SportsEsports,
  WorkspacePremium,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EvosStore from '../../lib/EvosStore';
import { PlayerData, getPlayerData, getSpecialNames } from '../../lib/Evos';
import Player from '../atlas/Player';
import PreviousGamesPlayed from '../stats-unified/PreviousGamesPlayed';
import ApiVersionToggle from '../generic/ApiVersionToggle';
import TournamentBracket from '../generic/TournamentBracket';

/**
 * Props for the CustomTabPanel component
 */
interface TabPanelProps {
  /** The child content to render inside the panel */
  children: React.ReactNode;
  /** Index of this tab */
  index: number;
  /** Currently active tab index */
  value: number;
}

/**
 * Custom Tab Panel component for displaying active tab contents
 */
function CustomTabPanel(props: TabPanelProps): React.ReactElement {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * TournamentPage component that presents competitive tournament information,
 * past match statistics, champion roster, and official tournament guidelines.
 *
 * @returns {React.ReactElement} The rendered TournamentPage component
 */
function TournamentPage(): React.ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeUser, apiVersion, isDev } = EvosStore();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [championsList, setChampionsList] = useState<PlayerData[]>([]);
  const [loadingChampions, setLoadingChampions] = useState<boolean>(true);
  const [isDevUser, setIsDevUser] = useState<boolean>(Boolean(isDev));

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

  /**
   * Handle tab selection change
   */
  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: number,
  ): void => {
    setActiveTab(newValue);
  };

  /**
   * Fetch tournament champions from special names API and load player details
   */
  useEffect(() => {
    let isMounted = true;

    const fetchChampions = async (): Promise<void> => {
      setLoadingChampions(true);
      try {
        const specialNames = await getSpecialNames();
        const winnerHandles: string[] = [
          ...(specialNames?.TournamentWinners || []),
        ];

        if (activeUser?.token && winnerHandles.length > 0) {
          const promises = winnerHandles.map((handle) =>
            getPlayerData(activeUser.token, handle).catch(() => null),
          );
          const results = await Promise.all(promises);
          const validPlayers = results
            .filter((res) => res !== null && res.data)
            .map((res) => res!.data);

          if (isMounted) {
            setChampionsList(validPlayers);
          }
        } else if (isMounted) {
          // Fallback mock representation for when token is not available
          const mockData: PlayerData[] = winnerHandles.map((handle) => ({
            handle,
            accountId: 0,
            bannerBg: 43,
            bannerFg: 0,
            titleId: 43,
            status: '',
            isDev: false,
          }));
          setChampionsList(mockData);
        }
      } catch (err) {
        if (isMounted) {
          setChampionsList([]);
        }
      } finally {
        if (isMounted) {
          setLoadingChampions(false);
        }
      }
    };

    fetchChampions();

    return () => {
      isMounted = false;
    };
  }, [activeUser]);

  return (
    <Container sx={{ py: 3, minHeight: '100vh', maxWidth: '100% !important' }}>
      {/* Radiant Tournament Championship Header */}
      <Paper
        elevation={0}
        sx={{
          background:
            'linear-gradient(135deg, #f59e0b 0%, #d97706 35%, #7c3aed 100%)',
          borderRadius: '16px 16px 0 0',
          padding: { xs: '1.5rem', md: '2rem' },
          marginBottom: '-1px',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '40%',
            background:
              'radial-gradient(circle at right center, rgba(255,255,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <EmojiEvents sx={{ fontSize: 36, color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  letterSpacing: '0.5px',
                }}
              >
                {t('tournament.title', 'Tournaments')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: 400,
                }}
              >
                {t(
                  'tournament.subtitle',
                  'Official EvoS tournaments, champions, rules & match history',
                )}
              </Typography>
            </Box>
          </Box>

          {isDevUser && (
            <Button
              variant="contained"
              startIcon={<AdminPanelSettings />}
              onClick={() => navigate('/tournament-admin')}
              sx={{
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '10px',
                px: 2,
                py: 1,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  background: 'rgba(0, 0, 0, 0.65)',
                  borderColor: '#fff',
                },
              }}
            >
              {t('tournament.adminPanel', 'Tournament Admin')}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main Glassmorphic Container with Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '0 0 16px 16px',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 18, 0.75)'
              : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          padding: { xs: '1rem', md: '1.5rem' },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Tournament navigation tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 48,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: '#f59e0b',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#f59e0b',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<AccountTree />}
            iconPosition="start"
            label={t('tournament.liveBracket', 'Live Bracket')}
            id="tournament-tab-0"
          />
          <Tab
            icon={<EmojiEvents />}
            iconPosition="start"
            label={t('tournament.champions', 'Hall of Fame')}
            id="tournament-tab-1"
          />
          <Tab
            icon={<History />}
            iconPosition="start"
            label={t('tournament.matches', 'Tournament Matches')}
            id="tournament-tab-2"
          />
          {/* <Tab
            icon={<Gavel />}
            iconPosition="start"
            label={t('tournament.rules', 'Formats & Rules')}
            id="tournament-tab-3"
          />
          <Tab
            icon={<Forum />}
            iconPosition="start"
            label={t('tournament.community', 'Discord & Events')}
            id="tournament-tab-4"
          /> */}
        </Tabs>

        {/* Tab 0: Live Tournament Bracket */}
        <CustomTabPanel value={activeTab} index={0}>
          <TournamentBracket />
        </CustomTabPanel>

        {/* Tab 1: Hall of Fame & Champions */}
        <CustomTabPanel value={activeTab} index={1}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WorkspacePremium sx={{ color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('tournament.hallOfFameTitle', 'Tournament Champions')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t(
                'tournament.hallOfFameSubtitle',
                'Honoring the elite players who have conquered the Atlas Reactor arena in official EvoS tournaments.',
              )}
            </Typography>
          </Box>

          {loadingChampions && (
            <Typography
              variant="body1"
              sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}
            >
              {t('loading', 'Loading champions...')}
            </Typography>
          )}

          {!loadingChampions && championsList.length === 0 && (
            <Typography
              variant="body1"
              sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}
            >
              {t('tournament.noChampions', 'No tournament champions found.')}
            </Typography>
          )}

          {!loadingChampions && championsList.length > 0 && (
            <Grid container spacing={3}>
              {championsList.map((player) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.handle}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px rgba(245, 158, 11, 0.25)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                      },
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          icon={<MilitaryTech />}
                          label={t(
                            'tournament.championBadge',
                            'Tournament Champion',
                          )}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontWeight: 600,
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        />
                      </Box>
                      <Player
                        info={player}
                        disableSkew
                        characterType={undefined}
                        titleOld={t(
                          'tournament.championBadge',
                          'Tournament Champion',
                        )}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CustomTabPanel>

        {/* Tab 2: Tournament Matches */}
        <CustomTabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <SportsEsports sx={{ color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('tournament.matchesTitle', 'Tournament Match History')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t(
                'tournament.matchesSubtitle',
                'Review past tournament games, lineups, and performance statistics across competitive brackets.',
              )}
            </Typography>
          </Box>

          <ApiVersionToggle />
          <PreviousGamesPlayed
            apiVersion={apiVersion}
            initialType="Tournament"
          />
        </CustomTabPanel>

        {/* Tab 3: Formats & Rules */}
        <CustomTabPanel value={activeTab} index={3}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Gavel sx={{ color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('tournament.formatsTitle', 'Competitive Formats & Rules')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t(
                'tournament.rulesDescription',
                'Official rules and specifications governing EvoS competitive tournament play.',
              )}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Format 1 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  p: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#f59e0b', fontWeight: 700, mb: 1 }}
                  >
                    {t(
                      'Tournament_Draft_Bans@GameWideData',
                      'Tournament Draft (Bans)',
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(
                      'tournament.draftBansDesc',
                      'Premier competitive format. Teams take turns banning strategic freelancers, followed by a snake draft picking phase.',
                    )}
                  </Typography>
                  <Divider
                    sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    • 4 vs 4 Team Combat
                    <br />
                    • 1-2 Bans per team
                    <br />• Unique Freelancer selection (no duplicates)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Format 2 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  p: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '1px solid rgba(66, 165, 245, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#42a5f5', fontWeight: 700, mb: 1 }}
                  >
                    {t(
                      'Tournament_Draft_NoBans@GameWideData',
                      'Tournament Draft (No Bans)',
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(
                      'tournament.draftNoBansDesc',
                      'Classic snake draft where all freelancers are accessible. Teams strategically construct their roster in alternating pick order.',
                    )}
                  </Typography>
                  <Divider
                    sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    • 4 vs 4 Team Combat
                    <br />
                    • No bans phase
                    <br />• Counter-pick strategy enabled
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Format 3 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  p: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#a855f7', fontWeight: 700, mb: 1 }}
                  >
                    {t(
                      'Tournament_NoDraft@GameWideData',
                      'Tournament (No Draft)',
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(
                      'tournament.noDraftDesc',
                      'Blind pick tournament format. Teams lock in their preferred squad composition without opponent visibility until match start.',
                    )}
                  </Typography>
                  <Divider
                    sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    • 4 vs 4 Team Combat
                    <br />
                    • Simultaneous blind pick
                    <br />• Pure execution & synergy focus
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* General Rules Box */}
            <Grid size={{ xs: 12 }}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Info sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t(
                      'tournament.generalRules',
                      'Standard Tournament Guidelines',
                    )}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  1. <strong>Turn Timers</strong>: Standard decision phase timer
                  of 20 seconds per turn is strictly enforced.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  2. <strong>Map Rotation</strong>: Matches occur on standard
                  competition maps: Omni Reactor Core, EvoS Labs, Oblivion,
                  Hexcelence, Flyway Freighter, Cloudspire, and Hyperforge.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. <strong>Disconnection Policy</strong>: In case of
                  unexpected server or client disconnects prior to Turn 2 damage
                  resolution, a full rematch may be granted by tournament
                  referees.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Tab 4: Discord & Community Events */}
        <CustomTabPanel value={activeTab} index={4}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Forum sx={{ color: '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {t('tournament.communityTitle', 'Tournament Hub & Community')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t(
                'tournament.communitySubtitle',
                'Connect with tournament organizers, register your team, and receive real-time bracket updates.',
              )}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, rgba(88, 101, 242, 0.12) 0%, rgba(88, 101, 242, 0.04) 100%)',
                  border: '1px solid rgba(88, 101, 242, 0.3)',
                  p: 1.5,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#5865F2', fontWeight: 700, mb: 1 }}
                  >
                    {t(
                      'tournament.joinDiscordTitle',
                      'EvoS Discord Tournament Hub',
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(
                      'tournament.discordHubDesc',
                      'All tournament registrations, bracket announcements, match scheduling, and live stream broadcasts are coordinated through the official Discord server.',
                    )}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Forum />}
                    onClick={() => navigate('/discord')}
                    sx={{
                      backgroundColor: '#5865F2',
                      '&:hover': { backgroundColor: '#4752C4' },
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('menuOptions.joinDiscord', 'Join Discord')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  p: 1.5,
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: '#f59e0b', fontWeight: 700, mb: 1 }}
                  >
                    {t('tournament.wikiTitle', 'Tournament Guides & Wiki')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(
                      'tournament.wikiDesc',
                      'Consult the community wiki for in-depth freelancer mod builds, competitive strategy guides, and past tournament vod archives.',
                    )}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Article />}
                    onClick={() => navigate('/wiki')}
                    sx={{
                      color: '#f59e0b',
                      borderColor: '#f59e0b',
                      '&:hover': {
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                      },
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {t('menuOptions.wiki', 'View Wiki')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>
      </Paper>
    </Container>
  );
}

export default TournamentPage;
