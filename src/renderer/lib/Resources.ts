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
