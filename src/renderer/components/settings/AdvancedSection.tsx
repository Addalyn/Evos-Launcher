import React from 'react';
import SectionCard from './SectionCard';
import { FormControlLabel, FormGroup, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = {
  enableDiscordRPC: string;
  toggleDiscord: () => void;
  showAllChat: string;
  setShowAllChatInternal: (v: string) => void;
  gameExpanded: string;
  setGameExpanded: (v: string) => void;
  ticketEnabled: string;
  setTicketEnabled: (v: string) => void;
  noLogEnabled: string;
  setNoLogEnabled: (v: string) => void;
};

export default function AdvancedSection({
  enableDiscordRPC,
  toggleDiscord,
  showAllChat,
  setShowAllChatInternal,
  gameExpanded,
  setGameExpanded,
  ticketEnabled,
  setTicketEnabled,
  noLogEnabled,
  setNoLogEnabled,
}: Props) {
  const { t } = useTranslation();
  return (
    <SectionCard title={t('settings.advanced', 'Advanced')}>
      <FormGroup>
        <FormControlLabel
          control={<Switch />}
          label={t('settings.labelDiscordRPC')}
          checked={enableDiscordRPC === 'true'}
          onChange={toggleDiscord}
        />
        <FormControlLabel
          control={<Switch />}
          label={t('settings.allChatLabel')}
          checked={showAllChat === 'true'}
          onChange={() =>
            setShowAllChatInternal(showAllChat === 'true' ? 'false' : 'true')
          }
        />
        <FormControlLabel
          control={<Switch />}
          label={t('settings.labelGameExpanded')}
          checked={gameExpanded === 'true'}
          onChange={() =>
            setGameExpanded(gameExpanded === 'true' ? 'false' : 'true')
          }
        />
        <FormControlLabel
          control={<Switch />}
          label={t('settings.labelTicket')}
          checked={ticketEnabled === 'true'}
          onChange={() =>
            setTicketEnabled(ticketEnabled === 'true' ? 'false' : 'true')
          }
        />
        <FormControlLabel
          control={<Switch />}
          label={t('settings.noLogLaunchOptionsLabel')}
          checked={noLogEnabled === 'true'}
          onChange={() =>
            setNoLogEnabled(noLogEnabled === 'true' ? 'false' : 'true')
          }
        />
      </FormGroup>
    </SectionCard>
  );
}
