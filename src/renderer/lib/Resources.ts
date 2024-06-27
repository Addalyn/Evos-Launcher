import { CharacterType, MapType } from './Evos';

import mods from './Mods.json';

interface Mod {
  default: boolean;
  display_name: string;
  equip_cost: number;
  tooltip_unlocalized: string;
}

interface Ability {
  [mod: string]: Mod;
}

interface CharacterAbilities {
  [ability: string]: Ability;
}

interface CharacterMods {
  [character: string]: CharacterAbilities;
}

const modsData: CharacterMods = mods;

export enum BannerType {
  background = 'Background',
  foreground = 'Foreground',
}

const path = window?.electron?.isPackaged
  ? '../../../assets'
  : 'https://raw.githubusercontent.com/Addalyn/Evos-Launcher/main/assets';

export function logo() {
  return `${path}/img/logo.png`;
}

export function logoSmall() {
  return `${path}/logo.png`;
}

export function playerBanner(type: BannerType, id: number) {
  return `${path}/img/banners/${type}/${id}.png`;
}

export function characterIcon(characterType: CharacterType) {
  return `${path}/img/characters/icons/${characterType}.png`;
}

export function mapMiniPic(map: MapType) {
  return `${path}/img/maps/mini/${map}.png`;
}

export function trustIcon(trust: string) {
  return `${path}/img/trusts/TrustIcon_${trust}.png`;
}

export function catalystsIcon(catalyst: Number) {
  const catalystNames: { [key: number]: string } = {
    26: 'Echo_Boost',
    1: 'Adrenaline',
    29: 'Chronosurge',
    5: 'Shift',
    22: 'Fetter',
    23: 'Fade',
    24: 'Regroup',
    7: 'Brain_Juice',
    20: 'Probe',
    8: 'Second_Wind',
    10: 'Critical_Shot',
    12: 'Regenergy',
    17: 'Tether',
    18: 'Turtle_Tech', // not used
    21: 'Adrenaline',
    30: 'Brain_Juice',
    31: 'Second_Wind',
  };

  const catalystName = catalystNames[catalyst as number];
  return `${path}/img/catalysts/Catalyst-${catalystName}.webp`;
}

export function convertToRealName(internalName: string): string | undefined {
  switch (internalName.toLowerCase()) {
    case 'archer':
      return 'Khita';
    case 'battlemonk':
      return 'Asana';
    case 'bazookagirl':
      return 'Zuki';
    case 'blaster':
      return 'Elle';
    case 'claymore':
      return 'Titus';
    case 'cleric':
      return 'Meridian';
    case 'digitalsorceress':
      return 'Aurora';
    case 'dinolancer':
      return 'Magnus';
    case 'exo':
      return 'Juno';
    case 'fireborg':
      return 'Lex';
    case 'fishman':
      return 'Dr. Finn';
    case 'gremlins':
      return 'Gremolitions Inc.';
    case 'gryd':
      return 'Unreleased';
    case 'iceborg':
      return 'Vonn';
    case 'manta':
      return 'Phaedra';
    case 'martyr':
      return 'Orion';
    case 'nanosmith':
      return 'Helio';
    case 'neko':
      return 'Nev';
    case 'ragebeast':
      return 'Rask';
    case 'rampart':
      return 'Rampart';
    case 'robotanimal':
      return 'Pup';
    case 'samurai':
      return 'Tol-Ren';
    case 'scamp':
      return 'Isadora';
    case 'luckyscoundrel':
      return 'Lockwood';
    case 'sensei':
      return 'Su-Ren';
    case 'sniper':
      return 'Nix';
    case 'soldier':
      return 'Blackburn';
    case 'spacemarine':
      return 'Garrison';
    case 'spark':
      return 'Quark';
    case 'teleportingninja':
      return 'Kaigin';
    case 'thief':
      return 'Celeste';
    case 'tracker':
      return 'Grey';
    case 'trickster':
      return 'Oz';
    case 'valkyrie':
      return 'Brynn';
    default:
      return 'Unknown';
  }
}

export function convertToLegacyName(internalName: string): string | undefined {
  switch (internalName.toLowerCase()) {
    case 'khita':
      return 'archer';
    case 'asana':
      return 'battleMonk';
    case 'zuki':
      return 'bazookaGirl';
    case 'elle':
      return 'blaster';
    case 'titus':
      return 'claymore';
    case 'meridian':
      return 'cleric';
    case 'aurora':
      return 'digitalSorceress';
    case 'magnus':
      return 'dinolancer';
    case 'juno':
      return 'exo';
    case 'lex':
      return 'fireborg';
    case 'dr. finn':
      return 'fishMan';
    case 'gremolitions inc.':
      return 'gremlins';
    case 'unreleased':
      return 'gryd';
    case 'vonn':
      return 'iceborg';
    case 'phaedra':
      return 'manta';
    case 'orion':
      return 'martyr';
    case 'helio':
      return 'nanoSmith';
    case 'nev':
      return 'neko';
    case 'rask':
      return 'rageBeast';
    case 'rampart':
      return 'rampart';
    case 'pup':
      return 'robotAnimal';
    case 'tol-ren':
      return 'samurai';
    case 'isadora':
      return 'scamp';
    case 'lockwood':
      return 'luckyScoundrel';
    case 'su-ren':
      return 'sensei';
    case 'nix':
      return 'sniper';
    case 'blackburn':
      return 'soldier';
    case 'garrison':
      return 'spaceMarine';
    case 'quark':
      return 'spark';
    case 'kaigin':
      return 'teleportingNinja';
    case 'celeste':
      return 'thief';
    case 'grey':
      return 'tracker';
    case 'oz':
      return 'trickster';
    case 'brynn':
      return 'valkyrie';
    default:
      return 'unknown';
  }
}

export function abilityIcon(character: string, abilityNr: number) {
  const abilityNames = [
    'ability1',
    'ability2',
    'ability3',
    'ability4',
    'ability5',
  ][abilityNr - 1];

  const imagePath = `${path}/img/characters/abilities/${convertToLegacyName(character)}_${abilityNames}.png`;

  return imagePath;
}

interface AbilityTooltip {
  tooltip: string;
  title: string;
}

export function ability(
  character: string,
  abilityNr: number,
  modNr: number,
): AbilityTooltip {
  const characterName = convertToLegacyName(character.toLowerCase()) as string;

  if (characterName === 'unknown' || !modsData[characterName]) {
    return {
      tooltip: 'Tooltip not available',
      title: '',
    };
  }

  const abilityKey = `ABILITY_${abilityNr}`;
  const modKey = `${modNr}`;
  if (
    !modsData[characterName][abilityKey] ||
    !modsData[characterName][abilityKey][modKey]
  ) {
    return {
      tooltip: 'None',
      title: '',
    };
  }
  const tooltipName =
    modsData[characterName][abilityKey][modKey].tooltip_unlocalized;
  const displayName = modsData[characterName][abilityKey][modKey].display_name;

  return {
    tooltip: tooltipName,
    title: displayName,
  };
}
