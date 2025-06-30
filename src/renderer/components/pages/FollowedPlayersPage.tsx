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
    <Container sx={{ py: 3 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {playerInfoList.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            You are not following any players.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {playerInfoList.map((info) => (
              <Grid item xs={12} sm={6} md={6} key={info.handle}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: (theme) => theme.palette.secondary.main,
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
                  <CardActions>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => removeFollowedPlayer(info.handle)}
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
