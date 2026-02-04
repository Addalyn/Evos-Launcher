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
  Chip,
  Fade,
  Grow,
  keyframes,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import EvosStore from 'renderer/lib/EvosStore';
import DiscordPage from './DiscordPage';
import { strapiClient } from 'renderer/lib/strapi';
import { achievementIcon } from 'renderer/lib/Resources';
import {
  EmojiEvents,
  Star,
  CheckCircle,
  Search,
  Close,
  FilterList,
  Category as CategoryIcon,
} from '@mui/icons-material';

// Keyframe animations
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6); }
`;

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { search } = useLocation();
  const navigate = useNavigate();

  // Extract unique categories from quests
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    combinedQuests.forEach((q) => cats.add(q.category));
    return ['all', ...Array.from(cats).sort()];
  }, [combinedQuests]);

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

  // Filter quests based on active tab and category
  const getFilteredQuests = (): CombinedQuest[] => {
    let filtered: CombinedQuest[] = [];
    
    switch (activeTab) {
      case 0: // All Quests
        filtered = combinedQuests;
        break;
      case 1: // In Progress
        // Show quests that are not completed and have some progress OR are repeatable and not completed in current attempt
        filtered = combinedQuests.filter(
          (q) => !q.isCompleted && q.currentProgress > 0,
        );
        break;
      case 2: // Completed
        filtered = combinedQuests.filter((q) => q.isCompleted);
        break;
      default:
        filtered = combinedQuests;
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.category === selectedCategory);
    }

    return filtered;
  };

  const filteredQuests = getFilteredQuests();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 50%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
          backgroundSize: '200% 200%',
          animation: `${gradientAnimation} 8s ease infinite`,
          backdropFilter: 'blur(20px)',
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: (theme) =>
            `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: (theme) =>
              `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%)`,
            pointerEvents: 'none',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={1} position="relative">
          <Box
            sx={{
              animation: `${floatAnimation} 3s ease-in-out infinite`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EmojiEvents
              sx={{
                fontSize: 48,
                color: 'warning.main',
                filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.3))',
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="h3"
              component="h1"
              fontWeight="800"
              sx={{
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              {t('quests.title')}
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mt: 0.5, fontWeight: 500 }}
            >
              {t('quests.subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Player Search Input */}
        {/* <Box
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
        </Box> */}
      </Box>

      {/* Overall XP Progress Bar */}
      {!loading && combinedQuests.length > 0 && (
        <Fade in timeout={600}>
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: (theme) =>
                `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              boxShadow: (theme) =>
                `0 4px 24px ${alpha(theme.palette.warning.main, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: (theme) =>
                  `0 8px 32px ${alpha(theme.palette.warning.main, 0.15)}`,
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    animation: `${pulseGlow} 2s ease-in-out infinite`,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Star sx={{ color: 'warning.main', fontSize: 28 }} />
                </Box>
                <Typography variant="h6" fontWeight="700">
                  {t('quests.totalProgress')}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography
                  variant="h5"
                  fontWeight="800"
                  sx={{
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {xpStats.earned.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  / {xpStats.possible.toLocaleString()} XP
                </Typography>
              </Box>
            </Box>
            <Box position="relative">
              <LinearProgress
                variant="determinate"
                value={
                  xpStats.possible > 0
                    ? (xpStats.earned / xpStats.possible) * 100
                    : 0
                }
                sx={{
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.warning.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 8,
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.warning.light} 100%)`,
                    backgroundSize: '200% 100%',
                    animation: `${gradientAnimation} 3s ease infinite`,
                    boxShadow: (theme) =>
                      `0 0 20px ${alpha(theme.palette.warning.main, 0.6)}`,
                  },
                }}
              />
              <Typography
                variant="caption"
                fontWeight="700"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                {xpStats.possible > 0
                  ? `${Math.round((xpStats.earned / xpStats.possible) * 100)}%`
                  : '0%'}
              </Typography>
            </Box>
          </Box>
        </Fade>
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
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              '&:hover': {
                color: 'primary.main',
                transform: 'translateY(-2px)',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            },
          }}
        >
          <Tab label={t('quests.tabs.all')} />
          <Tab label={t('quests.tabs.inProgress')} />
          <Tab label={t('quests.tabs.completed')} />
        </Tabs>
      </Box>

      {/* Category Filters */}
      {!loading && categories.length > 1 && (
        <Fade in timeout={400}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: (theme) =>
                alpha(theme.palette.background.paper, 0.4),
              backdropFilter: 'blur(10px)',
              border: (theme) =>
                `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <FilterList sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                Filter by Category
              </Typography>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category === 'all' ? 'All Categories' : category}
                  onClick={() => setSelectedCategory(category)}
                  icon={<CategoryIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    background:
                      selectedCategory === category
                        ? (theme) =>
                            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                        : (theme) => alpha(theme.palette.background.paper, 0.6),
                    color:
                      selectedCategory === category
                        ? 'white'
                        : 'text.primary',
                    border:
                      selectedCategory === category
                        ? 'none'
                        : (theme) =>
                            `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) =>
                        selectedCategory === category
                          ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                          : `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                    },
                    '& .MuiChip-icon': {
                      color:
                        selectedCategory === category
                          ? 'white'
                          : 'text.secondary',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Fade>
      )}

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
          <Box display="flex" flexDirection="column" gap={2.5}>
            {filteredQuests.map((quest, index) => {
              const progressPercent =
                (quest.currentProgress / quest.targetProgress) * 100;
              const isNearCompletion = progressPercent >= 80 && !quest.isCompleted;

              return (
                <Grow
                  key={`${quest.questId}-${quest.completedAt || 'active'}`}
                  in
                  timeout={300 + index * 100}
                  style={{ transformOrigin: '0 0 0' }}
                >
                  <Card
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      background: (theme) =>
                        quest.isCompleted
                          ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
                          : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
                      backdropFilter: 'blur(20px)',
                      borderRadius: 3,
                      border: (theme) =>
                        quest.isCompleted
                          ? `2px solid ${alpha(theme.palette.success.main, 0.4)}`
                          : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.01)',
                        boxShadow: (theme) =>
                          quest.isCompleted
                            ? `0 12px 40px ${alpha(theme.palette.success.main, 0.25)}`
                            : `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                        border: (theme) =>
                          quest.isCompleted
                            ? `2px solid ${alpha(theme.palette.success.main, 0.6)}`
                            : `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                      '&::before': quest.isCompleted
                        ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: (theme) =>
                              `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                            backgroundSize: '200% 100%',
                            animation: `${gradientAnimation} 3s ease infinite`,
                          }
                        : {},
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        mb={2}
                      >
                        <Box flex={1}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                            {/* Quest Icon */}
                            {quest.icon ? (
                              <Box
                                component="img"
                                src={achievementIcon(quest.icon)}
                                alt={quest.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                                }}
                              />
                            ) : (
                              <EmojiEvents
                                sx={{
                                  fontSize: 40,
                                  color: 'warning.main',
                                  filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))',
                                }}
                              />
                            )}
                            <Typography
                              variant="h6"
                              fontWeight="700"
                              sx={{
                                fontSize: '1.1rem',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {quest.name}
                            </Typography>
                            {quest.isCompleted && (
                              <Box
                                sx={{
                                  animation: `${floatAnimation} 2s ease-in-out infinite`,
                                }}
                              >
                                <CheckCircle
                                  sx={{
                                    color: 'success.main',
                                    fontSize: 26,
                                    filter: 'drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))',
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1.5, lineHeight: 1.6 }}
                          >
                            {quest.description}
                          </Typography>
                          <Chip
                            label={quest.category}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              background: (theme) =>
                                alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              border: (theme) =>
                                `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                          />
                        </Box>
                        <Box textAlign="right" ml={3}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            mb={0.5}
                            sx={{
                              animation: isNearCompletion
                                ? `${pulseGlow} 2s ease-in-out infinite`
                                : 'none',
                            }}
                          >
                            <Star
                              sx={{
                                color: 'warning.main',
                                fontSize: 24,
                                filter: 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3))',
                              }}
                            />
                            <Typography
                              variant="h5"
                              fontWeight="800"
                              sx={{
                                background: (theme) =>
                                  `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {quest.rewardXp.toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight="600"
                          >
                            XP Reward
                          </Typography>
                          {quest.rewardTitle && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                fontStyle: 'italic',
                              }}
                            >
                              "{quest.rewardTitle}"
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Progress Bar */}
                      {!quest.isCompleted && (
                        <Box mt={2}>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={1}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight="600"
                            >
                              {t('quests.progress')}
                            </Typography>
                            <Typography variant="caption" fontWeight="700">
                              {quest.currentProgress} / {quest.targetProgress}
                              <Typography
                                component="span"
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 0.5 }}
                              >
                                ({Math.round(progressPercent)}%)
                              </Typography>
                            </Typography>
                          </Box>
                          <Box position="relative">
                            <LinearProgress
                              variant="determinate"
                              value={progressPercent}
                              sx={{
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 6,
                                  background: (theme) =>
                                    isNearCompletion
                                      ? `linear-gradient(90deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.warning.light} 100%)`
                                      : `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  backgroundSize: '200% 100%',
                                  animation: isNearCompletion
                                    ? `${gradientAnimation} 2s ease infinite`
                                    : 'none',
                                  boxShadow: (theme) =>
                                    isNearCompletion
                                      ? `0 0 12px ${alpha(theme.palette.warning.main, 0.5)}`
                                      : 'none',
                                  transition: 'all 0.3s ease',
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      )}

                      {/* Completion Info */}
                      {quest.isCompleted && quest.completedAt && (
                        <Box
                          mt={2}
                          p={1.5}
                          borderRadius={2}
                          sx={{
                            background: (theme) =>
                              alpha(theme.palette.success.main, 0.1),
                            border: (theme) =>
                              `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="success.main"
                            fontWeight="700"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <CheckCircle sx={{ fontSize: 16 }} />
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
                </Grow>
              );
            })}
          </Box>
        );
      })()}
    </Container>
  );
}
