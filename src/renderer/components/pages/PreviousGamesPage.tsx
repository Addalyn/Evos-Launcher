import React from 'react';
import EvosStore from 'renderer/lib/EvosStore';
import PreviousGamesPlayed from '../stats-unified/PreviousGamesPlayed';
import DiscordPage from './DiscordPage';
import ApiVersionToggle from '../generic/ApiVersionToggle';

/**
 * PreviousGamesPage component that conditionally renders either the Discord page
 * or the Previous Games Played component based on the user's Discord authentication status.
 *
 * This component serves as a router that checks if the user has a valid Discord ID.
 * If the Discord ID is 0 (indicating no authentication), it displays the Discord page
 * for the user to authenticate. Otherwise, it shows the previous games statistics.
 *
 * @returns {React.ReactElement} Either DiscordPage or PreviousGamesPlayed component
 */
export default function PreviousGamesPage(): React.ReactElement {
  const { discordId, apiVersion } = EvosStore();

  // If user is not authenticated with Discord (discordId === 0), show Discord page
  if (discordId === 0) {
    return <DiscordPage />;
  }

  // User is authenticated, show the previous games statistics with API version toggle
  return (
    <>
      <ApiVersionToggle />
      <PreviousGamesPlayed apiVersion={apiVersion} />
    </>
  );
}
