import { CharacterType, MapType } from './Evos';

export enum BannerType {
  background = 'Background',
  foreground = 'Foreground',
}

const path = !window.electron.isPackaged
  ? 'https://raw.githubusercontent.com/Addalyn/Evos-Launcher/main/assets'
  : '../../../assets';

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
  if (characterType === CharacterType.None) {
    return `${path}/logo.png`;
  }
  return `${path}/img/characters/icons/${characterType}.png`;
}

export function mapMiniPic(map: MapType) {
  return `${path}/img/maps/mini/${map}.png`;
}
