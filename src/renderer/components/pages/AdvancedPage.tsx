/* eslint-disable react/no-array-index-key */
/* eslint-disable react/no-danger */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TableContainer,
  Tooltip,
} from '@mui/material';
import { t } from 'i18next';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import abilitys from '../../lib/Abilities.json';
import { convertToLegacyName } from 'renderer/lib/Resources';

type AbilityGameSummaryList = {
  AbilityClassName: string;
  AbilityName: string;
  ActionType: number;
  CastCount: number;
  ModName: string;
  TauntCount: number;
  TotalAbsorb: number;
  TotalDamage: number;
  TotalEnergyGainOnSelf: number;
  TotalEnergyGainToOthers: number;
  TotalEnergyLossToOthers: number;
  TotalHealing: number;
  TotalPotentialAbsorb: number;
  TotalTargetsHit: number;
};

type PlayerType = {
  id: number;
  game_id: number;
  user: string;
  character: string;
  takedowns: number;
  deaths: number;
  deathblows: number;
  damage: number;
  healing: number;
  damage_received: number;
  createdAt: string;
  updatedAt: string;
  team: string;
  TotalHealingReceived: number;
  TotalPlayerAbsorb: number;
  PowerupsCollected: number;
  DamageAvoidedByEvades: Number;
  MyIncomingDamageReducedByCover: Number;
  MyOutgoingExtraDamageFromEmpowered: Number;
  MyOutgoingReducedDamageFromWeakened: Number;
  MovementDeniedByMe: Number;
  EnemiesSightedPerTurn: Number;
  DashCatalystUsed: boolean;
  DashCatalystName: string;
  CombatCatalystUsed: boolean;
  CombatCatalystName: string;
  PrepCatalystUsed: boolean;
  PrepCatalystName: string;
  advancedstats: AbilityGameSummaryList[];
  Deadliest: boolean;
  Supportiest: boolean;
  Tankiest: boolean;
  MostDecorated: boolean;
};

type Game = {
  id: number;
  date: string;
  gameid: number;
  teamwin: string;
  turns: number;
  score: string;
  map: string;
  stats: PlayerType[];
  gametype: string;
  server: string;
  version: string;
  channelid: string;
  createdAt: string;
  GameServerProcessCode: string;
};

// @ts-ignore
const normalizeKeys = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }

  return Object.keys(obj).reduce((acc, key) => {
    // @ts-ignore
    acc[key.toLowerCase()] = normalizeKeys(obj[key]);
    return acc;
  }, {});
};

const abilitiesLowercased = normalizeKeys(abilitys);

function Row(props: {
  row: PlayerType;
  isOpen: boolean;
  game: Game;
  player: PlayerType;
  onToggle: () => void;
}) {
  const { row, isOpen, onToggle, game, player } = props;
  const abilitydata =
    abilitiesLowercased[
      convertToLegacyName(
        row.character.replace(/:3/g, '') as string,
      )?.toLowerCase() || ''
    ];

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          backgroundColor:
            (game.teamwin === 'TeamA' && player.team === 'TeamA') ||
            (game.teamwin === 'TeamB' && player.team === 'TeamB')
              ? '#22c9554f'
              : '#ff423a4f',
        }}
      >
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={onToggle}>
            {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.user}
        </TableCell>
        <TableCell>{player.character.replace(/:3/g, '')}</TableCell>
        <TableCell>{row.TotalHealingReceived}</TableCell>
        <TableCell>{row.TotalPlayerAbsorb}</TableCell>
        <TableCell>{row.PowerupsCollected}</TableCell>
        {/* <TableCell>{row.DamageAvoidedByEvades.toString()}</TableCell> // Seems always 0 */}
        <TableCell>{row.MyIncomingDamageReducedByCover.toString()}</TableCell>
        <TableCell>
          {row.MyOutgoingExtraDamageFromEmpowered.toString()}
        </TableCell>
        <TableCell>
          {row.MyOutgoingReducedDamageFromWeakened.toString()}
        </TableCell>
        <TableCell>{row.MovementDeniedByMe.toString()}</TableCell>
        <TableCell>{row.EnemiesSightedPerTurn.toString()}</TableCell>
        <TableCell>
          <Typography
            variant="caption"
            sx={{ color: row.PrepCatalystUsed ? '#77ff00' : undefined }}
          >
            <Box
              component="span"
              display="flex"
              alignItems="center"
              style={{ textTransform: 'capitalize' }}
            >
              {t(`advstats.${row.PrepCatalystName}`)}
              {row.PrepCatalystUsed ? (
                <RadioButtonCheckedIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </Box>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography
            variant="caption"
            sx={{ color: row.DashCatalystUsed ? '#77ff00' : undefined }}
          >
            <Box
              component="span"
              display="flex"
              alignItems="center"
              style={{ textTransform: 'capitalize' }}
            >
              {t(`advstats.${row.DashCatalystName}`)}
              {row.DashCatalystUsed ? (
                <RadioButtonCheckedIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </Box>
          </Typography>
        </TableCell>
        <TableCell>
          <Typography
            variant="caption"
            sx={{ color: row.CombatCatalystUsed ? '#77ff00' : undefined }}
          >
            <Box
              component="span"
              display="flex"
              alignItems="center"
              style={{ textTransform: 'capitalize' }}
            >
              {t(`advstats.${row.CombatCatalystName}`)}
              {row.CombatCatalystUsed ? (
                <RadioButtonCheckedIcon />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </Box>
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={17}>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                {t('advstats.AbilityHistory')}{' '}
                {t(`charNames.${row.character.replace(/:3/g, '')}`)}
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('advstats.AbilityName')}</TableCell>
                    <TableCell>{t('advstats.ActionType')}</TableCell>
                    <TableCell>{t('advstats.CastCount')}</TableCell>
                    <TableCell>{t('advstats.TotalAbsorb')}</TableCell>
                    <TableCell>{t('advstats.TotalDamage')}</TableCell>
                    <TableCell>{t('advstats.TotalEnergyGainOnSelf')}</TableCell>
                    <TableCell>
                      {t('advstats.TotalEnergyGainToOthers')}
                    </TableCell>
                    <TableCell>{t('advstats.TotalPotentialAbsorb')}</TableCell>
                    <TableCell>{t('advstats.TotalTargetsHit')}</TableCell>
                    <TableCell>{t('advstats.TauntCount')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.advancedstats.map((ability, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          <Tooltip
                            placement="left"
                            title={
                              <Typography variant="h6" component="div">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      abilitydata[
                                        `ability_${ability.ActionType}`
                                      ].debug_unlocalized_tooltip,
                                  }}
                                />
                              </Typography>
                            }
                          >
                            <div>{ability.AbilityName}</div>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{ability.ActionType + 1}</TableCell>
                        <TableCell>{ability.CastCount}</TableCell>
                        <TableCell>{ability.TotalAbsorb}</TableCell>
                        <TableCell>{ability.TotalDamage}</TableCell>
                        <TableCell>{ability.TotalEnergyGainOnSelf}</TableCell>
                        <TableCell>{ability.TotalEnergyGainToOthers}</TableCell>
                        <TableCell>{ability.TotalPotentialAbsorb}</TableCell>
                        <TableCell>{ability.TotalTargetsHit}</TableCell>
                        <TableCell>{ability.TauntCount}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function AdvancedDialog({
  game,
  loading,
  openAdvancedDialog,
  setOpenAdvancedDialog,
}: {
  game: Game | undefined;
  loading: boolean;
  openAdvancedDialog: boolean;
  setOpenAdvancedDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [openRow, setOpenRow] = useState<number | null>(null);

  const handleCloseDialog = () => {
    setOpenAdvancedDialog(false);
  };

  const handleToggle = (rowId: number) => {
    setOpenRow(openRow === rowId ? null : rowId);
  };

  return (
    <Dialog
      open={openAdvancedDialog}
      onClose={handleCloseDialog}
      fullWidth
      maxWidth={false}
    >
      <DialogTitle>Advanced Stats</DialogTitle>
      <DialogContent style={{ overflow: 'hidden', minHeight: '400px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          <TableContainer
            component={Paper}
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>{t('advstats.playerName')}</TableCell>
                  <TableCell>{t('stats.character')}</TableCell>
                  <TableCell>{t('advstats.TotalHealingReceived')}</TableCell>
                  <TableCell>{t('advstats.TotalPlayerAbsorb')}</TableCell>
                  <TableCell>{t('advstats.PowerupsCollected')}</TableCell>
                  {/* <TableCell>{t('advstats.DamageAvoidedByEvades')}</TableCell> */}
                  <TableCell>
                    {t('advstats.MyIncomingDamageReducedByCover')}
                  </TableCell>
                  <TableCell>
                    {t('advstats.MyOutgoingExtraDamageFromEmpowered')}
                  </TableCell>
                  <TableCell>
                    {t('advstats.MyOutgoingReducedDamageFromWeakened')}
                  </TableCell>
                  <TableCell>{t('advstats.MovementDeniedByMe')}</TableCell>
                  <TableCell>{t('advstats.EnemiesSightedPerTurn')}</TableCell>
                  <TableCell>{t('advstats.PrepCatalystName')}</TableCell>
                  <TableCell>{t('advstats.DashCatalystName')}</TableCell>
                  <TableCell>{t('advstats.CombatCatalystName')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {game?.stats.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    isOpen={openRow === row.id}
                    onToggle={() => handleToggle(row.id)}
                    game={game}
                    player={row}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AdvancedDialog;
