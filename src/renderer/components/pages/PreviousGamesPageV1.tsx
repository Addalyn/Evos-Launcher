import EvosStore from 'renderer/lib/EvosStore';
import PreviousGamesPlayed from '../stats-v1/PreviousGamesPlayed';
import DiscordPage from './DiscordPage';

export default function PreviousGamesPage() {
  const { discordId } = EvosStore();

  if (discordId === 0) {
    return <DiscordPage />;
  }
  return <PreviousGamesPlayed />;
}
