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

/**
 * Represents detailed statistics for a specific ability used during a game.
 */
interface AbilityGameSummary {
  /** The class name of the ability */
  AbilityClassName: string;
  /** The display name of the ability */
  AbilityName: string;
  /** The action type/slot of the ability (0-based index) */
  ActionType: number;
  /** Number of times the ability was cast */
  CastCount: number;
  /** Name of the mod applied to this ability */
  ModName: string;
  /** Number of times the ability was used as a taunt */
  TauntCount: number;
  /** Total absorption provided by this ability */
  TotalAbsorb: number;
  /** Total damage dealt by this ability */
  TotalDamage: number;
  /** Total energy gained by the caster from this ability */
  TotalEnergyGainOnSelf: number;
  /** Total energy given to teammates by this ability */
  TotalEnergyGainToOthers: number;
  /** Total energy removed from enemies by this ability */
  TotalEnergyLossToOthers: number;
  /** Total healing provided by this ability */
  TotalHealing: number;
  /** Total potential absorption that could have been provided */
  TotalPotentialAbsorb: number;
  /** Total number of targets hit by this ability */
  TotalTargetsHit: number;
}

/**
 * Represents comprehensive player statistics for a single game.
 */
interface Player {
  /** Unique identifier for the player record */
  id: number;
  /** Identifier of the game this player participated in */
  game_id: number;
  /** Player's username */
  user: string;
  /** Character played by the player */
  character: string;
  /** Number of enemy takedowns */
  takedowns: number;
  /** Number of deaths */
  deaths: number;
  /** Number of final killing blows dealt */
  deathblows: number;
  /** Total damage dealt */
  damage: number;
  /** Total healing provided */
  healing: number;
  /** Total damage received */
  damage_received: number;
  /** Record creation timestamp */
  createdAt: string;
  /** Record last update timestamp */
  updatedAt: string;
  /** Team assignment (TeamA or TeamB) */
  team: string;
  /** Total healing received from all sources */
  TotalHealingReceived: number;
  /** Total absorption shields gained */
  TotalPlayerAbsorb: number;
  /** Number of powerups collected during the game */
  PowerupsCollected: number;
  /** Damage avoided through evasion mechanics */
  DamageAvoidedByEvades: number;
  /** Incoming damage reduced by cover mechanics */
  MyIncomingDamageReducedByCover: number;
  /** Extra outgoing damage from empowered status */
  MyOutgoingExtraDamageFromEmpowered: number;
  /** Reduced outgoing damage from weakened status */
  MyOutgoingReducedDamageFromWeakened: number;
  /** Movement abilities denied to enemies */
  MovementDeniedByMe: number;
  /** Average enemies sighted per turn */
  EnemiesSightedPerTurn: number;
  /** Whether a dash catalyst was used */
  DashCatalystUsed: boolean;
  /** Name of the dash catalyst used */
  DashCatalystName: string;
  /** Whether a combat catalyst was used */
  CombatCatalystUsed: boolean;
  /** Name of the combat catalyst used */
  CombatCatalystName: string;
  /** Whether a prep catalyst was used */
  PrepCatalystUsed: boolean;
  /** Name of the prep catalyst used */
  PrepCatalystName: string;
  /** Detailed statistics for each ability used */
  advancedstats: AbilityGameSummary[];
  /** Whether this player dealt the most damage */
  Deadliest: boolean;
  /** Whether this player provided the most support */
  Supportiest: boolean;
  /** Whether this player tanked the most damage */
  Tankiest: boolean;
  /** Whether this player earned the most decorations/achievements */
  MostDecorated: boolean;
}

/**
 * Represents a complete game record with all associated player statistics.
 */
interface Game {
  /** Unique identifier for the game */
  id: number;
  /** Date when the game was played */
  date: string;
  /** Game session identifier */
  gameid: number;
  /** Which team won the game (TeamA or TeamB) */
  teamwin: string;
  /** Number of turns the game lasted */
  turns: number;
  /** Final score of the game */
  score: string;
  /** Map on which the game was played */
  map: string;
  /** Array of all player statistics for this game */
  stats: Player[];
  /** Type of game mode played */
  gametype: string;
  /** Server where the game was hosted */
  server: string;
  /** Game version */
  version: string;
  /** Discord channel identifier where the game was reported */
  channelid: string;
  /** Record creation timestamp */
  createdAt: string;
  /** Game server process code */
  GameServerProcessCode: string;
}

/**
 * Type for objects that can be normalized (primitive values, arrays, or objects)
 */
type NormalizableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | NormalizableValue[]
  | { [key: string]: NormalizableValue };

/**
 * Type for the abilities data structure after normalization
 */
type AbilitiesData = {
  [characterName: string]: {
    [abilityKey: string]: {
      debug_unlocalized_tooltip: string;
      [key: string]: NormalizableValue;
    };
  };
};

/**
 * Recursively normalizes all object keys to lowercase.
 * This utility function ensures consistent key casing for data comparison.
 *
 * @param obj - The object to normalize (can be nested objects or arrays)
 * @returns The object with all keys converted to lowercase
 */
const normalizeKeys = (obj: NormalizableValue): NormalizableValue => {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }

  return Object.keys(obj).reduce(
    (acc: { [key: string]: NormalizableValue }, key) => {
      acc[key.toLowerCase()] = normalizeKeys(obj[key]);
      return acc;
    },
    {},
  );
};

/** Normalized ability data with lowercase keys for consistent lookups */
const abilitiesLowercased = normalizeKeys(abilitys) as AbilitiesData;

/** CSS class for winning team background color */
const WINNING_TEAM_BG_COLOR = '#22c9554f';

/** CSS class for losing team background color */
const LOSING_TEAM_BG_COLOR = '#ff423a4f';

/** Color for active/used catalyst indicators */
const ACTIVE_CATALYST_COLOR = '#77ff00';

/**
 * Determines the background color for a player row based on their team and game outcome.
 *
 * @param game - The game data containing winning team information
 * @param player - The player data containing team assignment
 * @returns CSS color string for the row background
 */
const getPlayerRowBackgroundColor = (game: Game, player: Player): string => {
  const isWinningTeam =
    (game.teamwin === 'TeamA' && player.team === 'TeamA') ||
    (game.teamwin === 'TeamB' && player.team === 'TeamB');

  return isWinningTeam ? WINNING_TEAM_BG_COLOR : LOSING_TEAM_BG_COLOR;
};

/**
 * Renders a catalyst indicator with proper styling and icon.
 *
 * @param catalystName - Name of the catalyst
 * @param isUsed - Whether the catalyst was used
 * @returns JSX element for the catalyst display
 */
const renderCatalystIndicator = (catalystName: string, isUsed: boolean) => (
  <Typography
    variant="caption"
    sx={{ color: isUsed ? ACTIVE_CATALYST_COLOR : undefined }}
  >
    <Box
      component="span"
      display="flex"
      alignItems="center"
      style={{ textTransform: 'capitalize' }}
    >
      {t(`advstats.${catalystName}`)}
      {isUsed ? <RadioButtonCheckedIcon /> : <RadioButtonUncheckedIcon />}
    </Box>
  </Typography>
);

/**
 * Gets the ability data for a given character from the normalized abilities JSON.
 *
 * @param characterName - The character name to look up
 * @returns The ability data object for the character, or undefined if not found
 */
const getAbilityData = (characterName: string) => {
  const legacyName =
    convertToLegacyName(
      characterName.replace(/:3/g, '') as string,
    )?.toLowerCase() || '';
  return abilitiesLowercased[legacyName];
};

/**
 * Renders a tooltip with ability information.
 *
 * @param ability - The ability data
 * @param abilityData - The character's ability data from JSON
 * @returns JSX element for the ability tooltip
 */
const renderAbilityTooltip = (
  ability: AbilityGameSummary,
  abilityData: AbilitiesData[string] | undefined,
) => {
  if (!abilityData) {
    return <div>{ability.AbilityName}</div>;
  }

  const abilityInfo = abilityData[`ability_${ability.ActionType}`];
  if (
    !abilityInfo ||
    typeof abilityInfo !== 'object' ||
    !('debug_unlocalized_tooltip' in abilityInfo)
  ) {
    return <div>{ability.AbilityName}</div>;
  }

  return (
    <Tooltip
      placement="left"
      title={
        <Typography variant="h6" component="div">
          <div
            dangerouslySetInnerHTML={{
              __html: abilityInfo.debug_unlocalized_tooltip,
            }}
          />
        </Typography>
      }
    >
      <div>{ability.AbilityName}</div>
    </Tooltip>
  );
};

/**
 * Props for the expandable table row component that displays player statistics.
 */
interface RowProps {
  /** Player data to display in the row */
  row: Player;
  /** Whether the row is currently expanded */
  isOpen: boolean;
  /** Game data for context */
  game: Game;
  /** Player data (duplicate of row for legacy compatibility) */
  player: Player;
  /** Callback function to toggle row expansion */
  onToggle: () => void;
}

/**
 * Expandable table row component that displays player statistics and advanced ability data.
 * Shows basic stats in the main row and detailed ability breakdown when expanded.
 *
 * @param props - Component props
 * @returns JSX element representing the table row
 */
function Row(props: RowProps) {
  const { row, isOpen, onToggle, game, player } = props;
  const abilitydata = getAbilityData(row.character);

  return (
    <>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          backgroundColor: getPlayerRowBackgroundColor(game, player),
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
          {renderCatalystIndicator(row.PrepCatalystName, row.PrepCatalystUsed)}
        </TableCell>
        <TableCell>
          {renderCatalystIndicator(row.DashCatalystName, row.DashCatalystUsed)}
        </TableCell>
        <TableCell>
          {renderCatalystIndicator(
            row.CombatCatalystName,
            row.CombatCatalystUsed,
          )}
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
                  {row.advancedstats.map(
                    (ability: AbilityGameSummary, index: number) => {
                      return (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {renderAbilityTooltip(ability, abilitydata)}
                          </TableCell>
                          <TableCell>{ability.ActionType + 1}</TableCell>
                          <TableCell>{ability.CastCount}</TableCell>
                          <TableCell>{ability.TotalAbsorb}</TableCell>
                          <TableCell>{ability.TotalDamage}</TableCell>
                          <TableCell>{ability.TotalEnergyGainOnSelf}</TableCell>
                          <TableCell>
                            {ability.TotalEnergyGainToOthers}
                          </TableCell>
                          <TableCell>{ability.TotalPotentialAbsorb}</TableCell>
                          <TableCell>{ability.TotalTargetsHit}</TableCell>
                          <TableCell>{ability.TauntCount}</TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Props for the AdvancedDialog component.
 */
interface AdvancedDialogProps {
  /** Game data to display, undefined if no game is selected */
  game: Game | undefined;
  /** Whether the dialog is currently loading data */
  loading: boolean;
  /** Whether the advanced dialog is currently open */
  openAdvancedDialog: boolean;
  /** Function to control the dialog open state */
  setOpenAdvancedDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Advanced statistics dialog component that displays detailed game and player statistics.
 * Features an expandable table showing player stats with collapsible ability details.
 *
 * @param props - Component props
 * @returns JSX element representing the advanced stats dialog
 */
function AdvancedDialog({
  game,
  loading,
  openAdvancedDialog,
  setOpenAdvancedDialog,
}: AdvancedDialogProps) {
  const [openRow, setOpenRow] = useState<number | null>(null);

  /**
   * Handles closing the advanced statistics dialog.
   */
  const handleCloseDialog = () => {
    setOpenAdvancedDialog(false);
  };

  /**
   * Handles toggling the expansion state of a table row.
   *
   * @param rowId - The ID of the row to toggle
   */
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

/**
 * Export the AdvancedDialog component as the default export.
 * This component provides a comprehensive view of advanced game statistics
 * including player performance metrics and detailed ability usage breakdowns.
 */
export default AdvancedDialog;
