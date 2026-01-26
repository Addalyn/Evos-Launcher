import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Skeleton,
  Tab,
  Tabs,
  Typography,
  alpha,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import EvosStore from 'renderer/lib/EvosStore';
import DiscordPage from './DiscordPage';
import { strapiClient } from 'renderer/lib/strapi';
import {
  EmojiEvents,
  Star,
  CheckCircle,
  Search,
  Close,
} from '@mui/icons-material';

/**
 * Interface for quest progress data from the database
 */
interface QuestProgress {
  id: number;
  username: string;
  quest_id: string;
  current_progress: number;
  target_progress: number;
  last_updated: string;
  metadata?: any;
}

/**
 * Interface for quest completion data from the database
 */
interface QuestCompletion {
  id: number;
  username: string;
  quest_id: string;
  completed_at: string;
  reward_xp: number;
  reward_title: string;
}

/**
 * Interface for quest definition from quests.json
 */
interface QuestDefinition {
  id: string;
  index: number;
  name: string;
  description: string;
  type: string;
  category: string;
  requirements: any;
  difficulty: string;
  reward: {
    xp: number;
    title: string;
  };
  one_time_only: boolean;
  enabled: boolean;
  icon?: string;
}

/**
 * Combined quest data for display
 */
interface CombinedQuest {
  questId: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  currentProgress: number;
  targetProgress: number;
  rewardXp: number;
  rewardTitle: string;
  isCompleted: boolean;
  completedAt?: string;
  lastUpdated?: string;
  icon?: string;
}

/**
 * Keywords in quest names that should be hidden from the launcher
 */
const BLACKLISTED_KEYWORDS = [
  'season level',
  'gg boost',
  'friend list',
  'flux from',
  'acquisition',
  'acquire',
  'friends list',
  'prestige points',
  'skin',
  'friend',
  'separate days',
  'overcon',
  'taunt',
  'extraction',
  'clone combat',
  'overpowered-up',
  'fill',
  'all random',
  'non-deathmatch',
  'duo ranked',
  'points through various activities',
  'each as a',
  'with ',
  'influence',
  '7500 total points',
  'ribbon',
  'daily',
  'to level',
  'Placeholder',
  'developers',
  'Dev Killers',
  'daily',
  'badge points',
];

/**
 * Fetch quest progress for a user
 */
const fetchQuestProgress = async (
  username: string,
): Promise<QuestProgress[]> => {
  try {
    const strapi = strapiClient
      .from('quest-progresses')
      .select(['*'])
      .equalTo('username', username)
      .sortBy([{ field: 'last_updated', order: 'desc' }]);

    const { data, error } = await strapi.get();

    if (error) {
      return [];
    }

    return (data as QuestProgress[]) || [];
  } catch (error) {
    return [];
  }
};

/**
 * Fetch quest completions for a user
 */
const fetchQuestCompletions = async (
  username: string,
): Promise<QuestCompletion[]> => {
  try {
    const strapi = strapiClient
      .from('quest-completions')
      .select(['*'])
      .equalTo('username', username)
      .sortBy([{ field: 'completed_at', order: 'desc' }]);

    const { data, error } = await strapi.get();

    if (error) {
      return [];
    }

    return (data as QuestCompletion[]) || [];
  } catch (error) {
    return [];
  }
};

/**
 * QuestsPage component - displays user quests with progress tracking
 */
export default function QuestsPage(): React.ReactElement {
  const { t } = useTranslation();
  const { activeUser, discordId } = EvosStore();
  const [activeTab, setActiveTab] = useState(0);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>(
    [],
  );
  const [questsDefinitions, setQuestsDefinitions] = useState<QuestDefinition[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [combinedQuests, setCombinedQuests] = useState<CombinedQuest[]>([]);
  const [xpStats, setXpStats] = useState({ earned: 0, possible: 0 });
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { search } = useLocation();
  const navigate = useNavigate();

  const searchParams = React.useMemo(
    () => new URLSearchParams(search),
    [search],
  );

  // Initialize playerSearch from URL or active user
  useEffect(() => {
    const playerParam = searchParams.get('player');
    if (playerParam) {
      setPlayerSearch(playerParam);
      setSearchInput(playerParam);
    } else if (activeUser?.handle) {
      setPlayerSearch(activeUser.handle);
      setSearchInput(activeUser.handle);
    }
  }, [searchParams, activeUser?.handle]);

  // Fetch quest data
  useEffect(() => {
    const fetchData = async () => {
      if (!playerSearch) {
        return;
      }

      setLoading(true);

      try {
        const [progress, completions, questsRes] = await Promise.all([
          fetchQuestProgress(playerSearch),
          fetchQuestCompletions(playerSearch),
          fetch('https://misc.evos.live/quests.json').then((res) => res.json()),
        ]);

        setQuestProgress(progress);
        setQuestCompletions(completions);
        setQuestsDefinitions(questsRes.quests || []);
      } catch (error) {
        // Error handling
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`?player=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchInput(activeUser?.handle || '');
    navigate('');
  };

  // Combine quest data from database and quests.json
  useEffect(() => {
    if (questsDefinitions.length === 0) return;

    const combined: CombinedQuest[] = [];
    let earnedXp = 0;
    let possibleXp = 0;

    // Map progress by quest ID for easier lookup
    const progressByQuest = new Map<string, QuestProgress>();
    questProgress.forEach((p) => progressByQuest.set(p.quest_id, p));

    // Map completions by quest ID for easier lookup
    const completionsByQuest = new Map<string, QuestCompletion[]>();
    questCompletions.forEach((c) => {
      const existing = completionsByQuest.get(c.quest_id) || [];
      completionsByQuest.set(c.quest_id, [...existing, c]);
    });

    // Populate earnedXp strictly from completions
    questCompletions.forEach((completion) => {
      earnedXp += completion.reward_xp;
    });

    // Strategy: Build the list from all enabled quests in the definition
    questsDefinitions
      .filter((q) => {
        if (!q.enabled || q.reward.xp === 0) return false;
        const nameLower = q.name.toLowerCase();
        return !BLACKLISTED_KEYWORDS.some((keyword) =>
          nameLower.includes(keyword.toLowerCase()),
        );
      })
      .forEach((questDef) => {
        const progress = progressByQuest.get(questDef.id);
        const completions = completionsByQuest.get(questDef.id) || [];

        const isCompleted = completions.length > 0;
        const hasProgress = !!progress;

        // Handle completions (one card for each completion if repeatable)
        // for "All Quests" and "Completed" tabs
        completions.forEach((completion) => {
          combined.push({
            questId: questDef.id,
            name: questDef.name,
            description: questDef.description,
            category: questDef.category,
            difficulty: questDef.difficulty,
            currentProgress: questDef.requirements.count || 1,
            targetProgress: questDef.requirements.count || 1,
            rewardXp: completion.reward_xp,
            rewardTitle: completion.reward_title,
            isCompleted: true,
            completedAt: completion.completed_at,
            icon: questDef.icon,
          });
        });

        // Special case: for one-time quests that are completed, we don't show active progress
        if (questDef.one_time_only && isCompleted) {
          return;
        }

        // Check for active progress that isn't just an old record of a finished quest
        let isActive = false;
        let currentProgress = 0;
        let lastUpdated = '';

        if (hasProgress) {
          const latestComp =
            completions.length > 0
              ? [...completions].sort(
                  (a, b) =>
                    new Date(b.completed_at).getTime() -
                    new Date(a.completed_at).getTime(),
                )[0]
              : null;

          const progressTime = new Date(progress.last_updated).getTime();
          const completionTime = latestComp
            ? new Date(latestComp.completed_at).getTime()
            : 0;

          // If progress is newer than completion OR it's not finished, it's active
          if (
            progressTime > completionTime ||
            progress.current_progress < progress.target_progress
          ) {
            isActive = true;
            currentProgress = progress.current_progress;
            lastUpdated = progress.last_updated;
          }
        }

        // Add as an active quest if it has progress, or as 0% if it's never been touched (for "All Quests" tab)
        // If it's not already handled by a completion card OR it's repeatable and can be started again
        if (isActive || !isCompleted) {
          possibleXp += questDef.reward.xp;
          combined.push({
            questId: questDef.id,
            name: questDef.name,
            description: questDef.description,
            category: questDef.category,
            difficulty: questDef.difficulty,
            currentProgress,
            targetProgress: questDef.requirements.count || 1,
            rewardXp: questDef.reward.xp,
            rewardTitle: questDef.reward.title,
            isCompleted: false,
            lastUpdated,
            icon: questDef.icon,
          });
        }
      });

    setCombinedQuests(combined);
    setXpStats({ earned: earnedXp, possible: possibleXp });
  }, [questProgress, questCompletions, questsDefinitions]);

  // Check if user is authenticated
  if (discordId === 0) {
    return <DiscordPage />;
  }

  // Filter quests based on active tab
  const getFilteredQuests = (): CombinedQuest[] => {
    switch (activeTab) {
      case 0: // All Quests
        return combinedQuests;
      case 1: // In Progress
        // Show quests that are not completed and have some progress OR are repeatable and not completed in current attempt
        return combinedQuests.filter(
          (q) => !q.isCompleted && q.currentProgress > 0,
        );
      case 2: // Completed
        return combinedQuests.filter((q) => q.isCompleted);
      default:
        return combinedQuests;
    }
  };

  const filteredQuests = getFilteredQuests();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            {t('quests.title')}
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          {t('quests.subtitle')}
        </Typography>

        {/* Player Search Input */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ mt: 3, maxWidth: 400 }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={t('menuOptions.searchPlayer')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput !== activeUser?.handle && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      edge="end"
                    >
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.background.paper, 0.5),
                borderRadius: 2,
                '& fieldset': {
                  borderColor: (theme) => alpha(theme.palette.divider, 0.2),
                },
                '&:hover fieldset': {
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.5),
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Overall XP Progress Bar */}
      {!loading && combinedQuests.length > 0 && (
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            background: (theme) => alpha(theme.palette.background.paper, 0.5),
            backdropFilter: 'blur(10px)',
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1.5}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Star sx={{ color: 'warning.main', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="bold">
                {t('quests.totalProgress')}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {xpStats.earned.toLocaleString()} /{' '}
              {xpStats.possible.toLocaleString()}{' '}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
              >
                XP
              </Typography>
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={
              xpStats.possible > 0
                ? (xpStats.earned / xpStats.possible) * 100
                : 0
            }
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.05),
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                background: (theme) =>
                  `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                boxShadow: (theme) =>
                  `0 0 10px ${alpha(theme.palette.warning.main, 0.5)}`,
              },
            }}
          />
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
        >
          <Tab label={t('quests.tabs.all')} />
          <Tab label={t('quests.tabs.inProgress')} />
          <Tab label={t('quests.tabs.completed')} />
        </Tabs>
      </Box>

      {/* Quest Cards */}
      {(() => {
        if (loading) {
          return (
            <Box display="flex" flexDirection="column" gap={2}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={150}
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Box>
          );
        }

        if (filteredQuests.length === 0) {
          return (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                borderRadius: 2,
                background: (theme) =>
                  alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                {t('quests.noQuests')}
              </Typography>
            </Box>
          );
        }

        return (
          <Box display="flex" flexDirection="column" gap={2}>
            {filteredQuests.map((quest) => (
              <Card
                key={quest.questId}
                sx={{
                  position: 'relative',
                  overflow: 'visible',
                  background: (theme) =>
                    quest.isCompleted
                      ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`
                      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: (theme) =>
                    quest.isCompleted
                      ? `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                      : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) =>
                      `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
                  },
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {quest.name}
                        </Typography>
                        {quest.isCompleted && (
                          <CheckCircle
                            sx={{ color: 'success.main', fontSize: 24 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {quest.description}
                      </Typography>
                    </Box>
                    <Box textAlign="right" ml={2}>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <Star sx={{ color: 'warning.main', fontSize: 20 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {quest.rewardXp.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          XP
                        </Typography>
                      </Box>
                      {quest.rewardTitle && (
                        <Typography variant="caption" color="text.secondary">
                          {quest.rewardTitle}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Progress Bar */}
                  {!quest.isCompleted && (
                    <Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        mb={0.5}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {t('quests.progress')}
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {quest.currentProgress} / {quest.targetProgress}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (quest.currentProgress / quest.targetProgress) * 100
                        }
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: (theme) =>
                              `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Completion Info */}
                  {quest.isCompleted && quest.completedAt && (
                    <Box mt={1}>
                      <Typography
                        variant="caption"
                        color="success.main"
                        fontWeight="bold"
                      >
                        {t('quests.completed')} •{' '}
                        {new Date(quest.completedAt).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        );
      })()}
    </Container>
  );
}
