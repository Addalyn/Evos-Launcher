/**
 * @fileoverview FollowedPlayersPage component for managing followed players.
 * Displays a list of followed players and allows users to remove them.
 * Utilizes Material-UI components for styling and layout.
 */

import React, { JSX, useEffect, useState } from 'react';
import {
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
} from '@mui/material';
import EvosStore from '../../lib/EvosStore';
import Player from '../atlas/Player';
import { getPlayerData, PlayerData } from '../../lib/Evos';
import { t } from 'i18next';

/**
 * FollowedPlayersPage component.
 * @returns {JSX.Element} The rendered FollowedPlayersPage component.
 */
function FollowedPlayersPage(): JSX.Element {
  const { followedPlayers, removeFollowedPlayer, activeUser } = EvosStore();
  const [playerInfoList, setPlayerInfoList] = useState<PlayerData[]>([]);

  useEffect(() => {
    const fetchPlayerInfo = async (): Promise<void> => {
      try {
        const infoList = await Promise.all(
          followedPlayers.map((player) =>
            getPlayerData(activeUser!.token, player),
          ),
        );
        setPlayerInfoList(
          infoList.map((info) => info.data).filter((info) => info !== null),
        );
      } catch (error) {
        setPlayerInfoList([]);
      }
    };

    fetchPlayerInfo();
  }, [followedPlayers, activeUser]);

  return (
    <Container sx={{ py: 3, minHeight: '100vh' }}>
      {/* Gradient Header Section */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px 16px 0 0',
          padding: '2rem',
          marginBottom: '-1px',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          {t('followedPlayers.title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 400,
          }}
        >
          {t('followedPlayers.subtitle')}
        </Typography>
      </Paper>

      {/* Glassmorphism Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '0 0 16px 16px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
        }}
      >
        {playerInfoList.length === 0 ? (
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              padding: '3rem',
              fontSize: '1.1rem',
              color: 'text.secondary',
            }}
          >
            {t('followedPlayers.noPlayers')}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {playerInfoList.map((info) => (
              <Grid size={{ xs: 12, sm: 6, md: 6 }} key={info.handle}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    },
                  }}
                >
                  <CardContent>
                    <Player
                      info={info}
                      disableSkew
                      characterType={undefined}
                      titleOld=""
                    />
                  </CardContent>
                  <CardActions sx={{ padding: '1rem' }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => removeFollowedPlayer(info.handle)}
                      sx={{
                        background:
                          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        },
                      }}
                    >
                      {t('menuOptions.Unfollow', 'Unfollow')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}

export default FollowedPlayersPage;
