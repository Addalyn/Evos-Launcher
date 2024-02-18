import { CharacterType, MapType } from './Evos';

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
